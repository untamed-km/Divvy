// /api/create-checkout-session.js
// Edge function — creates a Stripe Checkout session and returns the redirect URL.

export const config = { runtime: 'edge' };

const PRICE_IDS = {
  solo:    { monthly: 'price_1ThzDb0qsJiycjN9pJxs93hG', annual: 'price_1ThzJH0qsJiycjN9JJqAVf4P' },
  couples: { monthly: 'price_1ThzGA0qsJiycjN9EypTBY26', annual: 'price_1ThzJv0qsJiycjN9yh7LEb8u' },
};

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: CORS });
  }

  let tier, cadence, userId;
  try {
    ({ tier, cadence, userId } = await req.json());
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: CORS });
  }

  if (!PRICE_IDS[tier]?.[cadence]) {
    return new Response(JSON.stringify({ error: 'Invalid tier or cadence' }), { status: 400, headers: CORS });
  }
  if (!userId) {
    return new Response(JSON.stringify({ error: 'User not authenticated' }), { status: 401, headers: CORS });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return new Response(JSON.stringify({ error: 'Stripe not configured' }), { status: 500, headers: CORS });
  }

  const priceId = PRICE_IDS[tier][cadence];
  const origin = 'https://distrofi.org';

  // Build form-encoded body for Stripe REST API
  const params = new URLSearchParams({
    mode: 'subscription',
    'line_items[0][price]': priceId,
    'line_items[0][quantity]': '1',
    client_reference_id: userId,
    'subscription_data[trial_period_days]': '7',
    'subscription_data[metadata][tier]': tier,
    allow_promotion_codes: 'true',
    success_url: `${origin}/?stripe=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/?stripe=cancel`,
  });

  const resp = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${stripeKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  const session = await resp.json();

  if (!resp.ok) {
    console.error('Stripe error:', session.error);
    return new Response(
      JSON.stringify({ error: session.error?.message || 'Stripe error' }),
      { status: 502, headers: CORS }
    );
  }

  return new Response(JSON.stringify({ url: session.url }), { status: 200, headers: CORS });
}
