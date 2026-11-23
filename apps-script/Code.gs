/**
 * Accountant demo: email automations on Google Apps Script (free, £0/month).
 * The email designs and wording live in Emails.gs (add it as a second file in the project).
 *
 * What it does
 *  - doPost: handles the website's "Try it" demo form and "Book a call" form.
 *    Logs to a Google Sheet, sends the visitor ONE email (instant reply), alerts the owner.
 *  - Daily time-driven automations that run from the "Clients" sheet:
 *      documentChase()     reminders on day 2 and 4 after onboarding, alert to the owner on day 7
 *      lateInvoiceChase()  reminders 3, 7 and 14 days after the invoice due date
 *      deadlineReminders() 30, 7 and 0 days before each client's deadline
 *      reviewRequests()    review and referral email 7 days after work is completed
 *  - sendDemoSequence(): sends the whole 12 email journey to one address (for screenshots and Reels).
 *
 * Setup: see apps-script/README.md. Run setup() once, then deploy as a web app.
 */

const SETTINGS = {
  SHEET_ID: '1GiR7E9YtP47-Y20AKsUQwWrM7fJjJ2y3YQza-z5YI4k', // Google Sheet that stores enquiries + clients
  FIRM: 'Hartley Advisory',
  OWNER_EMAIL: 'saldigitalm@gmail.com', // where new enquiries and alerts go
  SITE: 'https://imsal007.github.io/Accontants-demo-automation-website-/',
  DEMO_TO: 'saldigital@gmail.com',      // where sendDemoSequence() sends the journey
  DAILY_DEMO_CAP: 40                    // protects the Gmail daily send quota
};

function ctx_(extra) { return emailContext(Object.assign({ site: SETTINGS.SITE, firm: SETTINGS.FIRM }, extra || {})); }

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

    const type = ['sole', 'landlord', 'ltd', 'contractor'].indexOf(d.type) > -1 ? d.type : 'sole';
    sendTemplate(email, 'enquiry', ctx_({ name: name, fullName: name, type: type }));
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

/* ---------- the full journey in one go (for screenshots and Reels) ---------- */
function sendDemoSequence() {
  const to = SETTINGS.DEMO_TO;
  EMAIL_ORDER.forEach(function (k) {
    sendTemplate(to, k, ctx_());
    Utilities.sleep(2500); // keeps them in order in the inbox
  });
}

/* ---------- daily automations (from the Clients sheet) ----------
 Clients columns: A Name | B Email | C Type (sole/landlord/ltd/contractor) | D Consent (Yes)
 E Onboarded date | F Docs received (Yes) | G Invoice due date | H Paid (Yes)
 I Deadline date | J Work completed date | K Log (automation writes here)          */
function dailyRun() { documentChase(); lateInvoiceChase(); deadlineReminders(); reviewRequests(); }

function clientCtx_(c) { const first = String(c.name).split(' ')[0]; return ctx_({ name: first, fullName: c.name, type: c.type || 'sole' }); }

function documentChase() {
  eachClient((c, log) => {
    if (!c.onboarded || c.docs) return;
    const day = daysSince(c.onboarded);
    if (day === 2 && !log.has('docs2')) { sendTemplate(c.email, 'nudge', clientCtx_(c)); log.add('docs2'); }
    if (day === 4 && !log.has('docs4')) { sendTemplate(c.email, 'nearly', clientCtx_(c)); log.add('docs4'); }
    if (day === 7 && !log.has('docs7')) { sendTemplate(owner(), 'alert', clientCtx_(c)); log.add('docs7'); }
  });
}
function lateInvoiceChase() {
  eachClient((c, log) => {
    if (!c.due || c.paid) return;
    const day = daysSince(c.due);
    if ([3, 7, 14].includes(day) && !log.has('inv' + day)) {
      sendTemplate(c.email, 'invoice', clientCtx_(c));
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
      sendTemplate(c.email, 'deadline', clientCtx_(c));
      log.add('dl' + left);
    }
  });
}
function reviewRequests() {
  eachClient((c, log) => {
    if (!c.completed || log.has('review')) return;
    if (daysSince(c.completed) >= 7) { sendTemplate(c.email, 'review', clientCtx_(c)); log.add('review'); }
  });
}

/* ---------- setup ---------- */
function setup() {
  const ss = book();
  ss.setSpreadsheetTimeZone('Europe/London'); // dates typed in the sheet are read as UK dates
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
function sendTemplate(to, key, c) {
  const m = buildEmail(key, c);
  MailApp.sendEmail({ to: to, subject: m.subject, htmlBody: m.html, body: m.text, name: SETTINGS.FIRM });
}
function book() { return SETTINGS.SHEET_ID ? SpreadsheetApp.openById(SETTINGS.SHEET_ID) : SpreadsheetApp.getActive(); }
function sheet(n) { return book().getSheetByName(n); }
function owner() { return SETTINGS.OWNER_EMAIL || Session.getEffectiveUser().getEmail(); }
function yes(v) { return String(v).toLowerCase() === 'yes'; }
function clean(v) { return String(v || '').replace(/[<>]/g, '').trim(); }
// Whole calendar days between a date and today, counted on UK dates.
// Uses the date only (no hours), so the GMT/BST clock changes can never shift a reminder by a day.
function ukDay_(d) { const s = Utilities.formatDate(new Date(d), 'Europe/London', 'yyyy-MM-dd').split('-'); return Date.UTC(+s[0], +s[1] - 1, +s[2]); }
function daysSince(d) { return Math.round((ukDay_(new Date()) - ukDay_(d)) / 864e5); }
function json(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
