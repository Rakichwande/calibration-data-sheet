import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api.js';

export default function SheetDetail() {
  const { id } = useParams();
  const [sheet, setSheet] = useState(null);
  const [resending, setResending] = useState(false);
  const [resendResult, setResendResult] = useState(null);

  useEffect(() => {
    api.getSheet(id).then(setSheet);
  }, [id]);

  const handleResend = async () => {
    setResending(true);
    setResendResult(null);
    try {
      const res = await api.resendSheetEmail(id);
      setResendResult(res.email);
      const refreshed = await api.getSheet(id);
      setSheet(refreshed);
    } catch (err) {
      setResendResult({ status: 'failed', reason: err.message });
    } finally {
      setResending(false);
    }
  };

  if (!sheet) return <div className="page"><p>Loading…</p></div>;

  return (
    <div className="page">
      <Link to="/history" className="back-link">← Back to Sheet History</Link>
      <h1>Sheet {sheet.sheet_no}</h1>
      <span className={`status-pill status-${sheet.email_status}`}>{sheet.email_status}</span>

      <section className="card">
        <h2>Header</h2>
        <dl className="detail-list">
          <dt>Party Name</dt><dd>{sheet.party_name || '—'}</dd>
          <dt>SRF No.</dt><dd>{sheet.srf_no || '—'}</dd>
          <dt>Description</dt><dd>{sheet.description_of_item || '—'}</dd>
          <dt>Item Received Date</dt><dd>{sheet.item_received_date?.slice(0, 10) || '—'}</dd>
          <dt>Condition on Received</dt><dd>{sheet.condition_on_received || '—'}</dd>
          <dt>Location</dt><dd>{sheet.location || '—'}</dd>
          <dt>Calibrated By</dt><dd>{sheet.calibrated_by || '—'}</dd>
          <dt>Remark</dt><dd>{sheet.remark || '—'}</dd>
        </dl>
        <button className="btn-secondary" onClick={handleResend} disabled={resending}>
          {resending ? 'Resending…' : 'Resend Email'}
        </button>
        {resendResult && (
          <p className={resendResult.status === 'sent' ? 'success-text' : 'warning-text'}>
            {resendResult.status === 'sent' ? `Sent to ${resendResult.to}` : `Failed: ${resendResult.reason}`}
          </p>
        )}
      </section>

      {sheet.job_blocks.map((block, i) => (
        <section className="card" key={block.id}>
          <h2>Job {i + 1}: {block.instrument_name}</h2>
          <dl className="detail-list">
            <dt>I.D. No.</dt><dd>{block.id_no || '—'}</dd>
            <dt>Make/Model</dt><dd>{block.make_model || '—'}</dd>
            <dt>Sr. No.</dt><dd>{block.sr_no || '—'}</dd>
            <dt>Cal. Date</dt><dd>{block.cal_date?.slice(0, 10) || '—'}</dd>
            <dt>Due Date</dt><dd>{block.due_date?.slice(0, 10) || '—'}</dd>
            <dt>Standard Used</dt><dd>{block.standard_used || '—'}</dd>
          </dl>

          {block.measurement_rows.length > 0 && (
            <table>
              <thead>
                <tr>
                  <th>Range</th><th>Cal Pt</th><th>Set</th>
                  <th>X1</th><th>X2</th><th>X3</th><th>X4</th><th>X5</th><th>X6</th>
                  <th>Avg</th><th>Error</th>
                </tr>
              </thead>
              <tbody>
                {block.measurement_rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.parameter_range || '—'}</td>
                    <td>{row.cal_point || '—'}</td>
                    <td>{row.set_value_uuc ?? '—'}</td>
                    <td>{row.x1 ?? '—'}</td><td>{row.x2 ?? '—'}</td><td>{row.x3 ?? '—'}</td>
                    <td>{row.x4 ?? '—'}</td><td>{row.x5 ?? '—'}</td><td>{row.x6 ?? '—'}</td>
                    <td>{row.average != null ? Number(row.average).toFixed(3) : '—'}</td>
                    <td>{row.error != null ? Number(row.error).toFixed(3) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      ))}
    </div>
  );
}
