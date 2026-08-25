import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import ffprobeInstaller from "@ffprobe-installer/ffprobe";
import sharp from "sharp";
import fs from "fs";
import path from "path";
import heicConvert from "heic-convert";
import { PDFDocument } from "pdf-lib";
import { updateJob } from "./job.service.js";
import { recordProcessed } from "./stats.service.js";

// Configure FFmpeg binary paths
ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

// Image formats that Sharp can handle (excluding HEIC/HEIF — use FFmpeg instead)
const SHARP_IMAGE_FORMATS = new Set([
  "png", "jpg", "jpeg", "webp", "tiff", "tif", "gif", "avif", "bmp", "jfif"
]);

// HEIC/HEIF: must use FFmpeg (Sharp doesn't have HEVC decoder on Windows)
const HEIC_INPUT_FORMATS = new Set(["heic", "heif"]);

// Audio/video formats handled by FFmpeg
const FFMPEG_FORMATS = new Set([
  "mp3", "mp4", "ogg", "wav", "aac", "m4a", "flac",
  "webm", "mov", "mkv", "avi", "wmv", "flv"
]);

/**
 * Main conversion dispatcher
 */
export async function runConversion(job) {
  const { jobId, inputPath, outputPath, targetFormat, fromFormat } = job;

  try {
    updateJob(jobId, { status: "processing", progress: 10 });

    const inExt = (fromFormat || "").toLowerCase();
    const outExt = targetFormat.toLowerCase();

    const isHeicInput = HEIC_INPUT_FORMATS.has(inExt);
    const isSharpOutput = SHARP_IMAGE_FORMATS.has(outExt);
    const isFfmpegOutput = FFMPEG_FORMATS.has(outExt);

    const isCompressor = (job.toolId || "").includes("compressor");

    if (outExt === "svg") {
      // SVG wrapping
      await convertToSvg(job);
    } else if (outExt === "pdf" && (SHARP_IMAGE_FORMATS.has(inExt) || isHeicInput)) {
      // Image to PDF via pdf-lib
      await convertImageToPdf(job);
    } else if (["pdf", "docx", "epub", "mobi", "txt", "rtf"].includes(outExt) || ["pdf", "docx", "epub", "mobi", "txt", "rtf"].includes(inExt)) {
      throw new Error("Document & PDF conversion requires OpenTools Pro subscription.");
    } else if (isCompressor) {
      // COMPRESSION LOGIC
      if (SHARP_IMAGE_FORMATS.has(outExt)) {
        await compressImage(job);
      } else if (FFMPEG_FORMATS.has(outExt)) {
        await compressMediaWithFFmpeg(job);
      } else {
        throw new Error("Format not supported for compression.");
      }
    } else if (isHeicInput) {
      // HEIC input: use heic-convert to decode, then sharp to output
      await convertHeic(job);
    } else if (SHARP_IMAGE_FORMATS.has(inExt) && isSharpOutput) {
      // Standard image → image via Sharp
      await convertImage(job);
    } else if (isSharpOutput && !FFMPEG_FORMATS.has(inExt)) {
      // Unknown input but image output → try Sharp
      await convertImage(job);
    } else {
      // Audio / video via FFmpeg
      await convertMediaWithFFmpeg(job);
    }

    // Verify output
    if (fs.existsSync(outputPath)) {
      const stats = fs.statSync(outputPath);
      if (stats.size === 0) throw new Error("Output file is empty (0 bytes).");

      updateJob(jobId, {
        status: "done",
        progress: 100,
        completedAt: Date.now(),
        downloadUrl: `/api/v1/convert/${jobId}/download`
      });
      recordProcessed(job.toolId);
      console.log(`[JOB DONE] ${jobId} → ${outputPath}`);
    } else {
      throw new Error("Converted file not found after processing.");
    }
  } catch (error) {
    console.error(`[JOB FAILED] ${jobId}: ${error.message}`);
    updateJob(jobId, {
      status: "failed",
      progress: 0,
      error: {
        code: "CONVERSION_ERROR",
        message: error.message || "Failed to convert file"
      }
    });
  } finally {
    // Auto-cleanup original uploaded file immediately after processing
    try {
      if (inputPath && fs.existsSync(inputPath)) {
        fs.unlinkSync(inputPath);
        console.log(`[CLEANUP] Deleted input file: ${inputPath}`);
      }
    } catch (cleanupError) {
      console.error(`[CLEANUP ERROR] Failed to delete ${inputPath}:`, cleanupError.message);
    }
  }
}

/**
 * HEIC/HEIF → any image format via heic-convert and sharp
 */
async function convertHeic(job) {
  const { jobId, inputPath, outputPath, targetFormat } = job;
  const format = targetFormat.toLowerCase();

  updateJob(jobId, { progress: 30 });
  
  // Read HEIC to buffer
  const inputBuffer = fs.readFileSync(inputPath);
  
  // Convert HEIC to JPEG buffer first (using heic-convert)
  const jpegBuffer = await heicConvert({
    buffer: inputBuffer,
    format: 'JPEG',      // Output format from heic-convert
    quality: 1           // 0 to 1
  });

  updateJob(jobId, { progress: 60 });

  // Then process with Sharp for target format, rotation, and compression
  let pipeline = sharp(jpegBuffer, {
    failOnError: false,
    limitInputPixels: 268402689
  }).rotate();

  switch (format) {
    case "png":
      pipeline = pipeline.png({ compressionLevel: 7 });
      break;
    case "jpg":
    case "jpeg":
    case "jfif":
      pipeline = pipeline.jpeg({ quality: 92, mozjpeg: true });
      break;
    case "webp":
      pipeline = pipeline.webp({ quality: 85, effort: 4 });
      break;
    case "tiff":
    case "tif":
      pipeline = pipeline.tiff({ quality: 90, compression: "lzw" });
      break;
    case "avif":
      pipeline = pipeline.avif({ quality: 80, effort: 4 });
      break;
    case "gif":
      pipeline = pipeline.gif();
      break;
    case "bmp":
      pipeline = pipeline.png({ compressionLevel: 1 });
      break;
    default:
      pipeline = pipeline.toFormat(format);
  }

  updateJob(jobId, { progress: 75 });
  await pipeline.toFile(outputPath);
  updateJob(jobId, { progress: 95 });
}

/**
 * Image → SVG (base64 embed)
 */
async function convertToSvg(job) {
  const { jobId, inputPath, outputPath } = job;
  updateJob(jobId, { progress: 30 });

  const inputBuffer = fs.readFileSync(inputPath);
  const metadata = await sharp(inputBuffer, { failOnError: false }).metadata();
  const mimeType = metadata.format === "jpeg" ? "image/jpeg" : `image/${metadata.format || "png"}`;
  const base64 = inputBuffer.toString("base64");
  const width = metadata.width || 800;
  const height = metadata.height || 600;

  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <image width="${width}" height="${height}" xlink:href="data:${mimeType};base64,${base64}"/>
</svg>`;

  fs.writeFileSync(outputPath, svgContent, "utf8");
  updateJob(jobId, { progress: 95 });
}

/**
 * Raster image conversion via Sharp
 */
async function convertImage(job) {
  const { jobId, inputPath, outputPath, targetFormat } = job;
  const format = targetFormat.toLowerCase();

  updateJob(jobId, { progress: 30 });

  let pipeline = sharp(inputPath, {
    failOnError: false,
    limitInputPixels: 268402689
  }).rotate(); // EXIF auto-orient

  updateJob(jobId, { progress: 55 });

  switch (format) {
    case "png":
      pipeline = pipeline.png({ compressionLevel: 7 });
      break;
    case "jpg":
    case "jpeg":
    case "jfif":
      pipeline = pipeline.jpeg({ quality: 92, mozjpeg: true });
      break;
    case "webp":
      pipeline = pipeline.webp({ quality: 85, effort: 4 });
      break;
    case "tiff":
    case "tif":
      pipeline = pipeline.tiff({ quality: 90, compression: "lzw" });
      break;
    case "avif":
      pipeline = pipeline.avif({ quality: 80, effort: 4 });
      break;
    case "gif":
      pipeline = pipeline.gif();
      break;
    case "bmp":
      // Sharp can't write BMP natively, convert to PNG with .bmp extension workaround
      pipeline = pipeline.png({ compressionLevel: 1 });
      break;
    default:
      pipeline = pipeline.toFormat(format);
  }

  updateJob(jobId, { progress: 75 });
  await pipeline.toFile(outputPath);
  updateJob(jobId, { progress: 95 });
}

/**
 * Audio/Video conversion via FFmpeg
 */
function convertMediaWithFFmpeg(job) {
  const { jobId, inputPath, outputPath, targetFormat } = job;
  const format = targetFormat.toLowerCase();

  return new Promise((resolve, reject) => {
    console.log(`[FFmpeg] ${inputPath} → ${format}`);
    let command = ffmpeg(inputPath);

    command.on("progress", (p) => {
      if (p.percent != null) {
        const val = Math.min(95, Math.max(15, Math.round(p.percent)));
        updateJob(jobId, { progress: val });
      }
    });

    command.on("error", (err) => {
      console.error("[FFmpeg ERROR]", err.message);
      reject(new Error(err.message));
    });

    command.on("end", () => {
      updateJob(jobId, { progress: 95 });
      resolve();
    });

    switch (format) {
      case "mp3":
        command.noVideo().audioCodec("libmp3lame").audioBitrate("320k").audioFrequency(44100).audioChannels(2).format("mp3");
        break;
      case "ogg":
        command.noVideo().audioCodec("libvorbis").audioBitrate("192k").format("ogg");
        break;
      case "wav":
        command.noVideo().audioCodec("pcm_s16le").audioFrequency(44100).format("wav");
        break;
      case "aac":
        command.noVideo().audioCodec("aac").audioBitrate("256k").format("adts");
        break;
      case "m4a":
        command.noVideo().audioCodec("aac").audioBitrate("256k").format("ipod");
        break;
      case "flac":
        command.noVideo().audioCodec("flac").format("flac");
        break;
      case "mp4":
        command.videoCodec("libx264").audioCodec("aac")
          .outputOptions(["-preset fast", "-crf 23", "-pix_fmt yuv420p", "-movflags +faststart", "-max_muxing_queue_size 1024"])
          .format("mp4");
        break;
      case "webm":
        command.videoCodec("libvpx-vp9").audioCodec("libopus")
          .outputOptions(["-crf 30", "-b:v 0", "-deadline realtime"])
          .format("webm");
        break;
      case "mov":
        command.videoCodec("libx264").audioCodec("aac")
          .outputOptions(["-preset fast", "-crf 23"])
          .format("mov");
        break;
      case "mkv":
        command.videoCodec("libx264").audioCodec("aac")
          .outputOptions(["-preset fast", "-crf 23"])
          .format("matroska");
        break;
      case "avi":
        command.videoCodec("mpeg4").audioCodec("libmp3lame")
          .outputOptions(["-q:v 6"])
          .format("avi");
        break;
      default:
        command.format(format);
    }

    command.save(outputPath);
  });
}

/**
 * Image Compression via Sharp (high compression settings)
 */
async function compressImage(job) {
  const { jobId, inputPath, outputPath, targetFormat } = job;
  const format = targetFormat.toLowerCase();

  updateJob(jobId, { progress: 30 });

  let pipeline = sharp(inputPath, {
    failOnError: false,
    limitInputPixels: 268402689
  }).rotate();

  updateJob(jobId, { progress: 55 });

  switch (format) {
    case "png":
      pipeline = pipeline.png({ compressionLevel: 9, quality: 60, palette: true });
      break;
    case "jpg":
    case "jpeg":
    case "jfif":
      pipeline = pipeline.jpeg({ quality: 50, mozjpeg: true });
      break;
    case "webp":
      pipeline = pipeline.webp({ quality: 50, effort: 6 });
      break;
    case "gif":
      pipeline = pipeline.gif({ colors: 128 });
      break;
    default:
      pipeline = pipeline.toFormat(format, { quality: 50 });
  }

  updateJob(jobId, { progress: 75 });
  await pipeline.toFile(outputPath);
  updateJob(jobId, { progress: 95 });
}

/**
 * Audio/Video compression via FFmpeg (lower bitrate / higher CRF)
 */
function compressMediaWithFFmpeg(job) {
  const { jobId, inputPath, outputPath, targetFormat } = job;
  const format = targetFormat.toLowerCase();

  return new Promise((resolve, reject) => {
    console.log(`[FFmpeg COMPRESS] ${inputPath} → ${format}`);
    let command = ffmpeg(inputPath);

    command.on("progress", (p) => {
      if (p.percent != null) {
        const val = Math.min(95, Math.max(15, Math.round(p.percent)));
        updateJob(jobId, { progress: val });
      }
    });

    command.on("error", (err) => {
      console.error("[FFmpeg COMPRESS ERROR]", err.message);
      reject(new Error(err.message));
    });

    command.on("end", () => {
      updateJob(jobId, { progress: 95 });
      resolve();
    });

    switch (format) {
      case "mp3":
        command.noVideo().audioCodec("libmp3lame").audioBitrate("96k").audioFrequency(44100).audioChannels(2).format("mp3");
        break;
      case "wav":
        command.noVideo().audioCodec("pcm_s16le").audioFrequency(22050).format("wav");
        break;
      case "mp4":
        command.videoCodec("libx264").audioCodec("aac")
          .outputOptions(["-preset fast", "-crf 30", "-pix_fmt yuv420p", "-b:a 96k"])
          .format("mp4");
        break;
      default:
        command.format(format);
    }

    command.save(outputPath);
  });
}

/**
 * Image → PDF conversion via pdf-lib
 */
async function convertImageToPdf(job) {
  const { jobId, inputPath, outputPath, fromFormat } = job;
  updateJob(jobId, { progress: 30 });

  let imageBuffer = fs.readFileSync(inputPath);
  const inExt = (fromFormat || "").toLowerCase();
  
  if (HEIC_INPUT_FORMATS.has(inExt)) {
    imageBuffer = await heicConvert({ buffer: imageBuffer, format: 'JPEG', quality: 1 });
  }

  // Ensure image is compatible with pdf-lib (JPG or PNG)
  const metadata = await sharp(imageBuffer).metadata();
  if (metadata.format !== 'jpeg' && metadata.format !== 'png') {
    imageBuffer = await sharp(imageBuffer).jpeg({ quality: 95 }).toBuffer();
  }

  updateJob(jobId, { progress: 50 });

  const pdfDoc = await PDFDocument.create();
  let image;
  try {
    image = await pdfDoc.embedJpg(imageBuffer);
  } catch (e) {
    // Fallback to png if embedJpg fails
    imageBuffer = await sharp(imageBuffer).png().toBuffer();
    image = await pdfDoc.embedPng(imageBuffer);
  }

  const page = pdfDoc.addPage([image.width, image.height]);
  page.drawImage(image, {
    x: 0,
    y: 0,
    width: image.width,
    height: image.height,
  });

  updateJob(jobId, { progress: 80 });
  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(outputPath, pdfBytes);
  updateJob(jobId, { progress: 95 });
}

