// /api/send-bill-reminders.js
// Vercel cron job — runs daily at 9am UTC.
// Finds users with bill reminders enabled and sends push notifications
// for bills due today or in 3 days.

import webpush from 'web-push';

webpush.setVapidDetails(
  'mailto:support@distrofi.org',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

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
  const threeDayTarget = reminderDays.find(d => d !== today) ?? today;

  // Fetch users with reminders enabled and a push subscription
  const url = `${process.env.SUPABASE_URL}/rest/v1/profiles?bill_reminders=eq.true&push_endpoint=not.is.null&select=id,push_endpoint,push_p256dh,push_auth,bill_due_days,cycle_end_date,cycle_end_notified`;
  const resp = await fetch(url, { headers: sbHeaders() });

  if (!resp.ok) {
    console.error('Supabase fetch failed:', await resp.text());
    return res.status(500).json({ error: 'Supabase error' });
  }

  const users = await resp.json();
  console.log(`Processing ${users.length} users for bill reminders`);

  let sent = 0;
  let errors = 0;

  for (const user of users) {
    const billDueDays = user.bill_due_days;

    const subscription = {
      endpoint: user.push_endpoint,
      keys: { p256dh: user.push_p256dh, auth: user.push_auth },
    };

    // ── Cycle-end reminder: first cron run after the period closes ──
    if (user.cycle_end_date) {
      const todayStr = new Date().toISOString().slice(0, 10);
      if (todayStr > user.cycle_end_date && user.cycle_end_notified !== user.cycle_end_date) {
        try {
          await webpush.sendNotification(subscription, JSON.stringify({
            title: 'Your pay period has ended',
            body: 'Review last period and start your next one in DistroFi.',
            tag: `cycle-end-${user.cycle_end_date}`,
            url: '/',
          }));
          sent++;
          await fetch(`${process.env.SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}`, {
            method: 'PATCH',
            headers: sbHeaders(),
            body: JSON.stringify({ cycle_end_notified: user.cycle_end_date }),
          });
        } catch (e) {
          console.error(`Cycle-end push failed for user ${user.id}:`, e.statusCode, e.body);
          if (e.statusCode === 404 || e.statusCode === 410) {
            await fetch(`${process.env.SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}`, {
              method: 'PATCH',
              headers: sbHeaders(),
              body: JSON.stringify({ push_endpoint: null, push_p256dh: null, push_auth: null, bill_reminders: false }),
            });
          }
          errors++;
        }
      }
    }

    // ── Bill reminders ──
    if (!Array.isArray(billDueDays) || billDueDays.length === 0) continue;

    // Find bills due today or in 3 days
    const toNotify = billDueDays.filter(b => reminderDays.includes(b.dueDay));

    for (const bill of toNotify) {
      const daysUntil = bill.dueDay === today ? 0 : 3;
      const payload = buildMessage(bill, daysUntil);

      try {
        await webpush.sendNotification(subscription, JSON.stringify({
          ...payload,
          tag: `bill-${bill.name.toLowerCase().replace(/\s+/g, '-')}-${bill.dueDay}`,
          url: '/',
        }));
        sent++;
      } catch (e) {
        console.error(`Push failed for user ${user.id}:`, e.statusCode, e.body);
        // 404/410 = subscription expired — clear it
        if (e.statusCode === 404 || e.statusCode === 410) {
          await fetch(`${process.env.SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}`, {
            method: 'PATCH',
            headers: sbHeaders(),
            body: JSON.stringify({ push_endpoint: null, push_p256dh: null, push_auth: null, bill_reminders: false }),
          });
        }
        errors++;
      }
    }
  }

  console.log(`Bill reminders sent: ${sent}, errors: ${errors}`);
  return res.status(200).json({ sent, errors, users: users.length });
}
