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

export default router;
