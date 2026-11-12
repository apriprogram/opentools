import api from './api';
import { authHeaders } from './authApi';

// Publik: daftar Twibbon, satu Twibbon, dan pencatatan dilihat serta dipakai.
export async function getCampaigns() {
  const res = await api.get('/twibbon/campaigns');
  return res.data.campaigns;
}

export async function getCampaignBySlug(slug) {
  const res = await api.get(`/twibbon/campaigns/${encodeURIComponent(slug)}`);
  return res.data.campaign;
}

export async function trackCampaignView(id) {
  const res = await api.post(`/twibbon/campaigns/${encodeURIComponent(id)}/view`);
  return res.data.success;
}

export async function trackCampaignUsage(id) {
  const res = await api.post(`/twibbon/campaigns/${encodeURIComponent(id)}/usage`);
  return res.data.success;
}

// Akun: Twibbon milik pengguna yang masuk. Satu akun bisa membuat banyak Twibbon.
export async function fetchMyTwibbons() {
  const res = await api.get('/twibbon/mine', { headers: authHeaders() });
  return res.data.campaigns;
}

export async function fetchMyTwibbon(id) {
  const res = await api.get(`/twibbon/mine/${encodeURIComponent(id)}`, { headers: authHeaders() });
  return res.data.campaign;
}

export async function createTwibbon({ title, description, slug, frameBase64 }) {
  const res = await api.post('/twibbon/campaigns', { title, description, slug, frameBase64 }, { headers: authHeaders() });
  return res.data.campaign;
}

// frameBase64 hanya dikirim bila gambarnya diganti.
export async function updateTwibbon(id, { title, description, frameBase64 }) {
  const body = { title, description };
  if (frameBase64) body.frameBase64 = frameBase64;
  const res = await api.put(`/twibbon/campaigns/${encodeURIComponent(id)}`, body, { headers: authHeaders() });
  return res.data.campaign;
}

// Hapus Twibbon milik sendiri. Super admin boleh menghapus Twibbon mana pun.
export async function deleteTwibbon(id) {
  await api.delete(`/twibbon/campaigns/${encodeURIComponent(id)}`, { headers: authHeaders() });
}

// Super admin: semua Twibbon beserta pembuatnya (tanpa gambar bingkai).
export async function adminFetchTwibbons() {
  const res = await api.get('/admin/twibbons', { headers: authHeaders() });
  return res.data.twibbons;
}
