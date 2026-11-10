import api from './api';

export async function fetchQrPlans() {
  const res = await api.get('/qr/plans');
  return res.data;
}

export async function createQrOrder({ plan, name, email, whatsapp }) {
  const res = await api.post('/qr/orders', { plan, name, email, whatsapp });
  return res.data;
}

export async function lookupQrOrder({ code, email }) {
  const res = await api.post('/qr/orders/lookup', { code, email });
  return res.data;
}

export async function verifyQrLicense(key) {
  const res = await api.post('/qr/license/verify', { key });
  return res.data;
}

// Admin masuk dengan username + password. Hasilnya berupa token sesi (12 jam).
export async function adminLogin({ username, password }) {
  const res = await api.post('/admin/login', { username, password });
  return res.data;
}

export async function adminFetchQrOrders(adminKey, status) {
  const res = await api.get('/admin/qr/orders', {
    params: status && status !== 'all' ? { status } : {},
    headers: { 'x-admin-key': adminKey },
  });
  return res.data;
}

export async function adminConfirmQrOrder(adminKey, code) {
  const res = await api.post(`/admin/qr/orders/${encodeURIComponent(code)}/confirm`, {}, {
    headers: { 'x-admin-key': adminKey },
  });
  return res.data;
}

export async function adminCancelQrOrder(adminKey, code) {
  const res = await api.post(`/admin/qr/orders/${encodeURIComponent(code)}/cancel`, {}, {
    headers: { 'x-admin-key': adminKey },
  });
  return res.data;
}

// Pembeli mengunggah bukti transfer. Server langsung menganalisa dan bisa mengaktifkan lisensi.
export async function uploadQrProof({ code, email, file }) {
  const form = new FormData();
  form.append('email', email);
  form.append('proof', file);
  const res = await api.post(`/qr/orders/${encodeURIComponent(code)}/proof`, form);
  return res.data;
}

export async function adminFetchQrProof(adminKey, code) {
  const res = await api.get(`/admin/qr/orders/${encodeURIComponent(code)}/proof`, {
    headers: { 'x-admin-key': adminKey },
    responseType: 'blob',
  });
  return res.data;
}

// Lisensi disimpan di localStorage hanya sebagai kunci; validitasnya selalu dicek ulang ke server.
const LICENSE_KEY = 'ot_qr_license';

export function getStoredLicenseKey() {
  try {
    return localStorage.getItem(LICENSE_KEY) || '';
  } catch {
    return '';
  }
}

export function storeLicenseKey(key) {
  try {
    localStorage.setItem(LICENSE_KEY, key);
  } catch {
    /* penyimpanan diblokir: lisensi hanya aktif selama tab terbuka */
  }
}

export function clearStoredLicenseKey() {
  try {
    localStorage.removeItem(LICENSE_KEY);
  } catch {
    /* abaikan */
  }
}
