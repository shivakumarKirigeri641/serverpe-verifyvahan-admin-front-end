/**
 * The single door to the GaadiPe admin API.
 *
 * Every request carries the bearer token; a 401 clears the session so an
 * expired token can never leave the panel showing data it's no longer entitled
 * to. Token lives in sessionStorage (dies with the tab) because this panel shows
 * customers' numbers and financial records.
 */
const KEY = 'vv.admin.token';
export const API_BASE = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '');

export const getToken = () => sessionStorage.getItem(KEY);
export const setToken = (t) => sessionStorage.setItem(KEY, t);
export const clearToken = () => sessionStorage.removeItem(KEY);

let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

/* The Toaster registers here so every write (POST/PUT/PATCH/DELETE) auto-shows a
   success or error toast — no page has to wire it up. */
let onToast = null;
export const setToastHandler = (fn) => { onToast = fn; };

async function request(path, { method = 'GET', body } = {}) {
  const headers = { Accept: 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';

  let res;
  try {
    res = await fetch(`${API_BASE}/admin/api${path}`, {
      method, headers, body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Cannot reach the server. Is the back-end running on port 5007?');
  }

  if (res.status === 401) { clearToken(); onUnauthorized(); throw new Error('Session expired. Please sign in again.'); }

  let json = null;
  try { json = await res.json(); } catch { /* non-JSON */ }
  const isWrite = method !== 'GET';
  if (!res.ok || (json && json.success === false)) {
    const msg = (json && json.message) || `Request failed (${res.status})`;
    if (isWrite) onToast?.({ message: msg, type: 'error' });
    throw new Error(msg);
  }
  if (isWrite) onToast?.({ message: (json && json.message) || 'Saved', type: 'success' });
  return json;
}

const qs = (o = {}) => {
  const p = new URLSearchParams();
  Object.entries(o).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') p.set(k, v); });
  const s = p.toString();
  return s ? `?${s}` : '';
};

export const api = {
  login: (pin) => request('/login', { method: 'POST', body: { pin } }),
  me: () => request('/me'),
  dashboard: () => request('/dashboard'),
  payments: (o) => request(`/payments${qs(o)}`),
  tickets: (o) => request(`/tickets${qs(o)}`),
  setTicketStatus: (id, status) => request(`/tickets/${id}`, { method: 'PATCH', body: { status } }),
  users: (o) => request(`/users${qs(o)}`),
  user: (id) => request(`/users/${id}`),
  reports: (o) => request(`/reports${qs(o)}`),
  vehicles: (o) => request(`/vehicles${qs(o)}`),
  vehicle: (id) => request(`/vehicles/${id}`),
  inbox: () => request('/inbox'),
  thread: (waId) => request(`/inbox/${waId}`),
  gst: () => request('/gst'),
  visitors: () => request('/visitors'),
  ulip: () => request('/ulip'),
  money: () => request('/money'),
  settings: () => request('/settings'),
  setUlipRates: (rates) => request('/settings/ulip-rates', { method: 'PUT', body: rates }),
  setPlans: (plans) => request('/settings/plans', { method: 'PUT', body: plans }),
  planHistory: () => request('/settings/plan-history'),
  setMaxVehicles: (max) => request('/settings/max-vehicles', { method: 'PUT', body: { max } }),
  setContent: (content) => request('/settings/content', { method: 'PUT', body: content }),
  broadcast: (message, numbers) => request('/broadcast', { method: 'POST', body: { message, numbers } }),
  resetTestData: (confirm) => request('/maintenance/reset-test-data', { method: 'POST', body: { confirm } }),
};

/* The PDF endpoint needs the bearer token, so a plain link won't do — fetch it
   with auth, then open the blob in a new tab. */
export async function openReportPdf(id) {
  const res = await fetch(`${API_BASE}/admin/api/reports/${id}/pdf`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (res.status === 401) { clearToken(); onUnauthorized(); throw new Error('Session expired.'); }
  if (!res.ok) throw new Error('Could not load the report PDF.');
  const url = URL.createObjectURL(await res.blob());
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

export const inr = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const dt = (s) => (s ? new Date(s).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—');
export const day = (s) => (s ? new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—');
