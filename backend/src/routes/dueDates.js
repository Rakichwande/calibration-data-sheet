const express = require('express');
const pool = require('../db/pool');
const { computeStatus } = require('../lib/status');

const router = express.Router();

// GET /api/due-dates
// Same instrument grouping as /api/instruments, but shaped for the Due Date Tracker:
// bucket counts plus the list of instruments in each bucket.
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COALESCE(NULLIF(id_no, ''), NULLIF(sr_no, ''), 'unknown-' || id::text) AS instrument_key,
        (ARRAY_AGG(instrument_name ORDER BY cal_date DESC NULLS LAST))[1]      AS instrument_name,
        (ARRAY_AGG(due_date ORDER BY cal_date DESC NULLS LAST))[1]             AS next_due_date
      FROM job_blocks
      GROUP BY instrument_key
    `);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const buckets = { overdue: [], due_soon: [], on_track: [], no_due_date: [] };

    for (const row of result.rows) {
      const status = computeStatus(row.next_due_date, today);
      buckets[status].push(row);
    }

    res.json({
      counts: {
        overdue: buckets.overdue.length,
        due_soon: buckets.due_soon.length,
        on_track: buckets.on_track.length,
        no_due_date: buckets.no_due_date.length,
      },
      buckets,
    });
  } catch (err) {
    console.error('Failed to fetch due dates:', err);
    res.status(500).json({ error: 'Failed to fetch due dates' });
  }
});

module.exports = router;
