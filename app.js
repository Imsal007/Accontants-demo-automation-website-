/* ===== CONFIG: swap these for each accountant (everything on the page updates) ===== */
const CONFIG = {
  firm: "Hartley Advisory",
  tag: "Chartered Certified Accountants",
  person: "James Hartley",
  cred: "FCCA",
  email: "hello@example.com",
  whatsapp: "",          // e.g. "447700900000" (country code, no +). Empty = button scrolls to the booking form.
  // Google Apps Script web app URL (see apps-script/README). Empty = simulation mode, no real email.
  endpoint: "https://script.google.com/macros/s/AKfycbyvRFC7bBz1JQnyn8nZ0KHc7yUfz-E3sqqRLuU05H6Wnu2OKDhdRtnAH-7b7tuEaQph/exec"
};

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const isMobile = () => innerWidth <= 760;

/* apply config */
$$("[data-cfg]").forEach(el => {
  const v = CONFIG[el.dataset.cfg]; if (!v) return;
  el.textContent = v;
  if (el.dataset.cfg === "email") el.href = "mailto:" + v;
});
if (CONFIG.whatsapp) { const wa = $("#wa"); wa.href = "https://wa.me/" + CONFIG.whatsapp + "?text=" + encodeURIComponent("Hi, I'd like to book a free call with " + CONFIG.firm + "."); wa.target = "_blank"; }

/* nav */
const nav = $("#nav"), burger = $("#burger"), mm = $("#mm"), sticky = $("#sticky");
function setMenu(open) { mm.classList.toggle("open", open); burger.setAttribute("aria-expanded", String(open)); burger.setAttribute("aria-label", open ? "Close menu" : "Open menu"); }
burger.addEventListener("click", () => setMenu(!mm.classList.contains("open")));
$$("#mm a").forEach(a => a.addEventListener("click", () => setMenu(false)));
addEventListener("keydown", e => { if (e.key === "Escape") setMenu(false); });

/* scroll reveal */
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), {threshold: .12, rootMargin: "0px 0px -6% 0px"});
$$(".reveal").forEach(el => io.observe(el));

/* ===== hero signature: reminder emails arriving ===== */
const NOTES = [
  {av: "H", meta: ["Hartley Advisory", "Day 0"], b: "Welcome, here's your checklist", s: "4 items · secure upload link"},
  {av: "H", meta: ["Hartley Advisory", "Day 2"], b: "A friendly nudge on your documents", s: "Bank statements still to come"},
  {av: "H", meta: ["Hartley Advisory", "Day 4"], b: "Just one item left", s: "Bank statements, April to June"},
  {av: "✓", meta: ["Documents", "Received"], b: "All documents received", s: "Reminders stopped automatically", ok: true}
];
const notes = $("#notes");
function noteEl(n) {
  const d = document.createElement("div"); d.className = "note-card" + (n.ok ? " ok" : "");
  d.innerHTML = `<span class="av"></span><div><div class="meta"><span></span><span></span></div><b></b><small></small></div>`;
  d.querySelector(".av").textContent = n.av;
  const m = d.querySelectorAll(".meta span"); m[0].textContent = n.meta[0]; m[1].textContent = n.meta[1];
  d.querySelector("b").textContent = n.b; d.querySelector("small").textContent = n.s;
  return d;
}
function playNotes() {
  notes.innerHTML = "";
  if (reduce) { [NOTES[1], NOTES[3]].forEach(n => notes.appendChild(noteEl(n))); return; }
  NOTES.forEach((n, i) => setTimeout(() => {
    const el = noteEl(n); notes.appendChild(el);
    while (notes.children.length > 3) notes.firstChild.remove();
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("in")));
  }, 1400 + i * 1700));
  setTimeout(() => { [...notes.children].forEach(c => c.classList.add("out")); }, 1400 + NOTES.length * 1700 + 2600);
  setTimeout(playNotes, 1400 + NOTES.length * 1700 + 3400);
}
playNotes();

/* ===== statement: word-by-word reveal (*word* = gold italic) ===== */
const stmt = $("#stmt");
stmt.innerHTML = stmt.dataset.words.split("|").map(line => line.split(" ").map(w => {
  const g = /^\*.*\*$/.test(w); return `<span class="w${g ? " g" : ""}">${w.replace(/\*/g, "")}</span>`;
}).join(" ")).join("<br>");
const words = $$("#stmt .w");

/* ===== system dashboard: live feed (demo data) ===== */
const feedItems = [
  ["@", "New enquiry answered in 4 seconds", "Booking link sent"],
  ["CAL", "Call booked: Thursday 10:00", "Calendar invite confirmed"],
  ["ID", "ID check link sent", "Engagement letter signed"],
  ["DOC", "Documents received", "Checklist complete"],
  ["D4", "Reminder sent: bank statements", "Day 4 of 7"],
  ["DD", "Direct Debit set up", "Monthly fee active"],
  ["Q", "Quarterly update reminder queued", "Due in 7 days"],
  ["★", "Review request sent", "Referral link included"]
];
const feed = $("#feed"); let fi = 0; const counters = {s1: 12, s2: 31, s3: 9};
function pushFeed() {
  const [ic, t, s] = feedItems[fi++ % feedItems.length];
  const d = document.createElement("div"); d.className = "feed-item";
  d.innerHTML = `<div class="ic"></div><div><b></b><small></small></div>`;
  d.querySelector(".ic").textContent = ic; d.querySelector("b").textContent = t; d.querySelector("small").textContent = s;
  feed.prepend(d); while (feed.children.length > 4) feed.lastChild.remove();
  counters.s2++; if (fi % 3 === 0) counters.s1++; if (fi % 4 === 0) counters.s3++;
  $("#s1").textContent = counters.s1; $("#s2").textContent = counters.s2; $("#s3").textContent = counters.s3;
}
for (let i = 0; i < 4; i++) pushFeed();
let feedTimer = null;
new IntersectionObserver(es => es.forEach(e => {
  if (reduce) return;
  if (e.isIntersecting && !feedTimer) feedTimer = setInterval(pushFeed, 2600);
  else if (!e.isIntersecting && feedTimer) { clearInterval(feedTimer); feedTimer = null; }
})).observe($("#system"));

/* ===== scroll-driven scenes ===== */
const screen = $("#screen"), system = $("#system"), bars = $$("#bars i");
const barVals = [34, 48, 41, 62, 55, 70, 66, 81, 74, 88, 92, 97];
const track = $("#track"), trackItems = [...track.children];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
let ticking = false;
function req() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
function frame() {
  ticking = false;
  const vh = innerHeight;
  nav.classList.toggle("scrolled", scrollY > 8);
  sticky.classList.toggle("show", scrollY > vh * .7);

  // statement words
  const r = stmt.getBoundingClientRect();
  const p = reduce ? 1 : clamp((vh * .85 - r.top) / (r.height + vh * .3));
  words.forEach((w, i) => w.classList.toggle("lit", i < p * words.length * 1.1));

  // chase track progress
  const tr = track.getBoundingClientRect();
  const tp = reduce ? 1 : clamp((vh * .62 - tr.top) / tr.height);
  track.style.setProperty("--p", tp.toFixed(3));
  trackItems.forEach(li => { const lr = li.getBoundingClientRect(); li.classList.toggle("on", reduce || lr.top < vh * .66); });

  // dashboard tilts up into view
  if (!isMobile() && !reduce) {
    const sr = system.getBoundingClientRect();
    const sp = clamp(-sr.top / (sr.height - vh) * 1.5);
    const e = 1 - Math.pow(1 - sp, 3);
    screen.style.transform = `rotateX(${55 * (1 - e)}deg) translateY(${120 * (1 - e)}px) scale(${.86 + .14 * e})`;
    bars.forEach((b, i) => b.style.height = (e > .45 ? barVals[i] : 10) + "%");
  }
}
addEventListener("scroll", req, {passive: true});
addEventListener("resize", req);
frame();
if (reduce || isMobile()) {
  new IntersectionObserver((es, o) => es.forEach(e => { if (e.isIntersecting) { bars.forEach((b, i) => b.style.height = barVals[i] + "%"); o.disconnect(); } }), {threshold: .3}).observe(screen);
}

/* flip cards: tap toggles on touch / keyboard */
$$(".flip").forEach(f => f.addEventListener("click", () => f.classList.toggle("on")));

/* ===== live client journey (each step shows the email the client receives) ===== */
const CHECKLISTS = {
  sole: "• Sales records or income summary\n• Business expenses and receipts\n• Bank statements\n• Last year's return (if switching)",
  landlord: "• Rent received per property\n• Mortgage interest statements\n• Repair and letting agent invoices\n• Insurance and service charges",
  ltd: "• Bank statements for the year\n• Sales and purchase invoices\n• Director's loan account detail\n• Payroll and dividend records",
  contractor: "• Invoices to clients or agency\n• Expenses and mileage log\n• Bank statements\n• Contract or IR35 paperwork"
};
const DEADLINE = {sole: "your quarterly update", landlord: "your quarterly update", ltd: "your company accounts", contractor: "your Self Assessment return"};
function steps(name, type) {
  const n = name || "there", f = CONFIG.firm;
  return [
    {w: "Minute 0", h: "Enquiry answered instantly", p: "The reply lands before the client closes the tab.", s: `Thanks ${n}, let's find a time`, m: `Hi ${n}, thanks for getting in touch. Pick a time that suits you for a free 20-minute call.`},
    {w: "Minute 2", h: "Call booked and confirmed", p: "Calendar invite sent to both diaries.", s: "Your call is booked", m: `Confirmed: free 20-minute call, Thursday 10:00. A calendar invite is on its way.`},
    {w: "Day 0", h: "Welcome: ID check and engagement letter", p: "One email: ID check link from the firm's provider, plus e-signature.", s: `Welcome to ${f}`, m: `Two quick things before we start:\n1. Your secure ID check (a few minutes on your phone)\n2. Sign your engagement letter online`},
    {w: "Day 0", h: "Personal document checklist", p: "A different list for every client type.", s: "Your document checklist", m: `Please upload:\n${CHECKLISTS[type]}`},
    {w: "Day 2 · 4 · 7", h: "Polite document reminders", p: "The firm is alerted only if something is still missing on day 7.", s: "A friendly nudge on your documents", m: `Hi ${n}, just checking in. We're still waiting on your bank statements. The upload link is below and takes two minutes.`},
    {w: "30 days, 7 days, on the day", h: "Deadline reminders", p: "Matched to the client's type, with what's needed each time.", s: `7 days to ${DEADLINE[type]}`, m: `A heads-up: ${DEADLINE[type]} is due in 7 days. Everything is on track. If anything has changed, reply and we'll sort it.`},
    {w: "Invoice +3 · 7 · 14", h: "Gentle payment reminders", p: "Fixed fee by Direct Debit. Late invoices get polite chasers.", s: "A quick note about your invoice", m: `Hi ${n}, a gentle reminder that this month's invoice is now 3 days overdue. If it's already paid, please ignore this.`},
    {w: "Day 7 after completion", h: "Review and referral request", p: "One tap to review. A personal link to recommend the firm.", s: "Thank you, and a small favour", m: `Thank you for trusting us, ${n}. Would you leave a quick review? And if you know someone who needs a hand, here's your personal link.`}
  ];
}
const tl = $("#tl"), clock = $("#clock");
function render(list, on) {
  tl.innerHTML = "";
  list.forEach((s, i) => {
    const d = document.createElement("div"); d.className = "step" + (i < on ? " on" : "");
    d.innerHTML = `<div class="when"></div><h4></h4><p></p><div class="msg"><i></i><span></span></div>`;
    d.querySelector(".when").textContent = s.w; d.querySelector("h4").textContent = s.h; d.querySelector("p").textContent = s.p;
    d.querySelector(".msg i").textContent = `From ${CONFIG.firm} · ${s.s}`; d.querySelector(".msg span").textContent = s.m;
    tl.appendChild(d);
  });
}
render(steps("Alex", "sole"), 0);
const clocks = ["Day 0 · 00:00", "Day 0 · 00:02", "Day 0 · 09:00", "Day 0 · 09:05", "Day 7", "Day 21", "Day 33", "Day 60"];
let timers = [];
function runJourney(name, type) {
  timers.forEach(clearTimeout); timers = [];
  render(steps(name, type), 0);
  const els = [...tl.children];
  if (isMobile()) tl.parentElement.scrollIntoView({block: "start", behavior: reduce ? "auto" : "smooth"});
  els.forEach((el, i) => timers.push(setTimeout(() => {
    els.forEach(x => x.classList.remove("cur"));
    el.classList.add("on", "cur"); clock.textContent = clocks[i];
    if (!isMobile()) tl.scrollTo({top: el.offsetTop - tl.offsetTop - 8, behavior: reduce ? "auto" : "smooth"});
  }, reduce ? 0 : 1000 * i + 300)));
}

/* ===== forms ===== */
const lastSent = {};
async function send(payload, statusEl) {
  if (!CONFIG.endpoint) { statusEl.textContent = "Simulation mode: no real email sent."; return {ok: true, sim: true}; }
  try {
    // text/plain avoids a CORS preflight, which Apps Script web apps do not answer
    const r = await fetch(CONFIG.endpoint, {method: "POST", headers: {"Content-Type": "text/plain;charset=utf-8"}, body: JSON.stringify(payload)});
    return await r.json();
  } catch (e) { return {ok: false, error: "network"}; }
}
const okEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

$("#demoForm").addEventListener("submit", async e => {
  e.preventDefault();
  const f = e.target, st = $("#demoStatus"), btn = $("#demoBtn");
  const name = f.name.value.trim(), email = f.email.value.trim(), type = f.type.value;
  if (!name) { st.textContent = "Please add your name."; return; }
  if (!okEmail(email)) { st.textContent = "Please enter a valid email address."; return; }
  if (!$("#dc").checked) { st.textContent = "Please tick the consent box so we can send the demo email."; return; }
  if (f.company_website.value) return; // honeypot
  if (lastSent[email] && Date.now() - lastSent[email] < 3600e3) { st.textContent = "You already ran the demo recently. Check your inbox."; runJourney(name, type); return; }
  btn.disabled = true; st.textContent = "Running…";
  runJourney(name, type);
  const res = await send({action: "demo", name, email, type, consent: true, website: f.company_website.value}, st);
  if (res.ok && !res.sim) { st.textContent = "Done. Check your inbox for the first email."; lastSent[email] = Date.now(); }
  else if (!res.ok) { st.textContent = res.error === "rate" ? "Please try again in an hour." : "The timeline ran, but the email could not be sent right now."; }
  btn.disabled = false;
});

$("#bookForm").addEventListener("submit", async e => {
  e.preventDefault();
  const f = e.target, st = $("#bookStatus"), btn = $("#bookBtn");
  if (!f.name.value.trim()) { st.textContent = "Please add your name."; return; }
  if (!okEmail(f.email.value.trim())) { st.textContent = "Please enter a valid email address."; return; }
  if (!$("#bc").checked) { st.textContent = "Please tick the consent box."; return; }
  if (f.company_website.value) return;
  btn.disabled = true; st.textContent = "Sending…";
  const res = await send({action: "book", name: f.name.value.trim(), email: f.email.value.trim(), phone: f.phone.value.trim(), message: f.message.value.trim(), consent: true}, st);
  if (res.ok && !res.sim) { st.textContent = "Thank you. Check your inbox for your booking link."; f.reset(); }
  else if (!res.ok) st.textContent = "Something went wrong. Please try again shortly.";
  btn.disabled = false;
});

/* open privacy/cookies notes when linked */
function openHash() { const t = location.hash && document.querySelector(location.hash); if (t && t.tagName === "DETAILS") t.open = true; }
addEventListener("hashchange", openHash); openHash();
