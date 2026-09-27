const pool = require('../db/pool');

// Used by both GET /api/sheets/:id and the post-submit PDF/email dispatch,
// so the two never drift out of sync on what counts as "the full sheet".
async function getFullSheet(sheetId) {
  const sheetResult = await pool.query('SELECT * FROM sheets WHERE id = $1', [sheetId]);
  if (sheetResult.rows.length === 0) return null;

  const blocksResult = await pool.query(
    'SELECT * FROM job_blocks WHERE sheet_id = $1 ORDER BY id', [sheetId]
  );
  const blockIds = blocksResult.rows.map((b) => b.id);

  let rowsByBlock = {};
  if (blockIds.length > 0) {
    const rowsResult = await pool.query(
      'SELECT * FROM measurement_rows WHERE job_block_id = ANY($1) ORDER BY row_order',
      [blockIds]
    );
    rowsByBlock = rowsResult.rows.reduce((acc, row) => {
      (acc[row.job_block_id] ||= []).push(row);
      return acc;
    }, {});
  }

  const job_blocks = blocksResult.rows.map((b) => ({
    ...b,
    measurement_rows: rowsByBlock[b.id] || [],
  }));

  return { ...sheetResult.rows[0], job_blocks };
}

module.exports = { getFullSheet };
