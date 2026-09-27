// Mirrors the server-side calc in the backend's lib/measurements.js so the
// user sees Average/Error update live, before submit. The backend recomputes
// these on save regardless — this is a preview only, not the source of truth.
function computePreview(row) {
  const readings = ['x1', 'x2', 'x3', 'x4', 'x5', 'x6']
    .map((k) => row[k])
    .filter((v) => v !== '' && v !== null && v !== undefined);

  if (readings.length === 0) return { average: null, error: null };

  const nums = readings.map(Number);
  const average = nums.reduce((sum, n) => sum + n, 0) / nums.length;
  const setValue = row.set_value_uuc !== '' && row.set_value_uuc != null ? Number(row.set_value_uuc) : null;
  const error = setValue !== null ? average - setValue : null;

  return { average, error };
}

const NUMERIC_FIELDS = ['set_value_uuc', 'x1', 'x2', 'x3', 'x4', 'x5', 'x6'];

export default function MeasurementTable({ rows, onChange }) {
  const updateRow = (index, field, value) => {
    const next = rows.slice();
    next[index] = { ...next[index], [field]: value };
    onChange(next);
  };

  const addRow = () => {
    onChange([
      ...rows,
      { parameter_range: '', cal_point: '', set_value_uuc: '', x1: '', x2: '', x3: '', x4: '', x5: '', x6: '' },
    ]);
  };

  const removeRow = (index) => {
    onChange(rows.filter((_, i) => i !== index));
  };

  return (
    <div className="measurement-table">
      <table>
        <thead>
          <tr>
            <th>Parameter Range</th>
            <th>Cal. Point</th>
            <th>Set Value</th>
            <th>X1</th><th>X2</th><th>X3</th><th>X4</th><th>X5</th><th>X6</th>
            <th>Average</th>
            <th>Error</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td colSpan={12} className="empty-cell">No measurement rows. Click "Add Row" to begin.</td></tr>
          )}
          {rows.map((row, i) => {
            const { average, error } = computePreview(row);
            return (
              <tr key={i}>
                <td><input value={row.parameter_range} onChange={(e) => updateRow(i, 'parameter_range', e.target.value)} /></td>
                <td><input value={row.cal_point} onChange={(e) => updateRow(i, 'cal_point', e.target.value)} /></td>
                {NUMERIC_FIELDS.map((field) => (
                  <td key={field}>
                    <input
                      type="number"
                      step="any"
                      value={row[field]}
                      onChange={(e) => updateRow(i, field, e.target.value)}
                    />
                  </td>
                ))}
                <td className="computed">{average !== null ? average.toFixed(3) : '—'}</td>
                <td className="computed">{error !== null ? error.toFixed(3) : '—'}</td>
                <td><button type="button" className="link-danger" onClick={() => removeRow(i)}>✕</button></td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <button type="button" className="btn-secondary" onClick={addRow}>+ Add Row</button>
    </div>
  );
}
