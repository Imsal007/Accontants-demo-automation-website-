# Accountant demo website with live automations

A premium one-page website for a solo UK accountant, built by SAL Digital. It shows six automations, framed as problem and fix, and includes a "try before you buy" live demo.

- `index.html`, `styles.css` and `app.js` are the static site, which works on any static host (GitHub Pages, Netlify).
- `app.js` has a `CONFIG` block at the top for the firm name, the Apps Script endpoint and the WhatsApp number.
- `apps-script/` is the Google Apps Script backend: instant reply, owner alert, document chase, late invoice chase, deadline reminders and review requests. See its README for setup.
- The firm name, credentials and photo are placeholders, and the dashboard figures are labelled sample data.
