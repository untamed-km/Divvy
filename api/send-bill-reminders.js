// /api/send-bill-reminders.js
// Vercel cron job — runs daily at 9am UTC.
// Sends two kinds of push notifications to users with a push subscription:
//   • Bill reminders (bill_reminders = true): bills due today or in 3 days.
//   • Pay-period reminders (cycle_reminders = true):
//       - the day before the period ends  → "Your pay period ends tomorrow"
//       - the first run after it ends     → "Time to start your new pay period"
//     Each is sent once per period end date (cycle_end_warned / cycle_end_notified).

import webpush from 'web-push';

webpush.setVapidDetails(
  'mailto:support@distrofi.org',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const APP_URL = '/app';

function sbHeaders() {
  return {
    apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
  };
}

// Returns day-of-month numbers to trigger reminders for (today and today+3)
function getReminderDays() {
  const now = new Date();
  const today = now.getDate();

  // today+3, wrapping into next month correctly
  const future = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3);
  const threeDaysOut = future.getDate();

  // Deduplicate in case they land on the same day (edge case near month boundary)
  return [...new Set([today, threeDaysOut])];
}

function buildMessage(bill, daysUntil) {
  if (daysUntil === 0) {
    return { title: `${bill.name} is due today`, body: `Don't forget to pay ${bill.name}.` };
  }
  return { title: `${bill.name} due in ${daysUntil} days`, body: `${bill.name} is coming up. Open DistroFi to review.` };
}

// 'yyyy-mm-dd' minus one day, in UTC (date-only arithmetic, no timezone drift).
function dayBefore(iso) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

// Pure decision: which pay-period pushes are due for this user today?
// Returns [{ kind: 'warn'|'ended', column, payload }]
export function cycleActions(todayStr, user) {
  const end = user.cycle_end_date;
  if (!end || user.cycle_reminders === false) return [];
  const actions = [];
  if (todayStr === dayBefore(end) && user.cycle_end_warned !== end) {
    actions.push({
      kind: 'warn',
      column: 'cycle_end_warned',
      payload: {
        title: 'Your pay period ends tomorrow',
        body: 'Log any last spending today so your numbers are right before the new period starts.',
        tag: `cycle-warn-${end}`,
        url: APP_URL,
      },
    });
  }
  if (todayStr > end && user.cycle_end_notified !== end) {
    actions.push({
      kind: 'ended',
      column: 'cycle_end_notified',
      payload: {
        title: 'Time to start your new pay period',
        body: 'Your last pay period has ended. Open DistroFi to review it and start the next one.',
        tag: `cycle-end-${end}`,
        url: APP_URL,
      },
    });
  }
  return actions;
}

async function patchProfile(userId, fields) {
  await fetch(`${process.env.SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
    method: 'PATCH',
    headers: sbHeaders(),
    body: JSON.stringify(fields),
  });
}

// Sends one push. Returns 'ok', 'expired' (subscription gone, credentials cleared) or 'error'.
async function sendPush(user, subscription, payload) {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    return 'ok';
  } catch (e) {
    console.error(`Push failed for user ${user.id}:`, e.statusCode, e.body);
    // 404/410 = subscription expired — clear it so we stop trying
    if (e.statusCode === 404 || e.statusCode === 410) {
      await patchProfile(user.id, { push_endpoint: null, push_p256dh: null, push_auth: null });
      return 'expired';
    }
    return 'error';
  }
}

export default async function handler(req, res) {
  // Allow Vercel cron (GET) or manual POST trigger
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).end();
  }

  // Security: verify cron secret to prevent unauthorized triggers
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers['authorization'] || '';
    if (auth !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  const reminderDays = getReminderDays();
  const today = new Date().getDate();
  const todayStr = new Date().toISOString().slice(0, 10);

  // Users with a push subscription and at least one reminder type on
  const url = `${process.env.SUPABASE_URL}/rest/v1/profiles?push_endpoint=not.is.null&or=(bill_reminders.eq.true,cycle_reminders.eq.true)&select=id,push_endpoint,push_p256dh,push_auth,bill_reminders,cycle_reminders,bill_due_days,cycle_end_date,cycle_end_notified,cycle_end_warned`;
  const resp = await fetch(url, { headers: sbHeaders() });

  if (!resp.ok) {
    console.error('Supabase fetch failed:', await resp.text());
    return res.status(500).json({ error: 'Supabase error' });
  }

  const users = await resp.json();
  console.log(`Processing ${users.length} users for reminders`);

  let sent = 0;
  let errors = 0;

  for (const user of users) {
    const subscription = {
      endpoint: user.push_endpoint,
      keys: { p256dh: user.push_p256dh, auth: user.push_auth },
    };
    let expired = false;

    // ── Pay-period reminders ──
    for (const action of cycleActions(todayStr, user)) {
      const r = await sendPush(user, subscription, action.payload);
      if (r === 'ok') {
        sent++;
        await patchProfile(user.id, { [action.column]: user.cycle_end_date });
      } else {
        errors++;
        if (r === 'expired') { expired = true; break; }
      }
    }
    if (expired) continue;

    // ── Bill reminders ──
    if (!user.bill_reminders) continue;
    const billDueDays = user.bill_due_days;
    if (!Array.isArray(billDueDays) || billDueDays.length === 0) continue;

    // Find bills due today or in 3 days
    const toNotify = billDueDays.filter(b => reminderDays.includes(b.dueDay));

    for (const bill of toNotify) {
      const daysUntil = bill.dueDay === today ? 0 : 3;
      const r = await sendPush(user, subscription, {
        ...buildMessage(bill, daysUntil),
        tag: `bill-${bill.name.toLowerCase().replace(/\s+/g, '-')}-${bill.dueDay}`,
        url: APP_URL,
      });
      if (r === 'ok') sent++;
      else {
        errors++;
        if (r === 'expired') break;
      }
    }
  }

  console.log(`Reminders sent: ${sent}, errors: ${errors}`);
  return res.status(200).json({ sent, errors, users: users.length });
}
