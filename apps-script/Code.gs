/**
 * Accountant demo: email automations on Google Apps Script (free, £0/month).
 *
 * What it does
 *  - doPost: handles the website's "Try it" demo form and "Book a call" form.
 *    Logs to a Google Sheet, sends the visitor ONE email (instant reply), alerts the owner.
 *  - Daily time-driven automations that run from the "Clients" sheet:
 *      documentChase()   reminders at day 2, 4, 7 after onboarding, then alerts owner
 *      lateInvoiceChase() chasers at day 3, 7, 14 after invoice due date
 *      deadlineReminders() 30, 7 and 0 days before each client's deadline
 *      reviewRequests()  review + referral email 7 days after work is completed
 *
 * Setup: see apps-script/README.md. Run setup() once, then deploy as a web app.
 */

const SETTINGS = {
  SHEET_ID: '1GiR7E9YtP47-Y20AKsUQwWrM7fJjJ2y3YQza-z5YI4k', // Google Sheet that stores enquiries + clients
  FIRM: 'Ledgerline Advisory',
  OWNER_EMAIL: 'saldigitalm@gmail.com', // where new enquiries are alerted
  BOOKING_LINK: 'https://calendar.app.google/your-booking-page',
  REVIEW_LINK: 'https://g.page/r/your-google-review-link/review',
  UPLOAD_LINK: 'https://your-secure-upload-link',
  REFERRAL_BASE: 'https://example.com/?ref=',
  DAILY_DEMO_CAP: 40          // protects the Gmail daily send quota
};

/* ---------- web endpoint ---------- */
function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents || '{}');
    if (d.website || d.company_website) return json({ ok: true });            // honeypot
    const email = String(d.email || '').trim().toLowerCase();
    const name = clean(d.name).slice(0, 60);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || !name) return json({ ok: false, error: 'invalid' });
    if (d.consent !== true) return json({ ok: false, error: 'consent' });

    const cache = CacheService.getScriptCache();
    const key = 'sent_' + Utilities.base64EncodeWebSafe(email);
    if (cache.get(key)) return json({ ok: false, error: 'rate' });              // 1 per email per hour
    const props = PropertiesService.getScriptProperties();
    const today = Utilities.formatDate(new Date(), 'Europe/London', 'yyyy-MM-dd');
    const count = Number(props.getProperty('count_' + today) || 0);
    if (count >= SETTINGS.DAILY_DEMO_CAP) return json({ ok: false, error: 'rate' });

    const lock = LockService.getScriptLock(); lock.waitLock(10000);
    try {
      sheet('Enquiries').appendRow([new Date(), d.action === 'book' ? 'Booking' : 'Demo', name, email, clean(d.phone).slice(0, 30), clean(d.type), clean(d.message).slice(0, 1000), 'Yes']);
    } finally { lock.releaseLock(); }

    sendMail(email, `Thanks ${name}, let's find a time`, [
      `Hi ${name},`,
      `Thanks for getting in touch with ${SETTINGS.FIRM}. Pick a time that suits you for a free 20-minute call and we will come prepared.`,
      button('Choose a time', SETTINGS.BOOKING_LINK),
      d.action === 'demo' ? '<span style="color:#888;font-size:12px">This is a demo email you requested on our website. You will not receive anything else.</span>' : ''
    ]);
    MailApp.sendEmail(owner(), `New ${d.action === 'book' ? 'enquiry' : 'demo run'}: ${name}`,
      `${name} <${email}>\nPhone: ${clean(d.phone)}\nType: ${clean(d.type)}\n\n${clean(d.message)}`);

    cache.put(key, '1', 3600);
    props.setProperty('count_' + today, String(count + 1));
    return json({ ok: true });
  } catch (err) {
    console.error(err);
    return json({ ok: false, error: 'server' });
  }
}
function doGet() { return json({ ok: true, service: SETTINGS.FIRM + ' automations' }); }

/* ---------- daily automations (from the Clients sheet) ----------
 Clients columns: A Name | B Email | C Type (sole/landlord/ltd/contractor) | D Consent (Yes)
 E Onboarded date | F Docs received (Yes) | G Invoice due date | H Paid (Yes)
 I Deadline date | J Work completed date | K Log (automation writes here)          */
function dailyRun() { documentChase(); lateInvoiceChase(); deadlineReminders(); reviewRequests(); }

function documentChase() {
  eachClient((c, log) => {
    if (!c.onboarded || c.docs) return;
    const day = daysSince(c.onboarded);
    if ([2, 4, 7].includes(day) && !log.has('docs' + day)) {
      sendMail(c.email, 'A friendly nudge on your documents', [`Hi ${c.name},`,
        'We are still waiting on a few documents so we can get started. You can upload them securely here:',
        button('Upload documents', SETTINGS.UPLOAD_LINK)]);
      log.add('docs' + day);
      if (day === 7) MailApp.sendEmail(owner(), `Docs still missing: ${c.name}`, `${c.name} has not sent documents after 7 days. Worth a call.`);
    }
  });
}
function lateInvoiceChase() {
  eachClient((c, log) => {
    if (!c.due || c.paid) return;
    const day = daysSince(c.due);
    if ([3, 7, 14].includes(day) && !log.has('inv' + day)) {
      sendMail(c.email, 'Quick reminder about your invoice', [`Hi ${c.name},`,
        `Just a gentle reminder that your invoice was due ${day} days ago. If it has already been paid, please ignore this.`]);
      log.add('inv' + day);
      if (day === 14) MailApp.sendEmail(owner(), `Invoice 14 days overdue: ${c.name}`, 'Time for a personal call.');
    }
  });
}
function deadlineReminders() {
  eachClient((c, log) => {
    if (!c.deadline) return;
    const left = -daysSince(c.deadline);
    if ([30, 7, 0].includes(left) && !log.has('dl' + left)) {
      sendMail(c.email, left ? `${left} days to your deadline` : 'Your deadline is today', [`Hi ${c.name},`,
        left ? `Your filing deadline is in ${left} days. If anything is outstanding, upload it here and we will take care of the rest.` : 'Your filing deadline is today. We are on it, and we will confirm once it is filed.',
        button('Upload documents', SETTINGS.UPLOAD_LINK)]);
      log.add('dl' + left);
    }
  });
}
function reviewRequests() {
  eachClient((c, log) => {
    if (!c.completed || log.has('review')) return;
    if (daysSince(c.completed) >= 7) {
      sendMail(c.email, 'Thank you, and a small favour', [`Hi ${c.name},`,
        `Thank you for trusting ${SETTINGS.FIRM}. If you have a moment, a short review helps other business owners find us.`,
        button('Leave a review', SETTINGS.REVIEW_LINK),
        `Know someone who needs a hand? Share your personal link: ${SETTINGS.REFERRAL_BASE}${encodeURIComponent(c.email)}`]);
      log.add('review');
    }
  });
}

/* ---------- setup ---------- */
function setup() {
  const ss = book();
  const enq = ss.getSheetByName('Enquiries');
  if (enq && enq.getRange(1, 5).getValue() !== 'Phone') enq.insertColumnBefore(5).getRange(1, 5).setValue('Phone');
  if (!ss.getSheetByName('Enquiries')) ss.insertSheet('Enquiries').appendRow(['Timestamp', 'Source', 'Name', 'Email', 'Phone', 'Type', 'Message', 'Consent']);
  if (!ss.getSheetByName('Clients')) ss.insertSheet('Clients').appendRow(['Name', 'Email', 'Type', 'Consent', 'Onboarded', 'Docs received', 'Invoice due', 'Paid', 'Deadline', 'Completed', 'Log']);
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('dailyRun').timeBased().everyDays(1).atHour(9).inTimezone('Europe/London').create();
}

/* ---------- helpers ---------- */
function eachClient(fn) {
  const sh = sheet('Clients'); const rows = sh.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r[1] || String(r[3]).toLowerCase() !== 'yes') continue; // consent required
    const c = { name: r[0], email: r[1], type: r[2], onboarded: r[4], docs: yes(r[5]), due: r[6], paid: yes(r[7]), deadline: r[8], completed: r[9] };
    const log = new Set(String(r[10] || '').split(',').filter(String));
    const before = log.size;
    try { fn(c, log); } catch (err) { console.error(c.email, err); }
    if (log.size !== before) sh.getRange(i + 1, 11).setValue([...log].join(','));
  }
}
function sendMail(to, subject, parts) {
  const html = `<div style="font-family:Arial,sans-serif;max-width:560px;line-height:1.6;color:#222">${parts.filter(Boolean).map(p => p.startsWith('<') ? p : `<p>${p}</p>`).join('')}<p style="margin-top:28px">${SETTINGS.FIRM}</p></div>`;
  MailApp.sendEmail({ to, subject, htmlBody: html, name: SETTINGS.FIRM });
}
function button(label, url) { return `<p><a href="${url}" style="background:#C9A24A;color:#150f05;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:bold;display:inline-block">${label}</a></p>`; }
function book() { return SETTINGS.SHEET_ID ? SpreadsheetApp.openById(SETTINGS.SHEET_ID) : SpreadsheetApp.getActive(); }
function sheet(n) { return book().getSheetByName(n); }
function owner() { return SETTINGS.OWNER_EMAIL || Session.getEffectiveUser().getEmail(); }
function yes(v) { return String(v).toLowerCase() === 'yes'; }
function clean(v) { return String(v || '').replace(/[<>]/g, '').trim(); }
function daysSince(d) { const a = new Date(d); a.setHours(0, 0, 0, 0); const b = new Date(); b.setHours(0, 0, 0, 0); return Math.round((b - a) / 864e5); }
function json(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
