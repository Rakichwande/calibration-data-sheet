# Calibration Data Sheet — Frontend

React/Vite frontend for the Calibration Data Sheet system. Talks to the
backend in `calibration-backend/` over REST.

## Setup

```bash
npm install
cp .env.example .env
# edit .env if your backend isn't on http://localhost:4000
npm run dev
```

Runs on `http://localhost:5173`. Make sure the backend is running first
(`npm run dev` in `calibration-backend/`) — every page here calls it.

## Pages

- **Create Sheet** (`/`) — the main form: sheet header, repeatable job
  blocks, and a measurement table per block with live Average/Error
  preview (recalculated authoritatively by the backend on save). Submits
  to `POST /api/sheets`, which also triggers PDF/email dispatch — the
  result (sent/failed + reason) is shown right after submit.
- **Sheet History** (`/history`) — searchable list of all submitted
  sheets; click through to a read-only detail view with a **Resend
  Email** action.
- **Instruments** (`/instruments`) — deduplicated per-instrument
  directory with due-date status.
- **Due Dates** (`/due-dates`) — the four status buckets from the
  backend, clickable to filter the list below.
- **Settings** (`/settings`) — lab identity, default report email, CC
  list, and report footer note.

## What's NOT built yet

- Authentication / login (matches the backend, which is also open for now).
- Editing a sheet after submission (only resend-email is supported).
- Dashboard/overview page (the Base44 prototype had one — not yet ported
  here; the four pages above cover the functional core first).

## Deployment (Railway)

Deploy as a separate Railway service from the backend (or as a static
site build via `npm run build` served from `dist/`). Set
`VITE_API_URL` as a Railway environment variable pointing at the
backend service's public URL.
