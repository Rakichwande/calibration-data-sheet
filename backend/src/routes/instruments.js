const express = require('express');
const pool = require('../db/pool');
const { computeStatus } = require('../lib/status');

const router = express.Router();

// GET /api/instruments?search=...
// Groups job_blocks by instrument identity (id_no, falling back to sr_no) so the
// same physical instrument calibrated across multiple sheets shows as one row.
// NOTE: if both id_no and sr_no are ever left blank for an instrument, it can't be
// deduplicated and will show as its own row per sheet — worth flagging in the UI.
router.get('/', async (req, res) => {
  const { search } = req.query;

  try {
    const result = await pool.query(`
      SELECT
        COALESCE(NULLIF(id_no, ''), NULLIF(sr_no, ''), 'unknown-' || id::text) AS instrument_key,
        (ARRAY_AGG(instrument_name ORDER BY cal_date DESC NULLS LAST))[1]      AS instrument_name,
        (ARRAY_AGG(make_model ORDER BY cal_date DESC NULLS LAST))[1]           AS make_model,
        (ARRAY_AGG(id_no ORDER BY cal_date DESC NULLS LAST))[1]                AS id_no,
        (ARRAY_AGG(sr_no ORDER BY cal_date DESC NULLS LAST))[1]                AS sr_no,
        (ARRAY_AGG(type ORDER BY cal_date DESC NULLS LAST))[1]                 AS type,
        (ARRAY_AGG(range ORDER BY cal_date DESC NULLS LAST))[1]                AS range,
        MAX(cal_date)                                                          AS last_cal_date,
        (ARRAY_AGG(due_date ORDER BY cal_date DESC NULLS LAST))[1]             AS next_due_date,
        COUNT(*)                                                               AS cal_count
      FROM job_blocks
      GROUP BY instrument_key
      ORDER BY instrument_name
    `);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const withStatus = result.rows
      .map((row) => ({
        ...row,
        status: computeStatus(row.next_due_date, today),
      }))
      .filter((row) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          row.instrument_name?.toLowerCase().includes(q) ||
          row.make_model?.toLowerCase().includes(q) ||
          row.id_no?.toLowerCase().includes(q)
        );
      });

    res.json(withStatus);
  } catch (err) {
    console.error('Failed to fetch instruments:', err);
    res.status(500).json({ error: 'Failed to fetch instruments' });
  }
});

module.exports = router;
