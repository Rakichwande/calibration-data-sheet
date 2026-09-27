import MeasurementTable from './MeasurementTable.jsx';

const TEXT_FIELDS = [
  ['job_no', 'Job No.'],
  ['instrument_name', 'Name of Instrument'],
  ['id_no', 'I.D. No.'],
  ['make_model', 'Make / Model'],
  ['sr_no', 'Sr. No.'],
  ['type', 'Type'],
  ['range', 'Range'],
  ['resolution', 'Resolution'],
  ['accuracy', 'Accuracy'],
  ['location', 'Location'],
  ['standard_used', 'Standard Used (Std.)'],
  ['detail', 'Detail'],
];

const DATE_FIELDS = [
  ['cal_date', 'Cal. Date'],
  ['due_date', 'Due Date'],
];

const ENV_FIELDS = [
  ['temp_c', 'Temp (°C)'],
  ['rh_percent', 'RH (%)'],
  ['air_pressure_mbar', 'Air Pressure (mbar)'],
];

export default function JobBlockForm({ block, index, onChange, onRemove }) {
  const setField = (field, value) => onChange({ ...block, [field]: value });

  return (
    <div className="job-block">
      <div className="job-block-header">
        <span className="job-block-num">{index + 1}</span>
        <strong>{block.instrument_name || 'New Instrument'}</strong>
        <button type="button" className="link-danger" onClick={onRemove}>Remove</button>
      </div>

      <div className="field-grid">
        {TEXT_FIELDS.map(([key, label]) => (
          <label key={key}>
            {label}
            <input value={block[key] || ''} onChange={(e) => setField(key, e.target.value)} />
          </label>
        ))}
        {DATE_FIELDS.map(([key, label]) => (
          <label key={key}>
            {label}
            <input type="date" value={block[key] || ''} onChange={(e) => setField(key, e.target.value)} />
          </label>
        ))}
      </div>

      <fieldset className="env-fieldset">
        <legend>Environmental Conditions</legend>
        <div className="field-grid">
          {ENV_FIELDS.map(([key, label]) => (
            <label key={key}>
              {label}
              <input type="number" step="any" value={block[key] || ''} onChange={(e) => setField(key, e.target.value)} />
            </label>
          ))}
        </div>
      </fieldset>

      <div className="measurement-section">
        <div className="section-label">Measurement Table</div>
        <MeasurementTable
          rows={block.measurement_rows || []}
          onChange={(rows) => setField('measurement_rows', rows)}
        />
      </div>
    </div>
  );
}
