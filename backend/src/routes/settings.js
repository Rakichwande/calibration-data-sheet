const express = require('express');
const pool = require('../db/pool');

const router = express.Router();

// GET /api/settings
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM lab_settings WHERE id = 1');
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Failed to fetch settings:', err);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// PUT /api/settings
router.put('/', async (req, res) => {
  const {
    lab_name, lab_id_no, accreditation_no, phone,
    default_report_email, cc_emails, address, footer_note,
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE lab_settings SET
        lab_name = $1, lab_id_no = $2, accreditation_no = $3, phone = $4,
        default_report_email = $5, cc_emails = $6, address = $7, footer_note = $8,
        updated_at = now()
       WHERE id = 1
       RETURNING *`,
      [lab_name, lab_id_no, accreditation_no, phone, default_report_email, cc_emails, address, footer_note]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Failed to update settings:', err);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

module.exports = router;
