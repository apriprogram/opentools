import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import archiver from "archiver";
import { CATEGORIES_CONFIG, COMPRESSORS_CONFIG } from "../config/tools.config.js";
import { createJob, getJob } from "../services/job.service.js";
import { runConversion } from "../services/converter.service.js";
import { tempDir } from "../middleware/upload.middleware.js";
import { recordUpload, recordDownload } from "../services/stats.service.js";

/**
 * GET /api/v1/tools
 */
export function getTools(req, res) {
  try {
    return res.json({ success: true, categories: CATEGORIES_CONFIG });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: error.message }
    });
  }
}

/**
 * GET /api/v1/compressors
 */
export function getCompressors(req, res) {
  try {
    return res.json({ success: true, categories: COMPRESSORS_CONFIG });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: error.message }
    });
  }
}

/**
 * POST /api/v1/convert
 */
export async function convertSingle(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { code: "NO_FILE", message: "No file was uploaded." }
      });
    }

    const { toolId, targetFormat } = req.body;
    if (!targetFormat) {
      return res.status(400).json({
        success: false,
        error: { code: "NO_FORMAT", message: "targetFormat is required." }
      });
    }

    const originalFileName = req.file.originalname;
    const inputExt = path.extname(originalFileName).replace(".", "").toLowerCase();
    const baseName = path.basename(originalFileName, path.extname(originalFileName));

    const finalTargetFormat = targetFormat.toLowerCase().replace(".", "");
    const jobId = `job_${uuidv4().replace(/-/g, "").substring(0, 10)}`;
    const outputFileName = `${baseName}_converted.${finalTargetFormat}`;
    const outputPath = path.join(tempDir, `${jobId}_${outputFileName}`);

    recordUpload(req.file.size);

    console.log(`[NEW JOB] ${jobId} | ${originalFileName} → ${finalTargetFormat} | input: ${req.file.path}`);

    const job = createJob({
      jobId,
      toolId: toolId || "custom",
      originalFileName,
      inputPath: req.file.path,
      outputPath,
      outputFileName,
      fromFormat: inputExt,
      targetFormat: finalTargetFormat,
      fileSize: req.file.size
    });

    // Fire-and-forget conversion
    runConversion(job).catch((err) => {
      console.error(`[JOB ERROR] ${jobId}:`, err.message);
    });

    return res.status(200).json({
      success: true,
      jobId: job.jobId,
      status: job.status,
      fileName: outputFileName,
      originalFileName
    });
  } catch (error) {
    console.error("Error in convertSingle:", error);
    return res.status(500).json({
      success: false,
      error: { code: "CONVERSION_INIT_FAILED", message: error.message }
    });
  }
}

/**
 * POST /api/v1/convert/batch
 */
export async function convertBatch(req, res) {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: "NO_FILES", message: "No files uploaded." }
      });
    }

    const { toolId, targetFormat } = req.body;
    const finalTargetFormat = (targetFormat || "png").toLowerCase().replace(".", "");
    const jobsCreated = [];

    for (const file of req.files) {
      const originalFileName = file.originalname;
      const inputExt = path.extname(originalFileName).replace(".", "").toLowerCase();
      const baseName = path.basename(originalFileName, path.extname(originalFileName));

      const jobId = `job_${uuidv4().replace(/-/g, "").substring(0, 10)}`;
      const outputFileName = `${baseName}_converted.${finalTargetFormat}`;
      const outputPath = path.join(tempDir, `${jobId}_${outputFileName}`);

      const job = createJob({
        jobId,
        toolId: toolId || "batch",
        originalFileName,
        inputPath: file.path,
        outputPath,
        outputFileName,
        fromFormat: inputExt,
        targetFormat: finalTargetFormat,
        fileSize: file.size
      });

      recordUpload(file.size);

      runConversion(job).catch((err) => {
        console.error(`[BATCH JOB ERROR] ${jobId}:`, err.message);
      });

      jobsCreated.push({
        jobId: job.jobId,
        status: job.status,
        fileName: outputFileName,
        originalFileName,
        targetFormat: finalTargetFormat
      });
    }

    return res.status(200).json({ success: true, jobs: jobsCreated });
  } catch (error) {
    console.error("Error in convertBatch:", error);
    return res.status(500).json({
      success: false,
      error: { code: "BATCH_CONVERT_FAILED", message: error.message }
    });
  }
}

/**
 * GET /api/v1/convert/:jobId/status
 */
export function getJobStatus(req, res) {
  const { jobId } = req.params;
  const job = getJob(jobId);

  if (!job) {
    return res.status(404).json({
      success: false,
      error: { code: "NOT_FOUND", message: `Job ${jobId} not found.` }
    });
  }

  return res.json({
    success: true,
    jobId: job.jobId,
    status: job.status,
    progress: job.progress,
    fileName: job.outputFileName,
    originalFileName: job.originalFileName,
    downloadUrl: job.downloadUrl,
    error: job.error
  });
}

/**
 * GET /api/v1/convert/:jobId/download
 */
export function downloadResult(req, res) {
  const { jobId } = req.params;
  const job = getJob(jobId);

  if (!job) {
    return res.status(404).json({
      success: false,
      error: { code: "NOT_FOUND", message: "Job not found." }
    });
  }

  if (job.status !== "done" || !job.outputPath || !fs.existsSync(job.outputPath)) {
    return res.status(404).json({
      success: false,
      error: {
        code: "FILE_NOT_FOUND",
        message: job.status === "processing"
          ? "File is still being processed."
          : "Converted file not found or expired."
      }
    });
  }

  const outputName = job.outputFileName || path.basename(job.outputPath);

  // Set proper CORS headers for download
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");

  try {
    const stats = fs.statSync(job.outputPath);
    recordDownload(stats.size);
  } catch (err) {
    console.error("Failed to stat output file for stats:", err);
  }

  return res.download(job.outputPath, outputName, (err) => {
    if (err) {
      console.error(`Download error for job ${jobId}:`, err.message);
    }
  });
}

/**
 * POST /api/v1/convert/download-all
 * Packages all done jobs into a single ZIP archive
 */
export async function downloadAllZip(req, res) {
  try {
    const { jobIds } = req.body;
    if (!jobIds || !Array.isArray(jobIds) || jobIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: "INVALID_BODY", message: "jobIds array is required." }
      });
    }

    // Collect valid done files
    const validFiles = [];
    for (const jobId of jobIds) {
      const job = getJob(jobId);
      if (job && job.status === "done" && job.outputPath && fs.existsSync(job.outputPath)) {
        validFiles.push({ path: job.outputPath, name: job.outputFileName || path.basename(job.outputPath) });
      }
    }

    if (validFiles.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: "NO_DONE_FILES", message: "No completed converted files found." }
      });
    }

    const zipName = `opentools_converted_${Date.now()}.zip`;
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${zipName}"`);
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");

    const archive = archiver("zip", { zlib: { level: 7 } });

    archive.on("error", (err) => {
      console.error("Archive error:", err);
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: { code: "ZIP_FAILED", message: err.message } });
      }
    });

    archive.pipe(res);

    for (const file of validFiles) {
      archive.file(file.path, { name: file.name });
    }

    await archive.finalize();
  } catch (error) {
    console.error("Error creating ZIP:", error);
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        error: { code: "ZIP_FAILED", message: error.message }
      });
    }
  }
}
