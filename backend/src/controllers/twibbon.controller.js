import * as twibbonService from '../services/twibbon.service.js';
import { isAdminRequest } from '../middleware/admin.middleware.js';

const serverError = (res, label, error) => {
  console.error(`${label} error:`, error);
  return res.status(500).json({ success: false, message: 'Internal server error' });
};

export const login = async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || name.trim() === '' || !email || email.trim() === '') {
      return res.status(400).json({ success: false, message: 'Name and Email are required' });
    }
    const user = await twibbonService.loginUser(name.trim(), email.trim());
    res.json({ success: true, user });
  } catch (error) {
    return serverError(res, 'Login', error);
  }
};

export const createCampaign = async (req, res) => {
  try {
    const { title, description, slug, frameBase64, creatorId } = req.body;
    if (!title || !slug || !frameBase64 || !creatorId) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    const campaign = await twibbonService.createCampaign({ title, description, slug, frameBase64, creatorId });
    res.status(201).json({ success: true, campaign });
  } catch (error) {
    return serverError(res, 'Create campaign', error);
  }
};

export const getAllCampaigns = async (req, res) => {
  try {
    const campaigns = await twibbonService.getAllCampaigns();
    res.json({ success: true, campaigns });
  } catch (error) {
    return serverError(res, 'Get campaigns', error);
  }
};

export const getCampaign = async (req, res) => {
  try {
    const campaign = await twibbonService.getCampaignBySlug(req.params.slug);
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }
    res.json({ success: true, campaign });
  } catch (error) {
    return serverError(res, 'Get campaign', error);
  }
};

export const trackView = async (req, res) => {
  try {
    const ok = await twibbonService.trackCampaignView(req.params.id);
    if (ok) return res.json({ success: true });
    res.status(404).json({ success: false, message: 'Campaign not found' });
  } catch (error) {
    return serverError(res, 'Track view', error);
  }
};

export const trackUsage = async (req, res) => {
  try {
    const ok = await twibbonService.trackCampaignUsage(req.params.id);
    if (ok) return res.json({ success: true });
    res.status(404).json({ success: false, message: 'Campaign not found' });
  } catch (error) {
    return serverError(res, 'Track usage', error);
  }
};

export const deleteCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const { creatorId } = req.body || {};

    // Admin: header x-admin-key (ADMIN_KEY di .env) boleh menghapus campaign mana pun.
    // Pengguna biasa hanya boleh menghapus campaign miliknya sendiri (creatorId harus cocok).
    // Catatan: jangan pakai req.ip/localhost sebagai bypass, karena di cPanel semua request
    // datang lewat proxy lokal sehingga selalu terbaca sebagai localhost.
    const ok = isAdminRequest(req)
      ? await twibbonService.deleteCampaignById(id)
      : creatorId
        ? await twibbonService.deleteCampaign(id, creatorId)
        : null;

    if (ok === null) return res.status(401).json({ success: false, message: 'Unauthorized' });
    if (ok) return res.json({ success: true });
    res.status(404).json({ success: false, message: 'Campaign not found' });
  } catch (error) {
    return serverError(res, 'Delete campaign', error);
  }
};
