import { useEffect, useState } from 'react';
import { api } from '../api.js';

const STATUS_LABEL = {
  overdue: 'Overdue',
  due_soon: 'Due Soon',
  on_track: 'On Track',
  no_due_date: 'No Due Date',
};

export default function Instruments() {
  const [instruments, setInstruments] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async (q) => {
    setLoading(true);
    try {
      setInstruments(await api.listInstruments(q));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onSearch = (e) => {
    e.preventDefault();
    load(search);
  };

  return (
    <div className="page">
      <h1>Instrument Directory</h1>
      <p className="subtitle">Every unique instrument calibrated in the lab · {instruments.length} registered.</p>

      <form className="search-row" onSubmit={onSearch}>
        <input
          placeholder="Search instrument, make, ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="submit" className="btn-secondary">Search</button>
      </form>

      <div className="card">
        {loading ? (
          <p className="empty-cell">Loading…</p>
        ) : instruments.length === 0 ? (
          <p className="empty-cell">No instruments found.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Instrument</th><th>Make/Model</th><th>I.D. No.</th><th>Sr. No.</th>
                <th>Type</th><th>Range</th><th>Last Cal.</th><th>Next Due</th><th>Cals</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {instruments.map((inst) => (
                <tr key={inst.instrument_key}>
                  <td>{inst.instrument_name || '—'}</td>
                  <td>{inst.make_model || '—'}</td>
                  <td>{inst.id_no || '—'}</td>
                  <td>{inst.sr_no || '—'}</td>
                  <td>{inst.type || '—'}</td>
                  <td>{inst.range || '—'}</td>
                  <td>{inst.last_cal_date?.slice(0, 10) || '—'}</td>
                  <td>{inst.next_due_date?.slice(0, 10) || '—'}</td>
                  <td>{inst.cal_count}</td>
                  <td><span className={`status-pill status-${inst.status}`}>{STATUS_LABEL[inst.status]}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
