const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }

  return res.json();
}

export const api = {
  createSheet: (payload) => request('/api/sheets', { method: 'POST', body: JSON.stringify(payload) }),
  listSheets: (search) => request(`/api/sheets${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  getSheet: (id) => request(`/api/sheets/${id}`),
  resendSheetEmail: (id) => request(`/api/sheets/${id}/resend`, { method: 'POST' }),
  listInstruments: (search) => request(`/api/instruments${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  getDueDates: () => request('/api/due-dates'),
  getSettings: () => request('/api/settings'),
  updateSettings: (payload) => request('/api/settings', { method: 'PUT', body: JSON.stringify(payload) }),
};
