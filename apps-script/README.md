# Apps Script setup (about 5 minutes)

1. Create a new Google Sheet, then go to **Extensions → Apps Script**.
2. Paste `Code.gs` in, and fill in `SETTINGS` (booking link, review link, upload link).
3. Run `setup` once and approve the permissions. This creates the **Enquiries** and **Clients** sheets and a daily 9am trigger.
4. Go to **Deploy → New deployment → Web app**, with Execute as: *Me* and Who has access: *Anyone*.
5. Copy the web app URL into `CONFIG.endpoint` at the top of `app.js`.

## Notes

- **Daily automations** run from the Clients sheet. Only rows with Consent = Yes get emails.
- **Limits:** A free Gmail account can send about 100 emails a day, so demo sends are capped at 40 a day and one per address per hour.
- **WhatsApp** is not included yet. It can be added later with the WhatsApp Business API.
