/* ===== CONFIG: change these when the demo becomes a real client site ===== */
const CONFIG = {
  firm: "Ledgerline Advisory",
  // Paste your deployed Google Apps Script web app URL here (see apps-script/README).
  // While empty, the page runs in simulation mode and sends no real email.
  endpoint: "https://script.google.com/macros/s/AKfycbyvRFC7bBz1JQnyn8nZ0KHc7yUfz-E3sqqRLuU05H6Wnu2OKDhdRtnAH-7b7tuEaQph/exec",
  whatsapp: "" // e.g. "447700900000" (country code, no +)
};

document.querySelectorAll("[data-firm]").forEach(e => e.textContent = CONFIG.firm);
if (CONFIG.whatsapp) document.querySelector(".wa").href = "https://wa.me/" + CONFIG.whatsapp;
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = s => document.querySelector(s);

/* nav */
const nav = $("#nav");
addEventListener("scroll", () => nav.classList.toggle("scrolled", scrollY > 8), {passive: true});
$("#burger").addEventListener("click", () => $("#mm").classList.toggle("open"));
document.querySelectorAll("#mm a").forEach(a => a.addEventListener("click", () => $("#mm").classList.remove("open")));

/* scroll reveal */
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), {threshold: .12});
document.querySelectorAll(".reveal").forEach(el => io.observe(el));

/* hero live feed (sample data, labelled as such) */
const feedItems = [
  ["📩", "New enquiry answered in 4 seconds", "Booking link sent"],
  ["📅", "Call booked: Thursday 10:00", "Calendar invite confirmed"],
  ["🪪", "ID check completed", "Engagement letter signed"],
  ["📎", "Documents received", "Checklist 100% complete"],
  ["⏰", "Reminder sent: bank statements", "Day 4 of 7"],
  ["💷", "Direct Debit set up", "Monthly fee active"],
  ["🗓️", "Deadline reminder queued", "Self Assessment, 31 January"],
  ["⭐", "Review request sent", "Referral link included"]
];
const feed = $("#feed"); let fi = 0;
const counters = {s1: 12, s2: 31, s3: 0};
function pushFeed() {
  const [ic, t, s] = feedItems[fi++ % feedItems.length];
  const d = document.createElement("div"); d.className = "feed-item";
  d.innerHTML = `<div class="ic">${ic}</div><div><b></b><small></small></div>`;
  d.querySelector("b").textContent = t; d.querySelector("small").textContent = s;
  feed.prepend(d); while (feed.children.length > 4) feed.lastChild.remove();
  counters.s2++; if (fi % 3 === 0) counters.s1++;
  $("#s1").textContent = counters.s1; $("#s2").textContent = counters.s2;
}
for (let i = 0; i < 4; i++) pushFeed();
if (!reduce) setInterval(pushFeed, 2600);

/* ===== live client journey ===== */
const CHECKLISTS = {
  sole: "• Income summary or sales records\n• Business expenses and receipts\n• Bank statements\n• Previous year's return (if switching)",
  landlord: "• Rent received per property\n• Mortgage interest statements\n• Repair and agent invoices\n• Insurance and service charges",
  ltd: "• Bank statements for the year\n• Sales and purchase invoices\n• Director's loan account detail\n• Payroll and dividend records",
  contractor: "• Invoices to clients or agency\n• Expenses and mileage log\n• Bank statements\n• Umbrella or IR35 paperwork"
};
const DEADLINE = {
  sole: "Self Assessment, 31 January", landlord: "Self Assessment, 31 January",
  ltd: "Company accounts, 9 months after year end", contractor: "Self Assessment, 31 January"
};
function steps(name, type) {
  const n = name || "there";
  return [
    {w: "Minute 0", h: "Enquiry answered instantly", p: "The reply lands before the client closes the tab.", m: `Hi ${n}, thanks for getting in touch with ${CONFIG.firm}. Pick a time that suits you and we will come to the call prepared.`},
    {w: "Minute 2", h: "Call booked and confirmed", p: "Calendar invite sent to both diaries.", m: `Confirmed: free 20-minute call, Thursday 10:00. A calendar invite is on its way, ${n}.`},
    {w: "Day 0", h: "ID check and engagement letter", p: "Anti-money-laundering check and e-signature in one secure email.", m: `${n}, before we start we need two quick things:\n1. A secure ID check (2 minutes on your phone)\n2. Sign your engagement letter online`},
    {w: "Day 0", h: "Personal document checklist", p: "A different list for every client type.", m: `Please send us:\n${CHECKLISTS[type]}`},
    {w: "Day 2 · 4 · 7", h: "Polite document reminders", p: "You are alerted only if something is still missing after day 7.", m: `Hi ${n}, just a friendly nudge: we are still waiting on your bank statements. Reply to this email or upload them securely here.`},
    {w: "Week 2", h: "Fixed fee by Direct Debit", p: "No hourly billing. Late invoices get gentle chasers on day 3, 7 and 14.", m: `Your fixed monthly fee is set up by Direct Debit, ${n}. No invoices to chase, no surprises.`},
    {w: "Deadline − 30 · 7 · 0", h: "Deadline reminders", p: "Matched to the client's type, with a checklist each time.", m: `Reminder: ${DEADLINE[type]}. Everything we need is in your portal. We are on track.`},
    {w: "Day 7 after completion", h: "Review and referral request", p: "One tap to review. A personal link to recommend you.", m: `${n}, thank you for trusting us. Would you leave a quick review? And if you know someone who needs a hand, share your personal link.`}
  ];
}
const tl = $("#tl"), clock = $("#clock");
function render(list, on) {
  tl.innerHTML = "";
  list.forEach((s, i) => {
    const d = document.createElement("div"); d.className = "step" + (i < on ? " on" : "");
    d.innerHTML = `<div class="when"></div><h4></h4><p></p><div class="msg"></div>`;
    d.querySelector(".when").textContent = s.w; d.querySelector("h4").textContent = s.h;
    d.querySelector("p").textContent = s.p; d.querySelector(".msg").textContent = s.m;
    tl.appendChild(d);
  });
}
render(steps("Alex", "sole"), 0);
const clocks = ["Day 0 · 00:00", "Day 0 · 00:02", "Day 0 · 09:00", "Day 0 · 09:05", "Day 7", "Day 14", "Day 21", "Day 28"];
let timers = [];
function runJourney(name, type) {
  timers.forEach(clearTimeout); timers = [];
  const list = steps(name, type); render(list, 0);
  const els = [...tl.children];
  els.forEach((el, i) => timers.push(setTimeout(() => {
    els.forEach(x => x.classList.remove("cur"));
    el.classList.add("on", "cur"); clock.textContent = clocks[i];
    if (i === 0 && innerWidth < 980) tl.parentElement.scrollIntoView({block: "start", behavior: reduce ? "auto" : "smooth"});
  }, reduce ? 0 : 900 * i + 300)));
}

/* ===== form handling ===== */
const lastSent = {};
async function send(payload, statusEl) {
  if (!CONFIG.endpoint) { statusEl.textContent = "Simulation mode: no real email sent. Connect the Apps Script endpoint to send it."; return {ok: true, sim: true}; }
  try {
    // text/plain avoids a CORS preflight, which Apps Script web apps do not answer
    const r = await fetch(CONFIG.endpoint, {method: "POST", headers: {"Content-Type": "text/plain;charset=utf-8"}, body: JSON.stringify(payload)});
    const j = await r.json(); return j;
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

/* ===== cinematic layer ===== */
// giant name: split into letters for the 3D entrance
const giant = $("#giant");
if (giant) giant.innerHTML = [...giant.textContent].map((c, i) => `<span style="animation-delay:${.08 * i + .2}s">${c}</span>`).join("");

// statement: word-by-word scroll reveal (*word* = gold)
const stmt = $("#stmt");
if (stmt) {
  stmt.innerHTML = stmt.dataset.words.split("|").map(line => line.split(" ").map(w => {
    const g = /^\*.*\*$/.test(w); return `<span class="w${g ? " g" : ""}">${w.replace(/\*/g, "")}</span>`;
  }).join(" ")).join("<br>");
}
const words = stmt ? [...stmt.querySelectorAll(".w")] : [];

// depth layers, 3D screen, bars
const layers = [...document.querySelectorAll(".cine .layer")];
const screen = $("#screen"), show = $("#system"), bars = [...document.querySelectorAll("#bars i")];
const barVals = [34, 48, 41, 62, 55, 70, 66, 81, 74, 88, 92, 97];
let mx = 0, my = 0, ticking = false;
const glow = $("#glow");
addEventListener("pointermove", e => {
  mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5;
  if (glow) { glow.style.left = e.clientX + "px"; glow.style.top = e.clientY + "px"; }
  req();
}, {passive: true});
addEventListener("scroll", req, {passive: true});
function req() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
function frame() {
  ticking = false;
  if (reduce) return;
  const y = scrollY;
  layers.forEach(l => {
    const d = +l.dataset.depth;
    l.style.transform = `translate3d(${mx * d * -60}px, ${y * d * .6 + my * d * -40}px, 0) rotateY(${mx * d * 6}deg)`;
  });
  if (words.length) {
    const r = stmt.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (innerHeight * .85 - r.top) / (r.height + innerHeight * .35)));
    words.forEach((w, i) => w.classList.toggle("lit", i < p * words.length * 1.15));
  }
  if (screen && show) {
    const r = show.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, -r.top / (r.height - innerHeight) * 1.6));
    const e = 1 - Math.pow(1 - p, 3);
    screen.style.transform = `rotateX(${58 * (1 - e) + mx * 4}deg) rotateY(${mx * -6}deg) translateY(${120 * (1 - e)}px) scale(${.86 + .14 * e})`;
    bars.forEach((b, i) => b.style.height = (e > .5 ? barVals[i] : 10) + "%");
  }
}
frame();
if (reduce) bars.forEach((b, i) => b.style.height = barVals[i] + "%");

// flip cards: tap to toggle on touch
document.querySelectorAll(".flip").forEach(f => f.addEventListener("click", () => f.classList.toggle("on")));
