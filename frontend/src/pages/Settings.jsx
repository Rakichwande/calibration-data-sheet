import { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function Settings() {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.getSettings().then(setSettings);
  }, []);

  const setField = (field, value) => {
    setSettings((s) => ({ ...s, [field]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await api.updateSettings(settings);
      setSettings(updated);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  if (!settings) return <div className="page"><p>Loading…</p></div>;

  return (
    <div className="page">
      <h1>Settings</h1>
      <p className="subtitle">Global laboratory identification and default email reporting configuration.</p>

      <section className="card">
        <h2>Laboratory Identification</h2>
        <div className="field-grid">
          <label>Laboratory Name
            <input value={settings.lab_name || ''} onChange={(e) => setField('lab_name', e.target.value)} placeholder="e.g. MetroLab Calibration Centre" />
          </label>
          <label>Lab Identification No.
            <input value={settings.lab_id_no || ''} onChange={(e) => setField('lab_id_no', e.target.value)} placeholder="e.g. ML-001" />
          </label>
          <label>Accreditation No.
            <input value={settings.accreditation_no || ''} onChange={(e) => setField('accreditation_no', e.target.value)} placeholder="e.g. ISO/IEC 17025 · NABL-1234" />
          </label>
          <label>Phone
            <input value={settings.phone || ''} onChange={(e) => setField('phone', e.target.value)} />
          </label>
          <label>Default Report Email
            <input value={settings.default_report_email || ''} onChange={(e) => setField('default_report_email', e.target.value)} placeholder="reports@yourlab.example" />
          </label>
        </div>
      </section>

      <section className="card">
        <h2>Email Reporting</h2>
        <label className="full-width">CC Emails (comma-separated)
          <input value={settings.cc_emails || ''} onChange={(e) => setField('cc_emails', e.target.value)} placeholder="qa@yourlab.example, lab@yourlab.example" />
        </label>
        <label className="full-width">Laboratory Address
          <textarea value={settings.address || ''} onChange={(e) => setField('address', e.target.value)} />
        </label>
        <label className="full-width">Report Footer Note
          <textarea value={settings.footer_note || ''} onChange={(e) => setField('footer_note', e.target.value)} placeholder="Disclaimer printed on every report" />
        </label>
      </section>

      <button className="btn-primary" onClick={handleSave} disabled={saving}>
        {saving ? 'Saving…' : 'Save Settings'}
      </button>
      {saved && <p className="success-text">Settings saved.</p>}
    </div>
  );
}
