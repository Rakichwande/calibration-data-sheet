// Computes Average and Error for one measurement row.
// Average = mean of whichever of X1-X6 are provided (blanks ignored).
// Error = Average - Set Value on UUC.
//
// NOTE: the original paper form doesn't state the Error formula explicitly.
// This is the standard convention (measured vs. reference), but confirm it
// against your lab's actual practice before relying on it for real reports.
function computeAverageAndError(row) {
  const readings = [row.x1, row.x2, row.x3, row.x4, row.x5, row.x6]
    .filter((v) => v !== null && v !== undefined && v !== '');

  if (readings.length === 0) {
    return { average: null, error: null };
  }

  const nums = readings.map(Number);
  const average = nums.reduce((sum, n) => sum + n, 0) / nums.length;

  const setValue = row.set_value_uuc !== null && row.set_value_uuc !== undefined && row.set_value_uuc !== ''
    ? Number(row.set_value_uuc)
    : null;

  const error = setValue !== null ? average - setValue : null;

  return { average, error };
}

module.exports = { computeAverageAndError };
