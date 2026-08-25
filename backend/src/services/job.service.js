import fs from "fs";
import path from "path";

// In-memory job repository
const jobs = new Map();

/**
 * Job structure:
 * {
 *   jobId: string,
 *   toolId: string,
 *   originalFileName: string,
 *   inputPath: string,
 *   outputPath: string,
 *   outputFileName: string,
 *   fromFormat: string,
 *   targetFormat: string,
 *   fileSize: number,
 *   status: 'queued' | 'processing' | 'done' | 'failed',
 *   progress: number (0-100),
 *   error: { code: string, message: string } | null,
 *   createdAt: number,
 *   completedAt: number | null,
 *   downloadUrl: string | null
 * }
 */

export function createJob(jobData) {
  const job = {
    jobId: jobData.jobId,
    toolId: jobData.toolId || "general",
    originalFileName: jobData.originalFileName,
    inputPath: jobData.inputPath,
    outputPath: jobData.outputPath || null,
    outputFileName: jobData.outputFileName || null,
    fromFormat: jobData.fromFormat || "unknown",
    targetFormat: jobData.targetFormat,
    fileSize: jobData.fileSize || 0,
    status: "queued",
    progress: 0,
    error: null,
    createdAt: Date.now(),
    completedAt: null,
    downloadUrl: null
  };

  jobs.set(job.jobId, job);
  return job;
}

export function getJob(jobId) {
  return jobs.get(jobId) || null;
}

export function updateJob(jobId, updates) {
  const job = jobs.get(jobId);
  if (!job) return null;

  const updatedJob = { ...job, ...updates };
  jobs.set(jobId, updatedJob);
  return updatedJob;
}

export function deleteJob(jobId) {
  const job = jobs.get(jobId);
  if (job) {
    // Delete files if still on disk
    try {
      if (job.inputPath && fs.existsSync(job.inputPath)) {
        fs.unlinkSync(job.inputPath);
      }
      if (job.outputPath && fs.existsSync(job.outputPath)) {
        fs.unlinkSync(job.outputPath);
      }
    } catch (e) {
      console.error(`Error deleting files for job ${jobId}:`, e);
    }
    jobs.delete(jobId);
  }
}

// Clean up jobs older than 5 minutes periodically
setInterval(() => {
  const now = Date.now();
  const FIVE_MINUTES = 5 * 60 * 1000;
  for (const [jobId, job] of jobs.entries()) {
    if (now - job.createdAt > FIVE_MINUTES) {
      deleteJob(jobId);
    }
  }
}, 60 * 1000); // Check every minute
