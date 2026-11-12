import api from './api';
import { authHeaders } from './authApi';

export async function fetchQrPlans() {
  const res = await api.get('/qr/plans');
  return res.data;
}

// Pesanan untuk satu QR: design berisi link, warna, dan logo. qrId dipakai saat memperpanjang QR yang sudah ada.
export async function createQrOrder({ plan, name, email, whatsapp, design, qrId }) {
  const res = await api.post('/qr/orders', { plan, name, email, whatsapp, design, qrId });
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

// Pengaturan metode pembayaran (super admin).
export async function adminFetchPaymentSettings() {
  const res = await api.get('/admin/settings/payment', { headers: authHeaders() });
  return res.data.settings;
}

export async function adminSavePaymentSettings(settings) {
  const res = await api.put('/admin/settings/payment', settings, { headers: authHeaders() });
  return res.data.settings;
}
