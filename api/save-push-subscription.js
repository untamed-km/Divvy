// /api/save-push-subscription.js
// Edge function — saves a user's reminder settings, push subscription, bill due days
// and current pay-period end date in Supabase.
//
// Body fields (all optional except userId):
//   subscription       push subscription JSON — saved when present
//   clearSubscription  true → clear push credentials (client sends this only when
//                      bill AND pay-period reminders are both off)
//   enabled            bill reminders on/off
//   cycleReminders     pay-period reminders on/off
//   billDueDays        [{name, dueDay}]
//   cycleEndDate       'yyyy-mm-dd'
//
// Push credentials are never cleared implicitly. (Before 2026-09-29 any call without
// a subscription wiped them, so reminders silently stopped after the first bill edit.)

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

  const { userId, subscription, clearSubscription, billDueDays, enabled, cycleReminders } = body;

  if (!userId) {
    return new Response(JSON.stringify({ error: 'Missing userId' }), { status: 400 });
  }

  const updates = {};

  if (enabled !== undefined) updates.bill_reminders = !!enabled;
  if (cycleReminders !== undefined) updates.cycle_reminders = !!cycleReminders;

  if (subscription && subscription.endpoint) {
    updates.push_endpoint = subscription.endpoint;
    updates.push_p256dh   = subscription.keys?.p256dh || null;
    updates.push_auth     = subscription.keys?.auth || null;
  } else if (clearSubscription === true) {
    updates.push_endpoint = null;
    updates.push_p256dh   = null;
    updates.push_auth     = null;
  }

  if (billDueDays !== undefined) {
    updates.bill_due_days = billDueDays; // JSON array of {name, dueDay}
  }

  if (body.cycleEndDate !== undefined) {
    updates.cycle_end_date = body.cycleEndDate || null; // yyyy-mm-dd
  }

  if (Object.keys(updates).length === 0) {
    return new Response(JSON.stringify({ ok: true, unchanged: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
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
