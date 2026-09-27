import { useEffect, useState } from 'react';
import { api } from '../api.js';

const BUCKETS = [
  { key: 'overdue', label: 'Overdue', color: 'red' },
  { key: 'due_soon', label: 'Due ≤ 7 Days', color: 'orange' },
  { key: 'on_track', label: 'On Track', color: 'green' },
  { key: 'no_due_date', label: 'No Due Date', color: 'gray' },
];

export default function DueDates() {
  const [data, setData] = useState(null);
  const [activeBucket, setActiveBucket] = useState('overdue');

  useEffect(() => {
    api.getDueDates().then(setData);
  }, []);

  if (!data) return <div className="page"><p>Loading…</p></div>;

  const activeList = data.buckets[activeBucket] || [];

  return (
    <div className="page">
      <h1>Due Date Tracker</h1>
      <p className="subtitle">Instruments approaching or past their calibration due date.</p>

      <div className="stat-grid">
        {BUCKETS.map((b) => (
          <button
            key={b.key}
            className={`stat-card stat-${b.color}` + (activeBucket === b.key ? ' active' : '')}
            onClick={() => setActiveBucket(b.key)}
          >
            <span className="stat-label"><span className={`dot dot-${b.color}`} /> {b.label}</span>
            <span className="stat-value">{data.counts[b.key]}</span>
          </button>
        ))}
      </div>

      <div className="card">
        {activeList.length === 0 ? (
          <p className="empty-cell">No instruments match this filter.</p>
        ) : (
          <table>
            <thead><tr><th>Instrument</th><th>Next Due</th></tr></thead>
            <tbody>
              {activeList.map((inst) => (
                <tr key={inst.instrument_key}>
                  <td>{inst.instrument_name || '—'}</td>
                  <td>{inst.next_due_date?.slice(0, 10) || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
