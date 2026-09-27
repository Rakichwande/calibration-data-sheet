import { useState } from 'react';
import { api } from '../api.js';
import JobBlockForm from '../components/JobBlockForm.jsx';

const emptyHeader = {
  sheet_no: '', party_name: '', description_of_item: '', srf_no: '',
  item_received_date: '', condition_on_received: '', location: 'In Lab',
  calibrated_by: '', remark: '', recipient_email: '',
};

const emptyBlock = () => ({
  job_no: '', instrument_name: '', id_no: '', make_model: '', sr_no: '', type: '',
  cal_date: '', due_date: '', range: '', resolution: '', accuracy: '', location: '',
  temp_c: '', rh_percent: '', air_pressure_mbar: '', standard_used: '', detail: '',
  measurement_rows: [],
});

export default function CreateSheet() {
  const [header, setHeader] = useState(emptyHeader);
  const [jobBlocks, setJobBlocks] = useState([emptyBlock()]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // { id, email } or { error }

  const setHeaderField = (field, value) => setHeader((h) => ({ ...h, [field]: value }));

  const updateBlock = (i, next) => {
    const copy = jobBlocks.slice();
    copy[i] = next;
    setJobBlocks(copy);
  };

  const addBlock = () => setJobBlocks((b) => [...b, emptyBlock()]);
  const removeBlock = (i) => setJobBlocks((b) => b.filter((_, idx) => idx !== i));

  const validationIssues = [];
  if (!header.sheet_no) validationIssues.push('Sheet No. is required');
  if (jobBlocks.length === 0) validationIssues.push('At least one job block is required');
  jobBlocks.forEach((b, i) => {
    if (!b.instrument_name) validationIssues.push(`Job ${i + 1}: Name of Instrument is required`);
  });

  const handleSubmit = async () => {
    setSubmitting(true);
    setResult(null);
    try {
      const res = await api.createSheet({ header, job_blocks: jobBlocks });
      setResult(res);
      if (!res.email || res.email.status !== 'failed') {
        setHeader(emptyHeader);
        setJobBlocks([emptyBlock()]);
      }
    } catch (err) {
      setResult({ error: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page">
      <h1>Create Calibration Data Sheet</h1>
      <p className="subtitle">Fill the header, add job blocks, then submit &amp; dispatch.</p>

      <section className="card">
        <h2>Sheet Header</h2>
        <div className="field-grid">
          <label>Sheet No.
            <input value={header.sheet_no} onChange={(e) => setHeaderField('sheet_no', e.target.value)} placeholder="CS-2026-001" />
          </label>
          <label>Party Name
            <input value={header.party_name} onChange={(e) => setHeaderField('party_name', e.target.value)} />
          </label>
          <label>Description of Item
            <input value={header.description_of_item} onChange={(e) => setHeaderField('description_of_item', e.target.value)} />
          </label>
          <label>SRF No.
            <input value={header.srf_no} onChange={(e) => setHeaderField('srf_no', e.target.value)} />
          </label>
          <label>Item Received Date
            <input type="date" value={header.item_received_date} onChange={(e) => setHeaderField('item_received_date', e.target.value)} />
          </label>
          <label>Condition on Received
            <input value={header.condition_on_received} onChange={(e) => setHeaderField('condition_on_received', e.target.value)} />
          </label>
          <label>Location
            <select value={header.location} onChange={(e) => setHeaderField('location', e.target.value)}>
              <option>In Lab</option>
              <option>On Site</option>
            </select>
          </label>
          <label>Calibrated By
            <input value={header.calibrated_by} onChange={(e) => setHeaderField('calibrated_by', e.target.value)} />
          </label>
        </div>
        <label className="full-width">Remark
          <textarea value={header.remark} onChange={(e) => setHeaderField('remark', e.target.value)} />
        </label>
      </section>

      <section className="card">
        <div className="card-header-row">
          <h2>Job Blocks ({jobBlocks.length})</h2>
          <button type="button" className="btn-secondary" onClick={addBlock}>+ Add Job Block</button>
        </div>
        {jobBlocks.map((block, i) => (
          <JobBlockForm
            key={i}
            block={block}
            index={i}
            onChange={(next) => updateBlock(i, next)}
            onRemove={() => removeBlock(i)}
          />
        ))}
      </section>

      <section className="card submit-bar">
        <label className="full-width">Send PDF Summary To
          <input
            value={header.recipient_email}
            onChange={(e) => setHeaderField('recipient_email', e.target.value)}
            placeholder="recipient@example.com (blank = lab default)"
          />
        </label>
        <div className="submit-row">
          {validationIssues.length > 0 && (
            <span className="validation-flag">{validationIssues.length} validation issue{validationIssues.length > 1 ? 's' : ''}</span>
          )}
          <button
            type="button"
            className="btn-primary"
            disabled={submitting || validationIssues.length > 0}
            onClick={handleSubmit}
          >
            {submitting ? 'Submitting…' : 'Submit & Dispatch Sheet'}
          </button>
        </div>
        {result?.error && <p className="error-text">Failed to submit: {result.error}</p>}
        {result?.id && result.email?.status === 'sent' && (
          <p className="success-text">Sheet #{result.id} saved — email sent to {result.email.to}.</p>
        )}
        {result?.id && result.email?.status === 'failed' && (
          <p className="warning-text">Sheet #{result.id} saved, but the email failed: {result.email.reason}</p>
        )}
      </section>
    </div>
  );
}
