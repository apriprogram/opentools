import api from './api';

// Sesi disimpan di localStorage per browser. Token selalu diperiksa ulang ke server lewat /auth/me.
const SESSION_KEY = 'ot_session';

export function getStoredSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
  } catch {
    return null;
  }
}

export function storeSession(session) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    /* penyimpanan diblokir: sesi hanya berlaku selama tab terbuka */
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    /* abaikan */
  }
}

export function authHeaders() {
  const session = getStoredSession();
  return session?.token ? { Authorization: `Bearer ${session.token}` } : {};
}

export async function registerAccount({ name, email, password, whatsapp }) {
  const res = await api.post('/auth/register', { name, email, password, whatsapp });
  return res.data;
}

export async function loginAccount({ login, password }) {
  const res = await api.post('/auth/login', { login, password });
  return res.data;
}

export async function logoutAccount() {
  await api.post('/auth/logout', {}, { headers: authHeaders() }).catch(() => {});
}

export async function fetchMe() {
  const res = await api.get('/auth/me', { headers: authHeaders() });
  return res.data.user;
}

export async function fetchMyQr() {
  const res = await api.get('/me/qr', { headers: authHeaders() });
  return res.data.qr;
}

export async function saveMyQr({ link, fg, bg, logo }) {
  const res = await api.post('/me/qr', { link, fg, bg, logo }, { headers: authHeaders() });
  return res.data.qr;
}

export async function deleteMyQr(id) {
  await api.delete(`/me/qr/${encodeURIComponent(id)}`, { headers: authHeaders() });
}

export async function fetchMyOrders() {
  const res = await api.get('/me/orders', { headers: authHeaders() });
  return res.data.orders;
}

export async function fetchMyLicenses() {
  const res = await api.get('/me/licenses', { headers: authHeaders() });
  return res.data.licenses;
}

// Bukti transfer milik akun sendiri (gambar, bukan JSON).
export async function fetchMyProof(code) {
  const res = await api.get(`/me/orders/${encodeURIComponent(code)}/proof`, {
    headers: authHeaders(),
    responseType: 'blob',
  });
  return res.data;
}

// Nota pesanan milik akun sendiri: HTML untuk dilihat, PDF untuk diunduh.
export async function fetchMyNota(code) {
  const res = await api.get(`/me/orders/${encodeURIComponent(code)}/nota`, {
    headers: authHeaders(),
    responseType: 'blob',
  });
  return res.data;
}

export async function fetchMyNotaPdf(code) {
  const res = await api.get(`/me/orders/${encodeURIComponent(code)}/nota.pdf`, {
    headers: authHeaders(),
    responseType: 'blob',
  });
  return res.data;
}

// Simpan atau ubah nomor WhatsApp akun.
export async function updateMyWhatsapp(whatsapp) {
  const res = await api.put('/me/whatsapp', { whatsapp }, { headers: authHeaders() });
  return res.data.user;
}
