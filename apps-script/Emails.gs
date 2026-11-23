/**
 * Email templates for the accountant demo. Plain JavaScript, so the same file
 * runs in Google Apps Script and in Node (for previews).
 *
 * buildEmail(key, ctx) returns { subject, html, text }.
 * EMAIL_ORDER lists the full client journey in the order it happens.
 */

var EMAIL_ORDER = [
  'enquiry', 'booked', 'welcome', 'checklist', 'nudge', 'nearly',
  'alert', 'received', 'quarterly', 'deadline', 'invoice', 'review'
];

var EMAIL_COLOURS = {
  page: '#F6F2EA', card: '#FFFFFF', line: '#E3DBCC', ink: '#14213D',
  body: '#3A4560', muted: '#7A8194', accent: '#1F5C4A', soft: '#F1F6F3', navy: '#0F1A30'
};

function emailContext(o) {
  var site = (o && o.site) || 'https://imsal007.github.io/Accontants-demo-automation-website-/';
  var c = {
    firm: 'Hartley Advisory', tag: 'Chartered Certified Accountants',
    person: 'James Hartley', first: 'James', cred: 'FCCA', role: 'Director',
    email: 'hello@example.com', phone: '020 7946 0000',
    name: 'Alex', fullName: 'Alex Morgan', type: 'sole',
    site: site,
    links: {
      book: site + '#book', id: site + '#faq', sign: site + '#services', upload: site + '#chase',
      pay: site + '#book', review: site, refer: site + '?ref=alex-morgan', record: site + '#system'
    },
    images: { header: site + 'assets/email/header.png', signature: site + 'assets/email/signature.png' }
  };
  for (var k in (o || {})) if (k !== 'links' && k !== 'images') c[k] = o[k];
  if (o && o.links) for (var l in o.links) c.links[l] = o.links[l];
  if (o && o.images) for (var i in o.images) c.images[i] = o.images[i];
  return c;
}

var CHECKLISTS = {
  sole: ['Sales records or an income summary for the year', 'Business expenses and receipts', 'Business bank statements, 6 April 2025 to 5 April 2026', "Last year's tax return, if you're switching from another accountant"],
  landlord: ['Rent received for each property', 'Mortgage interest statements', 'Repair and letting agent invoices', 'Insurance and service charge bills'],
  ltd: ['Business bank statements for the year', 'Sales and purchase invoices', "Director's loan account details", 'Payroll and dividend records'],
  contractor: ['Invoices to your clients or agency', 'Expenses and mileage log', 'Business bank statements for the year', 'Contract or IR35 paperwork']
};

/* ---------- small HTML helpers ---------- */
function esc_(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function p_(t) { return '<p style="margin:0 0 16px;font:16px/1.6 Arial,Helvetica,sans-serif;color:' + EMAIL_COLOURS.body + '">' + t + '</p>'; }
function btn_(label, url, quiet) {
  var C = EMAIL_COLOURS;
  var style = quiet
    ? 'background:#FFFFFF;color:' + C.accent + ';border:1px solid ' + C.accent
    : 'background:' + C.accent + ';color:#FFFFFF;border:1px solid ' + C.accent;
  return '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:6px 0 22px"><tr><td style="border-radius:999px;' + style + '">' +
    '<a href="' + url + '" style="display:inline-block;padding:13px 26px;font:bold 15px/1 Arial,Helvetica,sans-serif;text-decoration:none;border-radius:999px;' + style + '">' + label + '</a></td></tr></table>';
}
function box_(inner) {
  var C = EMAIL_COLOURS;
  return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 22px"><tr><td style="background:' + C.page + ';border:1px solid ' + C.line + ';border-left:3px solid ' + C.accent + ';border-radius:10px;padding:18px 20px">' + inner + '</td></tr></table>';
}
function rows_(pairs) {
  var C = EMAIL_COLOURS;
  return pairs.map(function (r, i) {
    return '<tr><td style="padding:' + (i ? '10px' : '0') + ' 16px 0 0;vertical-align:top;font:bold 11px/1.6 Arial,Helvetica,sans-serif;letter-spacing:1.5px;text-transform:uppercase;color:' + C.muted + ';white-space:nowrap">' + r[0] +
      '</td><td style="padding:' + (i ? '10px' : '0') + ' 0 0;font:15px/1.5 Arial,Helvetica,sans-serif;color:' + C.ink + '">' + r[1] + '</td></tr>';
  }).join('');
}
function details_(pairs) { return box_('<table role="presentation" cellpadding="0" cellspacing="0">' + rows_(pairs) + '</table>'); }
function checks_(items, doneCount) {
  var C = EMAIL_COLOURS;
  return items.map(function (t, i) {
    var done = i < (doneCount || 0);
    var mark = done
      ? '<span style="display:inline-block;width:18px;height:18px;border-radius:5px;background:' + C.accent + ';color:#fff;font:bold 12px/18px Arial;text-align:center">&#10003;</span>'
      : '<span style="display:inline-block;width:16px;height:16px;border-radius:5px;border:1px solid #B9AE99;background:#fff"></span>';
    return '<tr><td style="padding:7px 12px 7px 0;vertical-align:top;width:20px">' + mark + '</td><td style="padding:7px 0;font:15px/1.45 Arial,Helvetica,sans-serif;color:' + (done ? C.muted : C.ink) + (done ? ';text-decoration:line-through' : '') + '">' + esc_(t) + '</td></tr>';
  }).join('');
}
function checklist_(items, doneCount, label) {
  var C = EMAIL_COLOURS;
  var head = label ? '<p style="margin:0 0 8px;font:bold 11px/1.4 Arial,Helvetica,sans-serif;letter-spacing:1.5px;text-transform:uppercase;color:' + C.accent + '">' + label + '</p>' : '';
  return box_(head + '<table role="presentation" cellpadding="0" cellspacing="0" width="100%">' + checks_(items, doneCount) + '</table>');
}
function step_(n, title, text, button) {
  var C = EMAIL_COLOURS;
  return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px;border:1px solid ' + C.line + ';border-radius:12px"><tr>' +
    '<td style="width:44px;padding:20px 0 20px 20px;vertical-align:top"><span style="display:inline-block;width:30px;height:30px;border-radius:50%;background:' + C.soft + ';color:' + C.accent + ';font:bold 15px/30px Georgia,serif;text-align:center">' + n + '</span></td>' +
    '<td style="padding:20px 20px 4px 14px"><p style="margin:2px 0 6px;font:bold 17px/1.3 Georgia,serif;color:' + C.ink + '">' + title + '</p>' +
    '<p style="margin:0 0 14px;font:15px/1.55 Arial,Helvetica,sans-serif;color:' + C.body + '">' + text + '</p>' + button + '</td></tr></table>';
}

/* ---------- layout ---------- */
function layout_(c, m) {
  var C = EMAIL_COLOURS;
  var sig = m.internal
    ? '<p style="margin:8px 0 0;font:13px/1.5 Arial,Helvetica,sans-serif;color:' + C.muted + '">Sent automatically by your practice system.</p>'
    : p_(m.signoff || 'Thanks,') +
      '<a href="' + c.site + '" style="text-decoration:none"><img src="' + c.images.signature + '" width="520" alt="' + esc_(c.person + ' ' + c.cred + ', ' + c.role + ', ' + c.firm + '. ' + c.email + ', ' + c.phone) + '" style="display:block;width:100%;max-width:520px;height:auto;border:0;margin:6px 0 0"></a>';
  return '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + esc_(m.subject) + '</title></head>' +
    '<body style="margin:0;padding:0;background:' + C.page + '">' +
    '<div style="display:none;max-height:0;overflow:hidden;opacity:0">' + esc_(m.preheader || '') + '</div>' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:' + C.page + '"><tr><td align="center" style="padding:28px 12px">' +
    '<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:' + C.card + ';border:1px solid ' + C.line + ';border-radius:16px;overflow:hidden">' +
    '<tr><td style="background:' + C.navy + ';line-height:0"><img src="' + c.images.header + '" width="600" alt="' + esc_(c.firm + ', ' + c.tag) + '" style="display:block;width:100%;max-width:600px;height:auto;border:0;color:#F3EFE6;font:20px Georgia,serif"></td></tr>' +
    '<tr><td style="padding:34px 36px 30px">' +
    '<p style="margin:0 0 10px;font:bold 11px/1.4 Arial,Helvetica,sans-serif;letter-spacing:2px;text-transform:uppercase;color:' + C.accent + '">' + m.eyebrow + '</p>' +
    '<h1 style="margin:0 0 22px;font:normal 30px/1.2 Georgia,\'Times New Roman\',serif;color:' + C.ink + '">' + m.title + '</h1>' +
    m.body + sig +
    '</td></tr>' +
    '<tr><td style="padding:20px 36px 26px;border-top:1px solid ' + C.line + ';background:#FBF8F2">' +
    '<p style="margin:0 0 6px;font:12px/1.6 Arial,Helvetica,sans-serif;color:' + C.muted + '">' + esc_(c.firm) + ' &middot; ' + esc_(c.tag) + ' &middot; <a href="mailto:' + c.email + '" style="color:' + C.muted + '">' + esc_(c.email) + '</a></p>' +
    '<p style="margin:0;font:11px/1.6 Arial,Helvetica,sans-serif;color:#A2A6B2">' + (m.internal ? 'Internal alert for the practice.' : "You're receiving this because you're a client of " + esc_(c.firm) + '.') + ' Demo email by SAL Digital: names and details are placeholders.</p>' +
    '</td></tr></table></td></tr></table></body></html>';
}

/* ---------- the journey ---------- */
function buildEmail(key, ctx) {
  var c = ctx || emailContext();
  var n = esc_(c.name), L = c.links;
  var list = CHECKLISTS[c.type] || CHECKLISTS.sole;
  var hi = p_('Hi ' + n + ',');
  var E = {
    enquiry: {
      subject: 'Thanks for getting in touch, ' + c.name,
      preheader: 'Pick a time for a free 20 minute call.',
      eyebrow: 'New enquiry', title: "Let's find a time to talk", signoff: 'Speak soon,',
      body: hi + p_("Thanks for your message. I've read it, and I'd be glad to help.") +
        p_("The easiest next step is a free 20 minute call. I'll ask a few questions about your business, then tell you honestly how we could work together and what it would cost.") +
        btn_('Choose a time', L.book) +
        p_("If none of the times suit you, just reply to this email and we'll find one that does.")
    },
    booked: {
      subject: "You're booked in for Thursday at 10am",
      preheader: 'Your free call with ' + c.person + ' is confirmed.',
      eyebrow: 'Call confirmed', title: 'See you on Thursday', signoff: 'Looking forward to it,',
      body: hi + p_('Your free call is booked, and a calendar invite is on its way.') +
        details_([['When', 'Thursday 26 November, 10:00 to 10:20'], ['How', 'Phone or video, whichever you prefer'], ['With', esc_(c.person + ' ' + c.cred)]]) +
        p_("There's no need to prepare anything formal. It helps to have a rough idea of your yearly income and anything about tax that's been on your mind.") +
        btn_('Change the time', L.book, true)
    },
    welcome: {
      subject: 'Welcome to ' + c.firm + ', ' + c.name,
      preheader: 'Two quick things before we start: your ID check and engagement letter.',
      eyebrow: 'Welcome', title: 'Two quick things before we start', signoff: 'Welcome aboard,',
      body: hi + p_("It was good to speak with you today, and I'm really glad you've decided to work with us.") +
        p_('Before we can start, accountants are required to confirm who their clients are, and we need your agreement in writing. Both take a few minutes.') +
        step_(1, 'Confirm your identity', 'Our ID check is run by a specialist provider. Have your passport or driving licence and your phone to hand.', btn_('Start your ID check', L.id)) +
        step_(2, 'Sign your engagement letter', "It sets out what we'll do for you, your fixed monthly fee and what we'll need from you.", btn_('Read and sign', L.sign, true)) +
        p_("Once both are done, I'll send over your document checklist.")
    },
    checklist: {
      subject: 'Your document checklist',
      preheader: "Everything we need for your 2025 to 2026 tax return.",
      eyebrow: 'Documents', title: "Here's what we need from you", signoff: 'Thanks,',
      body: hi + p_("Thank you. Your ID check and engagement letter are both done, so we're ready to start on your 2025 to 2026 tax return.") +
        p_("Here's everything we need, based on what you told me on our call:") +
        checklist_(list, 0) +
        p_('Upload it all at once, or bit by bit as you find things. Photos of receipts are fine.') +
        btn_('Upload securely', L.upload)
    },
    nudge: {
      subject: 'A quick nudge on your documents',
      preheader: "We're still waiting on a few things before we can start.",
      eyebrow: 'Reminder', title: 'Just checking in', signoff: 'Thanks,',
      body: hi + p_("I know paperwork is never top of anyone's list, so this is just a friendly nudge. We're still waiting on a few things before we can start your return.") +
        checklist_(list, 1, '1 of ' + list.length + ' received') +
        p_("It usually takes about ten minutes. Here's your upload link again.") +
        btn_('Upload your documents', L.upload)
    },
    nearly: {
      subject: 'Nearly there, ' + c.name,
      preheader: 'Just your bank statements left.',
      eyebrow: 'Reminder', title: 'Just your bank statements left', signoff: 'Thanks,',
      body: hi + p_('Thanks for sending most of your documents through. The only thing still missing is your business bank statements for 6 April 2025 to 5 April 2026.') +
        box_('<p style="margin:0;font:15px/1.55 Arial,Helvetica,sans-serif;color:' + EMAIL_COLOURS.ink + '"><b>Quick tip:</b> most banks let you download statements as a PDF in their app. Look for Statements or Documents in the menu.</p>') +
        btn_('Upload your statements', L.upload) +
        p_("As soon as they're in, these reminders stop.")
    },
    alert: {
      internal: true,
      subject: c.fullName + ': bank statements still missing after 7 days',
      preheader: 'Reminders went out on day 2 and day 4. Worth a quick call.',
      eyebrow: 'Practice alert', title: 'Worth a quick call',
      body: p_('Hi ' + esc_(c.first) + ',') + p_(esc_(c.fullName) + " still hasn't sent their bank statements. Reminders went out on day 2 and day 4.") +
        details_([['Client', esc_(c.fullName) + ', sole trader'], ['Missing', 'Business bank statements, 6 April 2025 to 5 April 2026'], ['Received', '3 of 4 items'], ['Deadline', 'Self Assessment, 31 January 2027']]) +
        p_('No more automatic reminders will go out for this item. A personal call usually sorts it.') +
        btn_('Open client record', L.record)
    },
    received: {
      subject: 'Got everything, thank you',
      preheader: 'We have everything we need for your return.',
      eyebrow: 'Documents received', title: "That's everything we need", signoff: 'Speak soon,',
      body: hi + p_('Your bank statements have arrived, so we now have everything for your 2025 to 2026 return. Thank you.') +
        checklist_(list, list.length, 'All ' + list.length + ' received') +
        p_("Next, I'll work on your return and send you a plain English summary of what you owe and when. Nothing is filed until you've approved it.")
    },
    quarterly: {
      subject: 'Your quarterly update is due on 7 February',
      preheader: 'Making Tax Digital: 6 October to 5 January.',
      eyebrow: 'Making Tax Digital', title: 'Your next quarterly update', signoff: 'Thanks,',
      body: hi + p_('Your next Making Tax Digital quarterly update covers 6 October 2026 to 5 January 2027, and it needs to reach HMRC by 7 February 2027.') +
        details_([['Period', '6 October 2026 to 5 January 2027'], ['Due by', '7 February 2027'], ['We need', 'Your income and expenses for the period']]) +
        p_("If your records are up to date in your bookkeeping app, there's nothing for you to do. If not, please send us any receipts or invoices from that period.") +
        btn_('Upload receipts', L.upload) +
        p_('There are no penalty points for late quarterly updates this tax year, but sending it on time keeps everything simple.')
    },
    deadline: {
      subject: '30 days until your tax return deadline',
      preheader: 'Your 2025 to 2026 return is ready for you to approve.',
      eyebrow: 'Deadline', title: '31 January is 30 days away', signoff: 'Thanks,',
      body: hi + p_('A quick heads-up that your 2025 to 2026 Self Assessment return is due by 31 January 2027. Any tax you owe for that year is due by the same date.') +
        details_([['Return', '2025 to 2026 Self Assessment'], ['Deadline', '31 January 2027'], ['Status', '<b style="color:' + EMAIL_COLOURS.accent + '">Ready for your approval</b>']]) +
        p_("Have a look at the summary when you have a moment. It shows exactly what you owe and how to pay. Once you approve it, we'll file it and confirm by email.") +
        btn_('Review and approve', L.upload)
    },
    invoice: {
      subject: 'A gentle reminder about invoice HA-1042',
      preheader: 'Invoice HA-1042 is 3 days past its due date.',
      eyebrow: 'Invoice reminder', title: 'Just a gentle reminder', signoff: 'Thanks,',
      body: hi + p_("Our records show invoice HA-1042 is now 3 days past its due date. These things are easy to miss, so no worries at all.") +
        details_([['Invoice', 'HA-1042'], ['Amount', '£120.00'], ['Was due', '20 November 2026']]) +
        btn_('Pay securely', L.pay) +
        p_("If you've already paid, thank you, and please ignore this email. If something doesn't look right, just reply and let me know.")
    },
    review: {
      subject: 'Thank you, ' + c.name + ', and a small favour',
      preheader: 'Your return is filed. Would you leave a quick review?',
      eyebrow: 'Thank you', title: 'Your return is filed', signoff: 'With thanks,',
      body: hi + p_('Your 2025 to 2026 tax return has been filed with HMRC, well ahead of the deadline. Thank you for making it so easy.') +
        p_('If you have a minute, a short Google review would mean a lot. It helps other business owners find an accountant they can trust.') +
        btn_('Leave a review', L.review) +
        box_('<p style="margin:0 0 6px;font:bold 16px/1.4 Georgia,serif;color:' + EMAIL_COLOURS.ink + '">Know someone who needs a hand?</p>' +
          '<p style="margin:0;font:15px/1.55 Arial,Helvetica,sans-serif;color:' + EMAIL_COLOURS.body + '">Your personal link makes it easy to introduce them: <a href="' + L.refer + '" style="color:' + EMAIL_COLOURS.accent + ';font-weight:bold">share your link</a></p>')
    }
  };
  var m = E[key];
  if (!m) throw new Error('Unknown email: ' + key);
  var html = layout_(c, m);
  var text = html.replace(/<style[\s\S]*?<\/style>/g, '').replace(/<title>[\s\S]*?<\/title>/, '').replace(/<div style="display:none[\s\S]*?<\/div>/, '')
    .replace(/<br\s*\/?>/g, '\n').replace(/<\/(p|tr|h1|table)>/g, '\n').replace(/<[^>]+>/g, '').replace(/&middot;/g, '·').replace(/&#10003;/g, '✓')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\n\s*\n+/g, '\n\n').trim();
  return { subject: m.subject, html: html, text: text, internal: !!m.internal };
}

if (typeof module !== 'undefined') module.exports = { buildEmail: buildEmail, emailContext: emailContext, EMAIL_ORDER: EMAIL_ORDER };
