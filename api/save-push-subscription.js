// /api/save-push-subscription.js
// Edge function — saves or clears a user's push subscription + bill due days in Supabase.

export const config = { runtime: 'edge' };

function sbHeaders() {
  return {
    apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
    Prefer: 'return=minimal',
  };
}

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const { userId, subscription, billDueDays, enabled } = body;

  if (!userId) {
    return new Response(JSON.stringify({ error: 'Missing userId' }), { status: 400 });
  }

  // Build update payload
  const updates = { bill_reminders: !!enabled };

  if (subscription) {
    updates.push_endpoint = subscription.endpoint;
    updates.push_p256dh   = subscription.keys?.p256dh || null;
    updates.push_auth     = subscription.keys?.auth || null;
  } else {
    // Disabling — clear push credentials
    updates.push_endpoint = null;
    updates.push_p256dh   = null;
    updates.push_auth     = null;
  }

  if (billDueDays !== undefined) {
    updates.bill_due_days = billDueDays; // JSON array of {name, dueDay}
  }

  const url = `${process.env.SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`;
  const resp = await fetch(url, {
    method: 'PATCH',
    headers: sbHeaders(),
    body: JSON.stringify(updates),
  });

  if (!resp.ok) {
    const text = await resp.text();
    return new Response(JSON.stringify({ error: text }), { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
