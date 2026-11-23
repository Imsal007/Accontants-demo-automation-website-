# Apps Script setup (about 5 minutes)

1. Create a new Google Sheet, then go to **Extensions > Apps Script**.
2. Add two files: paste `Code.gs` into the first, then click **+ > Script**, name it `Emails` and paste `Emails.gs` into it.
3. Fill in `SETTINGS` in `Code.gs` (sheet ID, owner email, site URL). Firm name, person, phone and links for the emails are set in `emailContext()` in `Emails.gs`.
4. Run `setup` once and approve the permissions. This creates the **Enquiries** and **Clients** sheets and a daily 9am trigger.
5. Go to **Deploy > Manage deployments**, edit the web app and choose **New version** (or **New deployment** the first time, with Execute as: *Me* and Who has access: *Anyone*).
6. Copy the web app URL into `CONFIG.endpoint` at the top of `app.js`.

## The 12 email journey

`sendDemoSequence()` sends every email in order to `SETTINGS.DEMO_TO`. Select it in the function menu and click **Run**. Use it for screenshots and Reels.

Previews of every email are in `/email-previews/` on the site. Header and signature images are in `/assets/email/`.

## Notes

- **Daily automations** run from the Clients sheet. Only rows with Consent = Yes get emails.
- **Limits:** a free Gmail account has a daily sending limit, so demo sends are capped at 40 a day and one per address per hour.
- **ID checks** are done by the firm's own identity verification provider. The welcome email links to it; the firm reviews the result.
- **WhatsApp** is not included yet. It can be added later with the WhatsApp Business API.
