import api from './api';
import { authHeaders } from './authApi';

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

// Pembeli mengunggah bukti transfer. Server langsung menganalisa dan bisa mengaktifkan lisensi.
export async function uploadQrProof({ code, email, file }) {
  const form = new FormData();
  form.append('email', email);
  form.append('proof', file);
  const res = await api.post(`/qr/orders/${encodeURIComponent(code)}/proof`, form);
  return res.data;
}

// Panel super admin. Akses memakai sesi akun (header Authorization dari sesi tersimpan).
export async function adminFetchQrOrders(status) {
  const res = await api.get('/admin/qr/orders', {
    params: status && status !== 'all' ? { status } : {},
    headers: authHeaders(),
  });
  return res.data;
}

export async function adminConfirmQrOrder(code) {
  const res = await api.post(`/admin/qr/orders/${encodeURIComponent(code)}/confirm`, {}, { headers: authHeaders() });
  return res.data;
}

export async function adminCancelQrOrder(code) {
  const res = await api.post(`/admin/qr/orders/${encodeURIComponent(code)}/cancel`, {}, { headers: authHeaders() });
  return res.data;
}

export async function adminFetchQrProof(code) {
  const res = await api.get(`/admin/qr/orders/${encodeURIComponent(code)}/proof`, {
    headers: authHeaders(),
    responseType: 'blob',
  });
  return res.data;
}

// Nota pesanan (HTML untuk dilihat dan dicetak, atau PDF untuk diunduh)
export async function adminFetchQrNota(code) {
  const res = await api.get(`/admin/qr/orders/${encodeURIComponent(code)}/nota`, {
    headers: authHeaders(),
    responseType: 'blob',
  });
  return res.data;
}

export async function adminFetchQrNotaPdf(code) {
  const res = await api.get(`/admin/qr/orders/${encodeURIComponent(code)}/nota.pdf`, {
    headers: authHeaders(),
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

// Admin: nonaktifkan atau aktifkan lisensi pesanan lunas.
export async function adminSetQrLicense(code, active) {
  const res = await api.post(`/admin/qr/orders/${encodeURIComponent(code)}/license`, { active }, { headers: authHeaders() });
  return res.data;
}

// Admin: hapus pesanan beserta lisensi dan bukti transfernya.
export async function adminDeleteQrOrder(code) {
  const res = await api.delete(`/admin/qr/orders/${encodeURIComponent(code)}`, { headers: authHeaders() });
  return res.data;
}
