-- Calibration Data Sheet System — initial schema
-- Mirrors the HF-01/A/1 paper form: one sheet -> many job blocks -> many measurement rows

CREATE TABLE IF NOT EXISTS lab_settings (
  id                   SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- single-row table
  lab_name             TEXT,
  lab_id_no            TEXT,
  accreditation_no     TEXT,
  phone                TEXT,
  default_report_email TEXT,
  cc_emails            TEXT,     -- comma-separated
  address              TEXT,
  footer_note          TEXT,
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO lab_settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS sheets (
  id                    SERIAL PRIMARY KEY,
  sheet_no              TEXT NOT NULL,
  party_name            TEXT,
  description_of_item   TEXT,
  srf_no                TEXT,
  item_received_date    DATE,
  condition_on_received TEXT,
  location              TEXT CHECK (location IN ('In Lab', 'On Site')),
  calibrated_by         TEXT,
  remark                TEXT,
  recipient_email       TEXT,          -- override; falls back to lab_settings.default_report_email
  email_status          TEXT DEFAULT 'pending' CHECK (email_status IN ('pending', 'sent', 'failed')),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sheets_party_srf ON sheets (party_name, srf_no);
CREATE INDEX IF NOT EXISTS idx_sheets_created_at ON sheets (created_at DESC);

CREATE TABLE IF NOT EXISTS job_blocks (
  id               SERIAL PRIMARY KEY,
  sheet_id         INTEGER NOT NULL REFERENCES sheets(id) ON DELETE CASCADE,
  job_no           TEXT,
  instrument_name  TEXT NOT NULL,
  id_no            TEXT,           -- instrument's own ID number (used for dedup in instrument directory)
  make_model       TEXT,
  sr_no            TEXT,           -- serial number (also used for dedup)
  type             TEXT,
  cal_date         DATE,
  due_date         DATE,
  range            TEXT,
  resolution       TEXT,
  accuracy         TEXT,
  location         TEXT,
  temp_c           NUMERIC,
  rh_percent       NUMERIC,
  air_pressure_mbar NUMERIC,
  standard_used    TEXT,
  detail           TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_job_blocks_sheet_id ON job_blocks (sheet_id);
-- dedup lookups for the Instrument Directory: prefer id_no, fall back to sr_no
CREATE INDEX IF NOT EXISTS idx_job_blocks_id_no ON job_blocks (id_no);
CREATE INDEX IF NOT EXISTS idx_job_blocks_sr_no ON job_blocks (sr_no);
CREATE INDEX IF NOT EXISTS idx_job_blocks_due_date ON job_blocks (due_date);

CREATE TABLE IF NOT EXISTS measurement_rows (
  id             SERIAL PRIMARY KEY,
  job_block_id   INTEGER NOT NULL REFERENCES job_blocks(id) ON DELETE CASCADE,
  parameter_range TEXT,
  cal_point      TEXT,
  set_value_uuc  NUMERIC,
  x1             NUMERIC,
  x2             NUMERIC,
  x3             NUMERIC,
  x4             NUMERIC,
  x5             NUMERIC,
  x6             NUMERIC,
  average         NUMERIC,   -- computed server-side on write (mean of non-null X1-X6)
  error           NUMERIC,   -- computed server-side on write (average - set_value_uuc)
  row_order       INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_measurement_rows_job_block_id ON measurement_rows (job_block_id);
