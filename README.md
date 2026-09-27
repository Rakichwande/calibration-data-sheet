# Calibration Data Sheet System

Digitizes the HF-01/A/1 Calibration Data Sheet: capture, store, PDF/email
dispatch, and track instrument due dates.

- `backend/` — Node.js/Express + PostgreSQL API. See `backend/README.md`.
- `frontend/` — React/Vite UI. See `frontend/README.md`.

Deployed as two separate Railway services pointing at this one repo,
each with its own **Root Directory** set (`backend` / `frontend`) in
Railway's service settings.
