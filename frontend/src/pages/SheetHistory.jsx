import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';

export default function SheetHistory() {
  const [sheets, setSheets] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async (q) => {
    setLoading(true);
    try {
      setSheets(await api.listSheets(q));
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
      <h1>Sheet History</h1>
      <p className="subtitle">All submitted calibration records, newest first.</p>

      <form className="search-row" onSubmit={onSearch}>
        <input
          placeholder="Search sheet / party / SRF"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="submit" className="btn-secondary">Search</button>
      </form>

      <div className="card">
        {loading ? (
          <p className="empty-cell">Loading…</p>
        ) : sheets.length === 0 ? (
          <p className="empty-cell">No sheets found. Submit a calibration sheet to see it here.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Sheet No.</th><th>Party</th><th>SRF No.</th><th>Location</th><th>Email</th><th>Date</th>
              </tr>
            </thead>
            <tbody>
              {sheets.map((s) => (
                <tr key={s.id}>
                  <td><Link to={`/history/${s.id}`}>{s.sheet_no}</Link></td>
                  <td>{s.party_name || '—'}</td>
                  <td>{s.srf_no || '—'}</td>
                  <td>{s.location || '—'}</td>
                  <td><span className={`status-pill status-${s.email_status}`}>{s.email_status}</span></td>
                  <td>{new Date(s.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
