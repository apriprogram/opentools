import * as lt from "../services/linktree.service.js";

const fail = (res, error) => {
  if (error.status) return res.status(error.status).json({ success: false, message: error.message });
  console.error("Linktree error:", error);
  return res.status(500).json({ success: false, message: "Terjadi kesalahan di server." });
};

// Akun: daftar, buat, ambil, ubah, dan hapus Linktree milik pengguna yang masuk.
export const listLinktrees = async (req, res) => {
  try {
    res.json({ success: true, linktrees: await lt.listLinktrees(req.user.id) });
  } catch (error) {
    return fail(res, error);
  }
};

export const createLinktree = async (req, res) => {
  try {
    const linktree = await lt.createLinktree(req.user.id, req.body || {});
    res.status(201).json({ success: true, linktree });
  } catch (error) {
    return fail(res, error);
  }
};

export const getLinktree = async (req, res) => {
  try {
    res.json({ success: true, linktree: await lt.getLinktree(req.user.id, req.params.id) });
  } catch (error) {
    return fail(res, error);
  }
};

export const updateLinktree = async (req, res) => {
  try {
    const linktree = await lt.updateLinktree(req.user.id, req.params.id, req.body || {});
    res.json({ success: true, linktree });
  } catch (error) {
    return fail(res, error);
  }
};

export const deleteLinktree = async (req, res) => {
  try {
    await lt.deleteLinktree(req.user.id, req.params.id);
    res.json({ success: true });
  } catch (error) {
    return fail(res, error);
  }
};

// Super admin: melihat semua Linktree yang dibuat pengguna (hanya baca).
export const adminListLinktrees = async (req, res) => {
  try {
    res.json({ success: true, linktrees: await lt.adminListLinktrees() });
  } catch (error) {
    return fail(res, error);
  }
};

export const adminGetLinktree = async (req, res) => {
  try {
    res.json({ success: true, linktree: await lt.adminGetLinktree(req.params.id) });
  } catch (error) {
    return fail(res, error);
  }
};

// Publik: halaman Linktree, pencatatan kunjungan, dan klik tautan.
export const publicLinktree = async (req, res) => {
  try {
    res.json({ success: true, linktree: await lt.getPublicLinktree(req.params.slug) });
  } catch (error) {
    return fail(res, error);
  }
};

export const publicView = async (req, res) => {
  try {
    await lt.recordView(req.params.slug);
    res.json({ success: true });
  } catch (error) {
    return fail(res, error);
  }
};

export const publicClick = async (req, res) => {
  try {
    const result = await lt.recordClick(req.params.slug, req.params.itemId);
    res.json({ success: true, url: result.url });
  } catch (error) {
    return fail(res, error);
  }
};
