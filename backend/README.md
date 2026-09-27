# Calibration Data Sheet — Backend

Backend for digitizing the HF-01/A/1 Calibration Data Sheet: capture, store,
and query calibration records (sheets → job blocks → measurement rows).

## Setup

```bash
npm install
cp .env.example .env
# edit .env — paste your Railway Postgres DATABASE_URL and SMTP details
npm run migrate   # creates tables
npm run dev        # starts the server with auto-reload
```

Server runs on `http://localhost:4000` by default. Check `/health` to confirm it's up.

## What's built so far

- **Schema** (`migrations/001_init.sql`): `sheets`, `job_blocks`,
  `measurement_rows`, `lab_settings` — matches the paper form's structure
  (one sheet, multiple job blocks, each with its own measurement table).
- **POST /api/sheets** — creates a full sheet (header + job blocks +
  measurement rows) in one transaction. Average and Error are computed
  server-side on write (see `src/lib/measurements.js`).
- **GET /api/sheets** — Sheet History list, newest first, optional
  `?search=` across sheet no / party / SRF no.
- **GET /api/sheets/:id** — full sheet detail.
- **GET /api/instruments** — deduplicated Instrument Directory (grouped
  by ID No., falling back to Serial No.), with computed due-date status.
- **GET /api/due-dates** — same grouping, shaped as bucket counts +
  lists for the Due Date Tracker.
- **GET/PUT /api/settings** — lab identity and default email settings.
- **PDF generation** (`src/services/pdfService.js`) — builds a PDF from a
  full sheet, laid out to mirror the paper form (letterhead from Settings,
  header fields, one section per job block, measurement table per block).
- **Email dispatch** (`src/services/emailService.js`, via Nodemailer) —
  sends the PDF as an attachment. Works with Brevo SMTP or any SMTP
  provider — just change the `SMTP_*` values in `.env`.
- Dispatch happens automatically after a sheet is created (`POST /api/sheets`),
  and can be retried with **POST /api/sheets/:id/resend**. It runs *after* the
  DB transaction commits and never throws — a failed send is recorded as
  `email_status = 'failed'` on the sheet rather than losing the record, and
  the create-sheet response includes `email: { status, reason }` so the
  frontend can show whether it actually went out.
- Recipient resolution: `sheet.recipient_email` if provided on submission,
  else `lab_settings.default_report_email`; CC always pulls from
  `lab_settings.cc_emails`. If neither is set, the sheet still saves but
  `email_status` is `'failed'` with a clear reason.

## What's NOT built yet (next steps)

- Authentication (currently fully open — fine for local dev, not for
  deploying anywhere reachable from outside).
- Editing/deleting a sheet after submission.
- Frontend (React/Vite) — this repo is backend-only.

## Testing email locally

You need real SMTP credentials to actually send — Brevo's free tier works
fine for this. Once `.env` has `SMTP_HOST`/`SMTP_USER`/`SMTP_PASS` filled
in, submit a test sheet via `POST /api/sheets` (or Postman/curl) and check
the response's `email` field, plus your inbox.

## Deployment (Railway)

1. Push this to a GitHub repo.
2. Create a new Railway project, add a Postgres plugin, and deploy this
   repo as a service — Railway auto-injects `DATABASE_URL`.
3. Set `SMTP_*` and `EMAIL_FROM` as Railway environment variables once
   Brevo (or your chosen provider) is configured.
4. Run `npm run migrate` once against the Railway database (via Railway's
   shell/CLI, or temporarily point your local `.env` at it).
