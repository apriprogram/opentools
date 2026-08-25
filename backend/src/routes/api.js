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

export default router;
