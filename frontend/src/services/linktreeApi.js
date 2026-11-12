import api from './api';
import { authHeaders } from './authApi';

// Akun: daftar, buat, ambil, simpan, dan hapus Linktree milik pengguna yang masuk.
export async function fetchLinktrees() {
  const res = await api.get('/linktree', { headers: authHeaders() });
  return res.data.linktrees;
}

export async function createLinktree({ title, slug }) {
  const res = await api.post('/linktree', { title, slug }, { headers: authHeaders() });
  return res.data.linktree;
}

export async function fetchLinktree(id) {
  const res = await api.get(`/linktree/${encodeURIComponent(id)}`, { headers: authHeaders() });
  return res.data.linktree;
}

export async function saveLinktree(id, body) {
  const res = await api.put(`/linktree/${encodeURIComponent(id)}`, body, { headers: authHeaders() });
  return res.data.linktree;
}

export async function deleteLinktree(id) {
  await api.delete(`/linktree/${encodeURIComponent(id)}`, { headers: authHeaders() });
}

// Super admin: semua Linktree dari semua akun (hanya baca).
export async function adminFetchLinktrees() {
  const res = await api.get('/admin/linktrees', { headers: authHeaders() });
  return res.data.linktrees;
}

export async function adminFetchLinktree(id) {
  const res = await api.get(`/admin/linktrees/${encodeURIComponent(id)}`, { headers: authHeaders() });
  return res.data.linktree;
}

// Publik: halaman Linktree dan pencatatan kunjungan.
export async function fetchPublicLinktree(slug) {
  const res = await api.get(`/linktree/public/${encodeURIComponent(slug)}`);
  return res.data.linktree;
}

export async function recordLinktreeView(slug) {
  await api.post(`/linktree/public/${encodeURIComponent(slug)}/view`);
}
