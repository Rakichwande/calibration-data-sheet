const express = require('express');
const pool = require('../db/pool');
const { computeAverageAndError } = require('../lib/measurements');
const { getFullSheet } = require('../lib/getFullSheet');
const { generateSheetPdf } = require('../services/pdfService');
const { sendSheetEmail } = require('../services/emailService');

const router = express.Router();

// POST /api/sheets
// Body: { header: {...}, job_blocks: [{ ...fields, measurement_rows: [...] }] }
router.post('/', async (req, res) => {
  const { header, job_blocks = [] } = req.body;

  if (!header || !header.sheet_no) {
    return res.status(400).json({ error: 'header.sheet_no is required' });
  }
  if (job_blocks.length === 0) {
    return res.status(400).json({ error: 'At least one job block is required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const sheetResult = await client.query(
      `INSERT INTO sheets
        (sheet_no, party_name, description_of_item, srf_no, item_received_date,
         condition_on_received, location, calibrated_by, remark, recipient_email)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING id`,
      [
        header.sheet_no,
        header.party_name || null,
        header.description_of_item || null,
        header.srf_no || null,
        header.item_received_date || null,
        header.condition_on_received || null,
        header.location || null,
        header.calibrated_by || null,
        header.remark || null,
        header.recipient_email || null,
      ]
    );
    const sheetId = sheetResult.rows[0].id;

    for (const block of job_blocks) {
      const blockResult = await client.query(
        `INSERT INTO job_blocks
          (sheet_id, job_no, instrument_name, id_no, make_model, sr_no, type,
           cal_date, due_date, range, resolution, accuracy, location,
           temp_c, rh_percent, air_pressure_mbar, standard_used, detail)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
         RETURNING id`,
        [
          sheetId,
          block.job_no || null,
          block.instrument_name,
          block.id_no || null,
          block.make_model || null,
          block.sr_no || null,
          block.type || null,
          block.cal_date || null,
          block.due_date || null,
          block.range || null,
          block.resolution || null,
          block.accuracy || null,
          block.location || null,
          block.temp_c || null,
          block.rh_percent || null,
          block.air_pressure_mbar || null,
          block.standard_used || null,
          block.detail || null,
        ]
      );
      const jobBlockId = blockResult.rows[0].id;

      const rows = block.measurement_rows || [];
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const { average, error } = computeAverageAndError(row);

        await client.query(
          `INSERT INTO measurement_rows
            (job_block_id, parameter_range, cal_point, set_value_uuc,
             x1, x2, x3, x4, x5, x6, average, error, row_order)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
          [
            jobBlockId,
            row.parameter_range || null,
            row.cal_point || null,
            row.set_value_uuc ?? null,
            row.x1 ?? null,
            row.x2 ?? null,
            row.x3 ?? null,
            row.x4 ?? null,
            row.x5 ?? null,
            row.x6 ?? null,
            average,
            error,
            i,
          ]
        );
      }
    }

    await client.query('COMMIT');

    // Dispatch happens after commit: the sheet is already safely saved, so an
    // email/PDF failure here should never roll back or block the record being kept.
    const dispatchResult = await dispatchSheetEmail(sheetId);

    res.status(201).json({ id: sheetId, email: dispatchResult });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Failed to create sheet:', err);
    res.status(500).json({ error: 'Failed to create sheet' });
  } finally {
    client.release();
  }
});

// GET /api/sheets?search=...
// Sheet History: newest first, optional search across sheet_no / party_name / srf_no
router.get('/', async (req, res) => {
  const { search } = req.query;
  try {
    const result = search
      ? await pool.query(
          `SELECT id, sheet_no, party_name, srf_no, location, email_status, created_at
           FROM sheets
           WHERE sheet_no ILIKE $1 OR party_name ILIKE $1 OR srf_no ILIKE $1
           ORDER BY created_at DESC`,
          [`%${search}%`]
        )
      : await pool.query(
          `SELECT id, sheet_no, party_name, srf_no, location, email_status, created_at
           FROM sheets
           ORDER BY created_at DESC`
        );
    res.json(result.rows);
  } catch (err) {
    console.error('Failed to list sheets:', err);
    res.status(500).json({ error: 'Failed to list sheets' });
  }
});

// GET /api/sheets/:id — full sheet detail (header + job blocks + measurement rows)
router.get('/:id', async (req, res) => {
  try {
    const sheet = await getFullSheet(req.params.id);
    if (!sheet) return res.status(404).json({ error: 'Sheet not found' });
    res.json(sheet);
  } catch (err) {
    console.error('Failed to fetch sheet:', err);
    res.status(500).json({ error: 'Failed to fetch sheet' });
  }
});

// POST /api/sheets/:id/resend — regenerate the PDF and re-send, e.g. after
// dispatch failed the first time or the recipient needs a fresh copy.
router.post('/:id/resend', async (req, res) => {
  try {
    const sheet = await getFullSheet(req.params.id);
    if (!sheet) return res.status(404).json({ error: 'Sheet not found' });

    const result = await dispatchSheetEmail(sheet.id);
    res.json({ email: result });
  } catch (err) {
    console.error('Failed to resend sheet email:', err);
    res.status(500).json({ error: 'Failed to resend sheet email' });
  }
});

// Generates the PDF and sends it, then records the outcome on the sheet.
// Never throws — a dispatch failure is recorded as email_status = 'failed'
// rather than surfaced as a 500, since the sheet itself is already saved.
async function dispatchSheetEmail(sheetId) {
  try {
    const sheet = await getFullSheet(sheetId);
    const settingsResult = await pool.query('SELECT * FROM lab_settings WHERE id = 1');
    const settings = settingsResult.rows[0];

    const to = sheet.recipient_email || settings?.default_report_email;
    if (!to) {
      await pool.query("UPDATE sheets SET email_status = 'failed' WHERE id = $1", [sheetId]);
      return { status: 'failed', reason: 'No recipient email set (and no default configured in Settings)' };
    }

    const pdfBuffer = await generateSheetPdf(sheet, settings);

    await sendSheetEmail({
      to,
      cc: settings?.cc_emails || undefined,
      sheetNo: sheet.sheet_no,
      partyName: sheet.party_name,
      pdfBuffer,
    });

    await pool.query("UPDATE sheets SET email_status = 'sent' WHERE id = $1", [sheetId]);
    return { status: 'sent', to };
  } catch (err) {
    console.error(`Email dispatch failed for sheet ${sheetId}:`, err.message);
    await pool.query("UPDATE sheets SET email_status = 'failed' WHERE id = $1", [sheetId]);
    return { status: 'failed', reason: err.message };
  }
}

module.exports = router;
