import express from "express";
import { upload } from "../middleware/upload.middleware.js";
import { getStats, recordVisitor } from "../services/stats.service.js";
import {
  getTools,
  getCompressors,
  convertSingle,
  convertBatch,
  getJobStatus,
  downloadResult,
  downloadAllZip
} from "../controllers/converter.controller.js";
import {
  login,
  createCampaign,
  getAllCampaigns,
  getCampaign,
  trackView,
  trackUsage,
  deleteCampaign
} from "../controllers/twibbon.controller.js";
import {
  getPlans,
  createOrder,
  lookupOrder,
  uploadProof,
  verifyLicense,
  adminListOrders,
  adminConfirmOrder,
  adminCancelOrder,
  adminSetLicense,
  adminDeleteOrder,
  adminGetProof,
  adminGetNota,
  adminGetNotaPdf
} from "../controllers/qr.controller.js";
import { requireAdmin } from "../middleware/admin.middleware.js";
import { adminLogin } from "../controllers/admin.controller.js";
import { register, login as accountLogin, logout as accountLogout, me as currentUser } from "../controllers/auth.controller.js";
import { myQr, saveQr, removeQr, myOrders, myLicenses, myProof, myNota, myNotaPdf, setWhatsapp } from "../controllers/me.controller.js";
import { requireUser } from "../middleware/auth.middleware.js";
import { proofUploadSingle } from "../middleware/proof.middleware.js";

const router = express.Router();

// Realtime Stats
router.get("/stats", (req, res) => {
  res.json({ success: true, stats: getStats() });
});
router.post("/stats/visit", express.json(), (req, res) => {
  const { country } = req.body;
  recordVisitor(country);
  res.json({ success: true });
});

// Metadata and tools list
router.get("/tools", getTools);
router.get("/compressors", getCompressors);

// Conversion endpoints
router.post("/convert", upload.single("file"), convertSingle);
router.post("/convert/batch", upload.array("files", 20), convertBatch);
router.get("/convert/:jobId/status", getJobStatus);
router.get("/convert/:jobId/download", downloadResult);
router.post("/convert/download-all", downloadAllZip);

// Twibbon endpoints
router.post("/twibbon/auth", express.json({limit: '10mb'}), login);
router.post("/twibbon/campaigns", express.json({limit: '50mb'}), createCampaign);
router.get("/twibbon/campaigns", getAllCampaigns);
router.get("/twibbon/campaigns/:slug", getCampaign);
router.post("/twibbon/campaigns/:id/view", trackView);
router.post("/twibbon/campaigns/:id/usage", trackUsage);
router.delete("/twibbon/campaigns/:id", express.json(), deleteCampaign);

// QR Generator: paket berbayar (transfer manual) dan verifikasi lisensi
router.get("/qr/plans", getPlans);
router.post("/qr/orders", express.json(), createOrder);
router.post("/qr/orders/lookup", express.json(), lookupOrder);
router.post("/qr/orders/:code/proof", proofUploadSingle, uploadProof);
router.post("/qr/license/verify", express.json(), verifyLicense);

// Akun: daftar, masuk, keluar, dan data akun. Pengguna menyimpan QR dan melihat pesanan serta lisensinya.
router.post("/auth/register", express.json(), register);
router.post("/auth/login", express.json(), accountLogin);
router.post("/auth/logout", accountLogout);
router.get("/auth/me", requireUser, currentUser);
router.get("/me/qr", requireUser, myQr);
router.post("/me/qr", requireUser, express.json(), saveQr);
router.delete("/me/qr/:id", requireUser, removeQr);
router.get("/me/orders", requireUser, myOrders);
router.get("/me/licenses", requireUser, myLicenses);
router.get("/me/orders/:code/proof", requireUser, myProof);
router.get("/me/orders/:code/nota", requireUser, myNota);
router.get("/me/orders/:code/nota.pdf", requireUser, myNotaPdf);
router.put("/me/whatsapp", requireUser, express.json(), setWhatsapp);

// Admin: masuk dengan username + password, lalu kirim token di header x-admin-key
router.post("/admin/login", express.json(), adminLogin);
router.get("/admin/qr/orders", requireAdmin, adminListOrders);
router.get("/admin/qr/orders/:code/proof", requireAdmin, adminGetProof);
router.get("/admin/qr/orders/:code/nota", requireAdmin, adminGetNota);
router.get("/admin/qr/orders/:code/nota.pdf", requireAdmin, adminGetNotaPdf);
router.post("/admin/qr/orders/:code/confirm", requireAdmin, adminConfirmOrder);
router.post("/admin/qr/orders/:code/cancel", requireAdmin, adminCancelOrder);
router.post("/admin/qr/orders/:code/license", requireAdmin, express.json(), adminSetLicense);
router.delete("/admin/qr/orders/:code", requireAdmin, adminDeleteOrder);

export default router;
