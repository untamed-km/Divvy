// /api/stripe-webhook.js
// Node.js runtime — verifies Stripe webhook signature and updates Supabase.
// bodyParser must be disabled so we can verify the raw request body.

const PRICE_TO_TIER = {
  'price_1ThzDb0qsJiycjN9pJxs93hG': 'solo',    // Solo monthly
  'price_1ThzJH0qsJiycjN9JJqAVf4P': 'solo',    // Solo annual
  'price_1ThzGA0qsJiycjN9EypTBY26': 'couples', // Couples monthly
  'price_1ThzJv0qsJiycjN9yh7LEb8u': 'couples', // Couples annual
};

// ── Stripe signature verification (no npm package needed) ────────────────────
async function verifyStripeSignature(rawBody, sigHeader, secret) {
  const parts = Object.fromEntries(
    sigHeader.split(',').map(p => { const [k, ...v] = p.split('='); return [k, v.join('=')]; })
  );
  const timestamp = parts.t;
  const v1 = parts.v1;
  if (!timestamp || !v1) return false;

  // Reject if timestamp is >5 minutes old
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;

  const signedPayload = `${timestamp}.${rawBody}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sigBytes = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedPayload));
  const computed = Array.from(new Uint8Array(sigBytes))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  // Timing-safe comparison
  if (computed.length !== v1.length) return false;
  let diff = 0;
  for (let i = 0; i < computed.length; i++) diff |= computed.charCodeAt(i) ^ v1.charCodeAt(i);
  return diff === 0;
}

// ── Supabase REST helpers ────────────────────────────────────────────────────
function sbHeaders() {
  return {
    apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
    Prefer: 'return=minimal',
  };
}

async function sbPatch(filter, updates) {
  const url = `${process.env.SUPABASE_URL}/rest/v1/profiles?${filter}`;
  const resp = await fetch(url, {
    method: 'PATCH',
    headers: sbHeaders(),
    body: JSON.stringify(updates),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Supabase PATCH failed: ${resp.status} ${text}`);
  }
}

async function sbFindByCustomer(customerId) {
  const url = `${process.env.SUPABASE_URL}/rest/v1/profiles?stripe_customer_id=eq.${encodeURIComponent(customerId)}&select=id`;
  const resp = await fetch(url, { headers: sbHeaders() });
  if (!resp.ok) return null;
  const rows = await resp.json();
  return rows[0]?.id || null;
}

async function sbGet(path) {
  const url = `${process.env.SUPABASE_URL}/rest/v1/${path}`;
  const resp = await fetch(url, { headers: sbHeaders() });
  if (!resp.ok) return null;
  const rows = await resp.json();
  return rows[0] || null;
}

async function applyReferralReward(userId) {
  const couponId = process.env.STRIPE_REFERRAL_COUPON_ID;
  if (!couponId) return;

  const profile = await sbGet(`profiles?id=eq.${userId}&select=referred_by,referral_reward_given`);
  if (!profile?.referred_by || profile?.referral_reward_given) return;

  const referrer = await sbGet(`profiles?id=eq.${profile.referred_by}&select=stripe_subscription_id`);

  if (referrer?.stripe_subscription_id) {
    const stripeResp = await fetch(`https://api.stripe.com/v1/subscriptions/${referrer.stripe_subscription_id}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ coupon: couponId }).toString(),
    });
    if (stripeResp.ok) {
      console.log(`Referral reward applied to referrer ${profile.referred_by}`);
    } else {
      const err = await stripeResp.json();
      console.error('Referral coupon error:', err.error?.message);
    }
  }

  // Mark reward given regardless — prevents double-reward on retry
  await sbPatch(`id=eq.${userId}`, { referral_reward_given: true });
}

async function getSubscriptionTier(subscriptionId) {
  const resp = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
    headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` },
  });
  if (!resp.ok) return 'solo';
  const sub = await resp.json();
  const priceId = sub.items?.data?.[0]?.price?.id;
  return PRICE_TO_TIER[priceId] || 'solo';
}

// ── Main handler ─────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end('Method not allowed');
  }

  // Read raw body
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const rawBody = Buffer.concat(chunks).toString('utf8');

  const sigHeader = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sigHeader || !webhookSecret) {
    return res.status(400).json({ error: 'Missing signature or webhook secret' });
  }

  let valid = false;
  try {
    valid = await verifyStripeSignature(rawBody, sigHeader, webhookSecret);
  } catch (e) {
    console.error('Signature verification error:', e);
  }

  if (!valid) {
    console.error('Invalid Stripe signature');
    return res.status(400).json({ error: 'Invalid signature' });
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  console.log(`Stripe event: ${event.type}`);

  try {
    // ── Successful checkout ──────────────────────────────────────────────────
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userId = session.client_reference_id;
      const customerId = session.customer;
      const subscriptionId = session.subscription;

      if (!userId) {
        console.error('No client_reference_id in session');
        return res.status(200).json({ received: true });
      }

      const tier = subscriptionId
        ? await getSubscriptionTier(subscriptionId)
        : (session.metadata?.tier || 'solo');

      await sbPatch(`id=eq.${userId}`, {
        pro_tier: tier,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        pro_since: new Date().toISOString(),
        cancelled_at: null,
      });

      console.log(`Activated ${tier} for user ${userId}`);
    }

    // ── Subscription renewed (keep pro_tier fresh) ───────────────────────────
    else if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object;
      if (invoice.billing_reason !== 'subscription_cycle') {
        return res.status(200).json({ received: true });
      }
      const customerId = invoice.customer;
      const userId = await sbFindByCustomer(customerId);
      if (userId) {
        await sbPatch(`id=eq.${userId}`, { cancelled_at: null, payment_past_due: false });
        // Apply referral reward to referrer on first payment (idempotent)
        await applyReferralReward(userId);
      }
    }

    // ── Subscription cancelled ───────────────────────────────────────────────
    else if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object;
      const customerId = sub.customer;
      const userId = await sbFindByCustomer(customerId);
      if (userId) {
        await sbPatch(`id=eq.${userId}`, {
          pro_tier: null,
          stripe_subscription_id: null,
          cancelled_at: new Date().toISOString(),
        });
        console.log(`Deactivated Pro for user ${userId}`);
      }
    }

    // ── Payment failed — flag the account, Stripe will retry ────────────────
    else if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object;
      const customerId = invoice.customer;
      const userId = await sbFindByCustomer(customerId);
      if (userId) {
        await sbPatch(`id=eq.${userId}`, { payment_past_due: true });
        console.log(`Payment failed for user ${userId} — flagged as past due`);
      }
    }

  } catch (e) {
    console.error('Webhook handler error:', e);
    return res.status(500).json({ error: 'Internal error' });
  }

  return res.status(200).json({ received: true });
}

export const config = {
  api: { bodyParser: false },
};
