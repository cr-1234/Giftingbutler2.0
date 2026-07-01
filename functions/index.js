const {onDocumentCreated} = require('firebase-functions/v2/firestore');
const {onSchedule} = require('firebase-functions/v2/scheduler');
const {defineSecret} = require('firebase-functions/params');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

admin.initializeApp();

// Gmail app password, stored as a Firebase secret (not in source).
// Set it once with:  firebase functions:secrets:set GMAIL_APP_PASSWORD
const GMAIL_APP_PASSWORD = defineSecret('GMAIL_APP_PASSWORD');

const GMAIL_USER = 'giftingbutler.help@gmail.com';
const FROM = '"Gifting Butler 🎁" <' + GMAIL_USER + '>';
const SITE = 'https://giftingbutler-74395.web.app';

// Builds a Gmail transporter. Call inside a handler (the secret value is only
// available at runtime, and only in functions that declare the secret).
function makeTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {user: GMAIL_USER, pass: GMAIL_APP_PASSWORD.value()},
  });
}

exports.sendGiveawayConfirmation = onDocumentCreated(
  {
    document: 'giveaway_entries/{entryId}',
    secrets: [GMAIL_APP_PASSWORD],
    region: 'us-central1',
  },
  async (event) => {
    const snap = event.data;
    if (!snap) return null;

    const data = snap.data();
    const email = data && data.email;
    if (!email) {
      console.warn('Entry has no email field; skipping.', {entryId: event.params.entryId});
      return null;
    }

    // Maintain the public per-week counter so clients never need to read the
    // entries collection (which keeps entrant emails private). Recompute the
    // true count from actual docs (self-healing) rather than blindly
    // incrementing — so pre-existing entries and any missed events are always
    // reflected accurately.
    const week = (data.week || '').toString();
    if (week) {
      try {
        const snap = await admin.firestore()
          .collection('giveaway_entries')
          .where('week', '==', week)
          .count().get();
        const n = snap.data().count;
        await admin.firestore().collection('giveaway_meta').doc(week).set({
          count: n,
          week: week,
        }, {merge: true});
      } catch (err) {
        console.error('Failed to update giveaway_meta count.', err);
      }
    }

    const name = (data.name || '').toString().trim();
    const greeting = name ? `Hi ${name},` : 'Hi there,';

    const transporter = makeTransporter();

    await transporter.sendMail({
      from: FROM,
      to: email,
      subject: "You're entered in this week's giveaway! 🎉",
      text: buildEmailText(greeting),
      html: buildEmailHtml(greeting),
      // One-click unsubscribe via reply (no domain yet). Helps deliverability
      // and is good practice for bulk mail.
      headers: {
        'List-Unsubscribe': '<mailto:' + GMAIL_USER + '?subject=unsubscribe>',
      },
    });

    console.log('Confirmation email sent.', {to: email, entryId: event.params.entryId});
    return null;
  }
);

function buildEmailText(greeting) {
  return [
    greeting,
    '',
    "Thanks for entering the Gifting Butler Weekly Giveaway! Your entry is locked in.",
    '',
    'We draw a winner every Sunday — keep an eye on your inbox. Good luck!',
    '',
    'Find the perfect gift: https://giftingbutler-74395.web.app',
    '',
    '—',
    'Gifting Butler',
    'You received this because you entered the giveaway at giftingbutler-74395.web.app',
    'To unsubscribe, reply to this email with the subject "unsubscribe".',
  ].join('\n');
}

function buildEmailHtml(greeting) {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
  <body style="margin:0;padding:0;background:#1a0a0a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#1a0a0a;padding:32px 12px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
               style="max-width:560px;background:#fffdf7;border-radius:18px;overflow:hidden;
                      box-shadow:0 12px 40px rgba(0,0,0,.45);font-family:'Segoe UI',Arial,sans-serif;">

          <!-- Header -->
          <tr><td style="background:linear-gradient(135deg,#8e1b1b 0%,#c0392b 55%,#b8860b 100%);
                         padding:40px 32px;text-align:center;">
            <div style="font-size:46px;line-height:1;">🎁</div>
            <h1 style="margin:14px 0 4px;color:#fff;font-size:26px;letter-spacing:.5px;">You're Entered!</h1>
            <div style="display:inline-block;margin-top:8px;padding:5px 16px;border-radius:999px;
                        background:rgba(255,255,255,.18);color:#ffe8a3;font-size:13px;
                        font-weight:600;letter-spacing:1px;text-transform:uppercase;">
              This Week's Giveaway
            </div>
          </td></tr>

          <!-- Body -->
          <tr><td style="padding:34px 36px 12px;color:#3a2a2a;font-size:16px;line-height:1.6;">
            <p style="margin:0 0 16px;font-size:18px;color:#8e1b1b;font-weight:600;">${greeting}</p>
            <p style="margin:0 0 16px;">
              Thanks for entering the <strong style="color:#c0392b;">Gifting Butler Weekly Giveaway</strong> 🎉
              Your entry is locked in.
            </p>
            <p style="margin:0 0 24px;">
              We draw a winner every <strong style="color:#b8860b;">Sunday</strong> — keep an eye on your inbox.
              Fingers crossed! 🤞
            </p>

            <div style="text-align:center;margin:8px 0 28px;">
              <a href="https://giftingbutler-74395.web.app"
                 style="display:inline-block;padding:14px 34px;border-radius:999px;
                        background:linear-gradient(135deg,#c0392b,#b8860b);color:#fff;
                        text-decoration:none;font-weight:700;font-size:16px;
                        box-shadow:0 6px 18px rgba(192,57,43,.4);">
                Find the Perfect Gift &rarr;
              </a>
            </div>
          </td></tr>

          <!-- Gold divider -->
          <tr><td style="padding:0 36px;">
            <div style="height:2px;background:linear-gradient(90deg,transparent,#b8860b,transparent);"></div>
          </td></tr>

          <!-- Footer -->
          <tr><td style="padding:20px 36px 30px;text-align:center;color:#a08a8a;font-size:12px;line-height:1.5;">
            <p style="margin:0 0 4px;color:#8e1b1b;font-weight:600;">Gifting Butler 🎁</p>
            <p style="margin:0;">
              You received this because you entered the giveaway at
              <a href="https://giftingbutler-74395.web.app" style="color:#b8860b;text-decoration:none;">giftingbutler-74395.web.app</a>.
            </p>
            <p style="margin:8px 0 0;">
              <a href="mailto:giftingbutler.help@gmail.com?subject=unsubscribe" style="color:#a08a8a;text-decoration:underline;">Unsubscribe</a>
            </p>
          </td></tr>

        </table>
      </td></tr>
    </table>
  </body>
  </html>`;
}

// ════════════════════════════════════════════════════════════════════════
//  WEEKLY GIVEAWAY WINNER DRAW  (auto, every Sunday 12:00 PM ET)
// ════════════════════════════════════════════════════════════════════════
exports.drawGiveawayWinner = onSchedule(
  {
    schedule: '0 12 * * 0', // Sundays at 12:00
    timeZone: 'America/New_York',
    secrets: [GMAIL_APP_PASSWORD],
    region: 'us-central1',
  },
  async () => {
    const db = admin.firestore();

    // Current (in-progress) week key, computed the same way the site does,
    // in ET. Any earlier week is "complete" and eligible to be drawn.
    const {y, m, d} = etYMD(new Date());
    const jan1Day = new Date(Date.UTC(y, 0, 1)).getUTCDay();
    const curNum = Math.ceil((dayOfYear(y, m, d) + jan1Day) / 7);

    // Group all entries by their week key.
    const snap = await db.collection('giveaway_entries').get();
    const weeks = {};
    snap.forEach((doc) => {
      const w = doc.get('week');
      const email = doc.get('email');
      if (!w || !email) return;
      (weeks[w] = weeks[w] || []).push({id: doc.id, email: email});
    });

    let drawn = 0;
    for (const [wk, entrants] of Object.entries(weeks)) {
      const p = parseWeekKey(wk);
      if (!p) continue; // skip non-standard keys (old test data)
      const isCurrentOrFuture = p.year > y || (p.year === y && p.num >= curNum);
      if (isCurrentOrFuture) continue; // don't draw the in-progress week

      const winnerRef = db.collection('giveaway_winners').doc(wk);
      const existing = await winnerRef.get();
      if (existing.exists) continue; // already drawn — never double-draw

      const win = entrants[Math.floor(Math.random() * entrants.length)];

      await winnerRef.set({
        email: win.email,
        entryId: win.id,
        entrants: entrants.length,
        week: wk,
        drawnAt: Date.now(),
      });
      // Public, privacy-safe display value (e.g. "b***@gmail.com").
      await db.collection('giveaway_meta').doc(wk).set(
        {winnerMasked: maskEmail(win.email), winnerDrawnAt: Date.now()},
        {merge: true}
      );

      try {
        await makeTransporter().sendMail({
          from: FROM,
          to: win.email,
          subject: "\u{1F389} You WON this week's Gifting Butler giveaway!",
          text: winnerText(),
          html: winnerHtml(),
          headers: {'List-Unsubscribe': '<mailto:' + GMAIL_USER + '?subject=unsubscribe>'},
        });
        console.log('Winner drawn & emailed.', {week: wk, to: win.email, entrants: entrants.length});
      } catch (err) {
        console.error('Winner drawn but email failed.', {week: wk, to: win.email}, err);
      }
      drawn++;
    }
    console.log('drawGiveawayWinner complete.', {weeksDrawn: drawn});
  }
);

// ════════════════════════════════════════════════════════════════════════
//  GIFT REMINDER EMAILS  (auto, daily 8:00 AM ET)
// ════════════════════════════════════════════════════════════════════════
// Human label for a reminder lead-time code (presets or custom_N days).
function leadLabel(t) {
  const M = {
    '2_months': '2 months', '1_month': '1 month', '3_weeks': '3 weeks',
    '2_weeks': '2 weeks', '1_week': '1 week', '3_days': '3 days',
    '1_day': '1 day', 'same_day': 'today',
  };
  if (M[t]) return M[t];
  // New custom format: custom_<n><m|w|d>
  let m = /^custom_(\d+)([mwd])$/.exec(t || '');
  if (m) {
    const n = m[1], u = {m: 'month', w: 'week', d: 'day'}[m[2]];
    return n === '0' ? 'today' : n + ' ' + u + (n === '1' ? '' : 's');
  }
  // Legacy custom_<n> meant days.
  m = /^custom_(\d+)$/.exec(t || '');
  if (m) return m[1] === '0' ? 'today' : m[1] + ' day' + (m[1] === '1' ? '' : 's');
  return t || '';
}

// Subtract a reminder's lead time from a date (mutates d).
function applyLead(d, t) {
  if (t === '1_month') { d.setUTCMonth(d.getUTCMonth() - 1); return; }
  if (t === '2_months') { d.setUTCMonth(d.getUTCMonth() - 2); return; }
  const days = {'3_weeks': 21, '2_weeks': 14, '1_week': 7, '3_days': 3, '1_day': 1, 'same_day': 0}[t];
  if (days !== undefined) { d.setUTCDate(d.getUTCDate() - days); return; }
  // New custom format: custom_<n><m|w|d>
  const cm = /^custom_(\d+)([mwd])$/.exec(t || '');
  if (cm) {
    const n = parseInt(cm[1], 10);
    if (cm[2] === 'm') { d.setUTCMonth(d.getUTCMonth() - n); }
    else { d.setUTCDate(d.getUTCDate() - n * (cm[2] === 'w' ? 7 : 1)); }
    return;
  }
  // Legacy custom_<n> (days).
  const m = /^custom_(\d+)$/.exec(t || '');
  d.setUTCDate(d.getUTCDate() - (m ? parseInt(m[1], 10) : 0));
}

exports.sendReminderEmails = onSchedule(
  {
    schedule: '0 8 * * *', // every day at 08:00
    timeZone: 'America/New_York',
    secrets: [GMAIL_APP_PASSWORD],
    region: 'us-central1',
  },
  async () => {
    const db = admin.firestore();
    const {y, m, d} = etYMD(new Date());

    const usersSnap = await db.collection('users').get();
    let sent = 0;

    for (const userDoc of usersSnap.docs) {
      const rems = userDoc.get('reminders');
      if (!Array.isArray(rems) || !rems.length) continue;

      // Reminders whose alert date is today.
      const due = rems.filter((r) => reminderDueToday(r, y, m, d));
      if (!due.length) continue;

      // Recipient = the user's auth email.
      let email = null;
      try {
        const rec = await admin.auth().getUser(userDoc.id);
        email = rec.email;
      } catch (e) {
        // No auth user / no email — skip.
      }
      if (!email) continue;

      for (const r of due) {
        try {
          await makeTransporter().sendMail({
            from: FROM,
            to: email,
            subject: `\u{1F514} Reminder: ${r.ev} is coming up`,
            text: reminderText(r),
            html: reminderHtml(r),
            headers: {'List-Unsubscribe': '<mailto:' + GMAIL_USER + '?subject=unsubscribe>'},
          });
          sent++;
          console.log('Reminder email sent.', {to: email, event: r.ev});
        } catch (err) {
          console.error('Reminder email failed.', {to: email, event: r.ev}, err);
        }
      }
    }
    console.log('sendReminderEmails complete.', {sent: sent});
  }
);

// ── Date / week helpers ──────────────────────────────────────────────────

// Year/month/day as seen in America/New_York for a given instant.
function etYMD(date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  const get = (t) => parseInt(parts.find((p) => p.type === t).value, 10);
  return {y: get('year'), m: get('month'), d: get('day')};
}

function dayOfYear(y, m, d) {
  const start = Date.UTC(y, 0, 1);
  const cur = Date.UTC(y, m - 1, d);
  return Math.round((cur - start) / 86400000) + 1;
}

function parseWeekKey(wk) {
  const mm = /^gw_(\d{4})_w(\d+)$/.exec(wk);
  if (!mm) return null;
  return {year: parseInt(mm[1], 10), num: parseInt(mm[2], 10)};
}

function maskEmail(e) {
  const [u, dom] = String(e).split('@');
  return (u ? u[0] : '') + '***@' + (dom || '');
}

// True if reminder r's alert date (event date minus its lead time) is today
// (ET). Annual reminders (no year) match in whichever year keeps the alert
// on today; year-specific reminders only match that year.
function reminderDueToday(r, ty, tm, td) {
  if (!r || !r.month || !r.day) return false;
  const candidateYears = r.year ? [r.year] : [ty, ty + 1, ty - 1];
  for (const ey of candidateYears) {
    const alert = new Date(Date.UTC(ey, r.month - 1, r.day));
    applyLead(alert, r.time);
    if (alert.getUTCFullYear() === ty && alert.getUTCMonth() + 1 === tm && alert.getUTCDate() === td) {
      return true;
    }
  }
  return false;
}

// ── Email templates ──────────────────────────────────────────────────────
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

function shell(inner) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1"></head>
  <body style="margin:0;padding:0;background:#1a0a0a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#1a0a0a;padding:32px 12px;">
  <tr><td align="center"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"
    style="max-width:560px;background:#fffdf7;border-radius:18px;overflow:hidden;
    box-shadow:0 12px 40px rgba(0,0,0,.45);font-family:'Segoe UI',Arial,sans-serif;">
  ${inner}
  <tr><td style="padding:18px 36px 28px;text-align:center;color:#a08a8a;font-size:12px;line-height:1.5;">
    <p style="margin:0 0 4px;color:#8e1b1b;font-weight:600;">Gifting Butler \u{1F381}</p>
    <p style="margin:0;"><a href="${SITE}" style="color:#b8860b;text-decoration:none;">giftingbutler-74395.web.app</a></p>
    <p style="margin:8px 0 0;"><a href="mailto:${GMAIL_USER}?subject=unsubscribe" style="color:#a08a8a;text-decoration:underline;">Unsubscribe</a></p>
  </td></tr></table></td></tr></table></body></html>`;
}

function header(emoji, title, pill) {
  return `<tr><td style="background:linear-gradient(135deg,#8e1b1b 0%,#c0392b 55%,#b8860b 100%);padding:38px 32px;text-align:center;">
    <div style="font-size:46px;line-height:1;">${emoji}</div>
    <h1 style="margin:14px 0 4px;color:#fff;font-size:26px;letter-spacing:.5px;">${title}</h1>
    ${pill ? `<div style="display:inline-block;margin-top:8px;padding:5px 16px;border-radius:999px;background:rgba(255,255,255,.18);color:#ffe8a3;font-size:13px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">${pill}</div>` : ''}
  </td></tr>`;
}

function cta() {
  return `<div style="text-align:center;margin:8px 0 28px;">
    <a href="${SITE}" style="display:inline-block;padding:14px 34px;border-radius:999px;
      background:linear-gradient(135deg,#c0392b,#b8860b);color:#fff;text-decoration:none;
      font-weight:700;font-size:16px;box-shadow:0 6px 18px rgba(192,57,43,.4);">Find the Perfect Gift &rarr;</a></div>`;
}

function winnerHtml() {
  return shell(header('\u{1F3C6}', "You're the Winner!", "This Week's Giveaway") +
    `<tr><td style="padding:34px 36px 12px;color:#3a2a2a;font-size:16px;line-height:1.6;">
      <p style="margin:0 0 16px;font-size:18px;color:#8e1b1b;font-weight:600;">Congratulations! \u{1F389}</p>
      <p style="margin:0 0 16px;">Your entry was drawn as the winner of this week's <strong style="color:#c0392b;">Gifting Butler Weekly Giveaway</strong>.</p>
      <p style="margin:0 0 24px;">We'll be in touch at this email address with details on claiming your Amazon gift card. Keep an eye on your inbox!</p>
      ${cta()}
    </td></tr>`);
}
function winnerText() {
  return ['Congratulations!', '',
    "Your entry was drawn as the winner of this week's Gifting Butler Weekly Giveaway.",
    '', "We'll be in touch at this email with details on claiming your Amazon gift card.",
    '', 'Discover more gifts: ' + SITE,
    '', '—', 'Gifting Butler',
    'Reply with subject "unsubscribe" to opt out.'].join('\n');
}

function reminderWhen(r) {
  const date = `${MONTHS[(r.month || 1) - 1]} ${r.day}${r.year ? ' ' + r.year : ''}`;
  const lead = leadLabel(r.time);
  return {date, lead};
}
function reminderHtml(r) {
  const {date, lead} = reminderWhen(r);
  const today = lead === 'today';
  const pill = today ? "It's today!" : (lead ? lead + ' to go' : '');
  const away = today ? ' &mdash; that’s today!' : (lead ? ` &mdash; about ${lead} away` : '');
  return shell(header('\u{1F514}', 'Gift Reminder', pill) +
    `<tr><td style="padding:34px 36px 12px;color:#3a2a2a;font-size:16px;line-height:1.6;">
      <p style="margin:0 0 16px;font-size:18px;color:#8e1b1b;font-weight:600;">${r.ev}</p>
      <p style="margin:0 0 8px;">This is your reminder that <strong style="color:#c0392b;">${r.ev}</strong> is on <strong style="color:#b8860b;">${date}</strong>${away}.</p>
      <p style="margin:0 0 24px;">${today ? 'Make it count' : 'Plenty of time to find something perfect'} — browse curated gift ideas now:</p>
      ${cta()}
    </td></tr>`);
}
function reminderText(r) {
  const {date, lead} = reminderWhen(r);
  const today = lead === 'today';
  const away = today ? " - that's today!" : (lead ? ` - about ${lead} away` : '');
  return [`Reminder: ${r.ev}`, '',
    `${r.ev} is on ${date}${away}.`,
    '', 'Find the perfect gift: ' + SITE,
    '', '—', 'Gifting Butler',
    'Reply with subject "unsubscribe" to opt out.'].join('\n');
}
