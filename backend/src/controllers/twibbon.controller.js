import * as twibbonService from '../services/twibbon.service.js';
import { isAdminRequest } from '../middleware/admin.middleware.js';
import { sessionUser } from '../middleware/auth.middleware.js';

const fail = (res, label, error) => {
  if (error.status) return res.status(error.status).json({ success: false, message: error.message });
  console.error(`${label} error:`, error);
  return res.status(500).json({ success: false, message: 'Terjadi kesalahan di server.' });
};

// Akun: buat, daftar, ambil, ubah, dan hapus Twibbon milik pengguna yang masuk.
export const createCampaign = async (req, res) => {
  try {
    const campaign = await twibbonService.createCampaign(req.user, req.body || {});
    res.status(201).json({ success: true, campaign });
  } catch (error) {
    return fail(res, 'Create twibbon', error);
  }
};

export const myCampaigns = async (req, res) => {
  try {
    res.json({ success: true, campaigns: await twibbonService.listMyCampaigns(req.user) });
  } catch (error) {
    return fail(res, 'My twibbons', error);
  }
};

export const myCampaign = async (req, res) => {
  try {
    res.json({ success: true, campaign: await twibbonService.getOwnedCampaign(req.user, req.params.id) });
  } catch (error) {
    return fail(res, 'My twibbon', error);
  }
};

export const updateCampaign = async (req, res) => {
  try {
    const campaign = await twibbonService.updateCampaign(req.user, req.params.id, req.body || {});
    res.json({ success: true, campaign });
  } catch (error) {
    return fail(res, 'Update twibbon', error);
  }
};

// Hapus: pemiliknya sendiri, atau super admin (untuk moderasi).
// Tidak ada lagi hapus dengan mengirim ID pembuat, karena ID itu dulu ikut tampil di data publik.
export const deleteCampaign = async (req, res) => {
  try {
    const user = await sessionUser(req);
    if (isAdminRequest(req) || user?.role === 'superadmin') {
      const ok = await twibbonService.deleteCampaignById(req.params.id);
      if (!ok) return res.status(404).json({ success: false, message: 'Twibbon tidak ditemukan.' });
      return res.json({ success: true });
    }
    if (!user) return res.status(401).json({ success: false, message: 'Silakan masuk terlebih dahulu.' });
    await twibbonService.deleteOwnedCampaign(user, req.params.id);
    return res.json({ success: true });
  } catch (error) {
    return fail(res, 'Delete twibbon', error);
  }
};

// Publik: daftar Twibbon, satu Twibbon, dan pencatatan dilihat serta dipakai.
export const getAllCampaigns = async (req, res) => {
  try {
    res.json({ success: true, campaigns: await twibbonService.getAllCampaigns() });
  } catch (error) {
    return fail(res, 'Get twibbons', error);
  }
};

export const getCampaign = async (req, res) => {
  try {
    const campaign = await twibbonService.getCampaignBySlug(req.params.slug);
    if (!campaign) return res.status(404).json({ success: false, message: 'Twibbon tidak ditemukan.' });
    res.json({ success: true, campaign });
  } catch (error) {
    return fail(res, 'Get twibbon', error);
  }
};

export const trackView = async (req, res) => {
  try {
    const ok = await twibbonService.trackCampaignView(req.params.id);
    if (ok) return res.json({ success: true });
    res.status(404).json({ success: false, message: 'Twibbon tidak ditemukan.' });
  } catch (error) {
    return fail(res, 'Track view', error);
  }
};

export const trackUsage = async (req, res) => {
  try {
    const ok = await twibbonService.trackCampaignUsage(req.params.id);
    if (ok) return res.json({ success: true });
    res.status(404).json({ success: false, message: 'Twibbon tidak ditemukan.' });
  } catch (error) {
    return fail(res, 'Track usage', error);
  }
};

// Semua Twibbon untuk halaman Data Twibbon (super admin).
export const adminCampaigns = async (req, res) => {
  try {
    return res.json({ success: true, twibbons: await twibbonService.adminListCampaigns() });
  } catch (error) {
    return fail(res, 'Admin list twibbon', error);
  }
};
