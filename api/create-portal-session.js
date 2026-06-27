// /api/create-portal-session.js
// Edge function — creates a Stripe Customer Portal session for an authenticated user.

export const config = { runtime: 'edge' };

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

  let userId;
  try {
    ({ userId } = await req.json());
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: CORS });
  }

  if (!userId) {
    return new Response(JSON.stringify({ error: 'User not authenticated' }), { status: 401, headers: CORS });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!stripeKey || !supabaseUrl || !supabaseKey) {
    return new Response(JSON.stringify({ error: 'Server not configured' }), { status: 500, headers: CORS });
  }

  // Look up stripe_customer_id from Supabase
  const profileResp = await fetch(
    `${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=stripe_customer_id`,
    {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    }
  );

  const [profile] = await profileResp.json();
  const customerId = profile?.stripe_customer_id;

  if (!customerId) {
    return new Response(
      JSON.stringify({ error: 'No active subscription found. Please subscribe first.' }),
      { status: 404, headers: CORS }
    );
  }

  // Create Stripe billing portal session
  const params = new URLSearchParams({
    customer: customerId,
    return_url: 'https://distrofi.org/app',
  });

  const portalResp = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${stripeKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  const session = await portalResp.json();

  if (!portalResp.ok) {
    console.error('Stripe portal error:', session.error);
    return new Response(
      JSON.stringify({ error: session.error?.message || 'Could not open billing portal' }),
      { status: 502, headers: CORS }
    );
  }

  return new Response(JSON.stringify({ url: session.url }), { status: 200, headers: CORS });
}
