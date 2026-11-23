import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import ffprobeInstaller from "@ffprobe-installer/ffprobe";
import sharp from "sharp";
import fs from "fs";
import heicConvert from "heic-convert";
import { PDFDocument } from "pdf-lib";
import { updateJob } from "./job.service.js";
import { recordProcessed } from "./stats.service.js";
import { documentConverter } from "./document.service.js";

// Configure FFmpeg binary paths
ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

// Image formats that Sharp can handle (excluding HEIC/HEIF — use heic-convert instead)
const SHARP_IMAGE_FORMATS = new Set([
  "png", "jpg", "jpeg", "webp", "tiff", "tif", "gif", "avif", "bmp", "jfif"
]);

// HEIC/HEIF: must use heic-convert (Sharp doesn't have HEVC decoder on Windows)
const HEIC_INPUT_FORMATS = new Set(["heic", "heif"]);

// Audio/video formats handled by FFmpeg
const FFMPEG_FORMATS = new Set([
  "mp3", "mp4", "ogg", "wav", "aac", "m4a", "flac",
  "webm", "mov", "mkv", "avi", "wmv", "flv"
]);

const DOCUMENT_FORMATS = new Set(["pdf", "docx", "doc", "epub", "mobi", "txt", "rtf"]);

const SHARP_OPTIONS = { failOnError: false, limitInputPixels: 268402689 };

// Tanpa cache file: di Windows, file yang masih dipegang cache Sharp tidak bisa dihapus setelah konversi.
sharp.cache({ files: 0 });

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

    const isCompressor = (job.toolId || "").includes("compressor");
    const docConvert = documentConverter(inExt === "doc" ? "doc" : inExt, outExt);

    if (outExt === "svg") {
      // SVG wrapping
      await convertToSvg(job);
    } else if (outExt === "ico") {
      await convertToIco(job);
    } else if (outExt === "pdf" && (SHARP_IMAGE_FORMATS.has(inExt) || isHeicInput)) {
      // Image to PDF via pdf-lib
      await convertImageToPdf(job);
    } else if (isCompressor) {
      // COMPRESSION LOGIC
      if (SHARP_IMAGE_FORMATS.has(outExt)) {
        await compressImage(job);
      } else if (FFMPEG_FORMATS.has(outExt)) {
        await compressMediaWithFFmpeg(job);
      } else if (outExt === "pdf") {
        await compressPdf(job);
      } else {
        throw new Error(`Kompresi ke ${outExt} belum didukung di server.`);
      }
    } else if (docConvert) {
      updateJob(jobId, { progress: 35 });
      await docConvert(inputPath, outputPath);
      updateJob(jobId, { progress: 95 });
    } else if (inExt === "doc") {
      throw new Error("File Word lama (.doc) belum didukung. Simpan ulang sebagai .docx di Word, lalu coba lagi.");
    } else if (DOCUMENT_FORMATS.has(outExt) || DOCUMENT_FORMATS.has(inExt)) {
      // Konversi dokumen yang belum ada mesinnya: job ditandai gagal dengan pesan jelas.
      throw new Error(`Konversi ${inExt || "file"} ke ${outExt} belum didukung di server.`);
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
        outputSize: stats.size,
        downloadUrl: `/api/v1/convert/${jobId}/download`
      });
      recordProcessed(job.toolId, { bytesIn: job.fileSize || 0, bytesOut: stats.size });
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

// Pilih encoder Sharp untuk format tujuan, dengan kualitas tertentu (1-100).
function encodeImage(pipeline, format, quality = 92) {
  switch (format) {
    case "png":
      return pipeline.png({ compressionLevel: 7 });
    case "jpg":
    case "jpeg":
    case "jfif":
      return pipeline.jpeg({ quality, mozjpeg: true });
    case "webp":
      return pipeline.webp({ quality: Math.min(quality, 90), effort: 4 });
    case "tiff":
    case "tif":
      return pipeline.tiff({ quality: 90, compression: "lzw" });
    case "avif":
      return pipeline.avif({ quality: Math.min(quality, 80), effort: 4 });
    case "gif":
      return pipeline.gif();
    case "bmp":
      // Sharp can't write BMP natively, convert to PNG with .bmp extension workaround
      return pipeline.png({ compressionLevel: 1 });
    default:
      return pipeline.toFormat(format);
  }
}

/**
 * HEIC/HEIF → any image format via heic-convert and sharp
 */
async function convertHeic(job) {
  const { jobId, inputPath, outputPath, targetFormat } = job;
  updateJob(jobId, { progress: 30 });
  const jpegBuffer = await heicToJpeg(fs.readFileSync(inputPath));
  updateJob(jobId, { progress: 60 });
  const pipeline = encodeImage(sharp(jpegBuffer, SHARP_OPTIONS).rotate(), targetFormat.toLowerCase());
  updateJob(jobId, { progress: 75 });
  await pipeline.toFile(outputPath);
  updateJob(jobId, { progress: 95 });
}

const heicToJpeg = (buffer) => heicConvert({ buffer, format: "JPEG", quality: 1 });

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
 * Gambar → ICO (ikon favicon). Berisi beberapa ukuran (16 sampai 256 px) dalam bentuk PNG,
 * cara yang didukung semua browser dan Windows Vista ke atas.
 */
async function convertToIco(job) {
  const { jobId, inputPath, outputPath, fromFormat } = job;
  updateJob(jobId, { progress: 30 });
  let source = fs.readFileSync(inputPath);
  if (HEIC_INPUT_FORMATS.has((fromFormat || "").toLowerCase())) source = await heicToJpeg(source);

  const sizes = [16, 32, 48, 64, 128, 256];
  const images = [];
  for (const size of sizes) {
    images.push(
      await sharp(source, SHARP_OPTIONS)
        .rotate()
        .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer()
    );
  }
  updateJob(jobId, { progress: 70 });

  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(images.length, 4);
  const entries = [];
  let offset = 6 + 16 * images.length;
  images.forEach((png, i) => {
    const size = sizes[i];
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0); // 0 berarti 256
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2); // palette
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += png.length;
    entries.push(entry);
  });
  fs.writeFileSync(outputPath, Buffer.concat([header, ...entries, ...images]));
  updateJob(jobId, { progress: 95 });
}

/**
 * Raster image conversion via Sharp
 */
async function convertImage(job) {
  const { jobId, inputPath, outputPath, targetFormat } = job;
  const format = targetFormat.toLowerCase();
  updateJob(jobId, { progress: 30 });
  // GIF bergerak tetap bergerak saat diubah ke WEBP atau GIF.
  const animated = ["gif", "webp"].includes(format);
  const pipeline = encodeImage(sharp(inputPath, { ...SHARP_OPTIONS, animated }).rotate(), format);
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

  return runFfmpeg(jobId, inputPath, outputPath, (command) => {
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
  });
}

// Jalankan FFmpeg dengan pelaporan progres. configure(command) mengatur codec dan format.
function runFfmpeg(jobId, inputPath, outputPath, configure) {
  return new Promise((resolve, reject) => {
    const command = ffmpeg(inputPath);
    command.on("progress", (p) => {
      if (p.percent != null) updateJob(jobId, { progress: Math.min(95, Math.max(15, Math.round(p.percent))) });
    });
    command.on("error", (err) => {
      console.error("[FFmpeg ERROR]", err.message);
      reject(new Error(err.message));
    });
    command.on("end", () => {
      updateJob(jobId, { progress: 95 });
      resolve();
    });
    configure(command);
    command.save(outputPath);
  });
}

/* ── Kompresi ────────────────────────────────────────────────────────────────
   Tanpa target: pengaturan tetap (kualitas sedang). Dengan target (job.targetPercent, 10 sampai 90):
   ukuran hasil dibidik sekitar persen tersebut dari ukuran file asli.
   - Gambar: kualitas dicari bertahap, lalu ukuran gambar dikecilkan bila kualitas terendah masih kebesaran.
   - Audio dan video: bitrate dihitung dari durasi supaya ukurannya mendekati target. */

// Persen target dari permintaan, atau null bila tidak diatur.
const targetPercentOf = (job) => {
  const n = Number(job.targetPercent);
  return Number.isFinite(n) && n >= 5 && n <= 95 ? n : null;
};

/**
 * Image Compression via Sharp
 */
async function compressImage(job) {
  const { jobId, inputPath, outputPath, targetFormat, fromFormat } = job;
  const format = targetFormat.toLowerCase() === "jpeg" ? "jpg" : targetFormat.toLowerCase();
  updateJob(jobId, { progress: 25 });

  let source = fs.readFileSync(inputPath);
  if (HEIC_INPUT_FORMATS.has((fromFormat || "").toLowerCase())) source = await heicToJpeg(source);
  const animated = format === "gif" || format === "webp";
  const percent = targetPercentOf(job);

  // Satu kali kompres dengan "tingkat" 0 (paling ringan) sampai 1 (paling kuat) dan skala ukuran gambar.
  const encode = async (level, scale = 1) => {
    let pipeline = sharp(source, { ...SHARP_OPTIONS, animated }).rotate();
    if (scale < 1) {
      const meta = await sharp(source, { ...SHARP_OPTIONS, animated }).metadata();
      const width = Math.max(16, Math.round((meta.width || 1000) * scale));
      pipeline = pipeline.resize({ width, withoutEnlargement: true });
    }
    const quality = Math.max(3, Math.round(92 - level * 88));
    switch (format) {
      case "png":
        return pipeline
          .png({ compressionLevel: 9, palette: true, quality, colors: Math.max(8, Math.round(256 - level * 240)), effort: 7 })
          .toBuffer();
      case "jpg":
      case "jfif":
        return pipeline.jpeg({ quality, mozjpeg: true }).toBuffer();
      case "webp":
        return pipeline.webp({ quality, effort: 6 }).toBuffer();
      case "avif":
        return pipeline.avif({ quality: Math.max(2, Math.round(quality * 0.75)), effort: 5 }).toBuffer();
      case "gif":
        return pipeline.gif({ colors: Math.max(4, Math.round(256 - level * 248)), effort: 8, dither: 0.6 }).toBuffer();
      case "tiff":
      case "tif":
        return pipeline.tiff({ compression: "jpeg", quality }).toBuffer();
      default:
        return pipeline.toFormat(format, { quality }).toBuffer();
    }
  };

  let result;
  if (!percent) {
    result = await encode(0.5);
  } else {
    const target = Math.max(1024, Math.round((job.fileSize || source.length) * (percent / 100)));
    let best = null;
    const consider = (buf) => {
      // Pilih hasil terbesar yang masih di bawah target; kalau belum ada, pilih yang paling kecil.
      if (buf.length <= target) {
        if (!best || best.length > target || buf.length > best.length) best = buf;
      } else if (!best || (best.length > target && buf.length < best.length)) best = buf;
    };
    // Cari tingkat kompresi dengan pembagian dua.
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 7; i++) {
      const mid = (lo + hi) / 2;
      const buf = await encode(mid);
      consider(buf);
      if (buf.length > target) lo = mid;
      else hi = mid;
      updateJob(jobId, { progress: 30 + i * 7 });
    }
    // Masih kebesaran di tingkat paling kuat: kecilkan ukuran gambarnya.
    let scale = 1;
    for (let i = 0; best.length > target && i < 6; i++) {
      scale *= Math.max(0.35, Math.min(0.9, Math.sqrt(target / best.length)));
      consider(await encode(1, scale));
    }
    result = best;
  }

  updateJob(jobId, { progress: 90 });
  fs.writeFileSync(outputPath, result);
  updateJob(jobId, { progress: 95 });
}

// Durasi media dalam detik (0 bila tidak diketahui).
const probeDuration = (inputPath) =>
  new Promise((resolve) => {
    ffmpeg.ffprobe(inputPath, (err, data) => resolve(err ? 0 : Number(data?.format?.duration) || 0));
  });

const hasVideoStream = (inputPath) =>
  new Promise((resolve) => {
    ffmpeg.ffprobe(inputPath, (err, data) => resolve(!err && (data?.streams || []).some((s) => s.codec_type === "video")));
  });

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

// Sample rate WAV/FLAC terdekat di bawah kebutuhan.
const SAMPLE_RATES = [44100, 32000, 22050, 16000, 11025, 8000];

/**
 * Audio/Video compression via FFmpeg
 */
async function compressMediaWithFFmpeg(job) {
  const { jobId, inputPath, outputPath, targetFormat } = job;
  const format = targetFormat.toLowerCase();
  const percent = targetPercentOf(job);
  const duration = percent ? await probeDuration(inputPath) : 0;
  const targetBytes = percent ? (job.fileSize || fs.statSync(inputPath).size) * (percent / 100) : 0;
  // Bitrate total (kbps) yang menghasilkan ukuran target, dengan cadangan 4% untuk data kontainer.
  const totalKbps = percent && duration > 0 ? (targetBytes * 8 * 0.96) / duration / 1000 : 0;
  const isVideoFormat = ["mp4", "mov", "mkv", "webm", "avi"].includes(format);
  const withVideo = isVideoFormat ? await hasVideoStream(inputPath) : false;

  const audioKbps = (fallback, min = 24, max = 320) => (totalKbps ? Math.round(clamp(totalKbps, min, max)) : fallback);

  // Untuk WAV/FLAC (tanpa bitrate): turunkan sample rate dan jumlah kanal sampai cukup kecil.
  const pcmSettings = () => {
    if (!percent) return { rate: 22050, channels: 2 };
    const ratio = percent / 100;
    let best = { rate: 8000, channels: 1 };
    for (const channels of [2, 1]) {
      for (const rate of SAMPLE_RATES) {
        if ((rate * channels) / (44100 * 2) <= ratio) {
          if (rate * channels > best.rate * best.channels) best = { rate, channels };
          break;
        }
      }
    }
    return best;
  };

  // Video: bagi bitrate untuk audio dan gambar. Bitrate sangat rendah juga menurunkan resolusi.
  const videoSettings = (fallbackCrf) => {
    if (!totalKbps || !withVideo) return { crf: fallbackCrf };
    const audio = Math.round(clamp(totalKbps * 0.12, 32, 128));
    const video = Math.max(60, Math.round(totalKbps - audio));
    const height = video < 250 ? 360 : video < 600 ? 480 : video < 1200 ? 720 : null;
    return { audio, video, height };
  };

  return runFfmpeg(jobId, inputPath, outputPath, (command) => {
    const applyVideo = (codec, fallbackCrf, extra = []) => {
      const s = videoSettings(fallbackCrf);
      command.videoCodec(codec);
      const opts = [...extra];
      if (s.crf != null) opts.push(`-crf ${s.crf}`);
      else {
        opts.push(`-b:v ${s.video}k`, `-maxrate ${Math.round(s.video * 1.4)}k`, `-bufsize ${Math.round(s.video * 2)}k`);
        if (s.height) opts.push(`-vf scale=-2:'min(${s.height},ih)'`);
      }
      command.outputOptions(opts);
      return s;
    };

    switch (format) {
      case "mp3":
        command.noVideo().audioCodec("libmp3lame").audioBitrate(`${audioKbps(96, 32, 320)}k`).audioFrequency(44100).format("mp3");
        break;
      case "m4a":
        command.noVideo().audioCodec("aac").audioBitrate(`${audioKbps(96, 24, 320)}k`).format("ipod");
        break;
      case "aac":
        command.noVideo().audioCodec("aac").audioBitrate(`${audioKbps(96, 24, 320)}k`).format("adts");
        break;
      case "ogg":
        command.noVideo().audioCodec("libvorbis").audioBitrate(`${audioKbps(96, 45, 320)}k`).format("ogg");
        break;
      case "wav": {
        const s = pcmSettings();
        command.noVideo().audioCodec("pcm_s16le").audioFrequency(s.rate).audioChannels(s.channels).format("wav");
        break;
      }
      case "flac": {
        // FLAC tanpa kehilangan data: kompresi tertinggi, ditambah sample rate lebih rendah bila ada target.
        const s = percent ? pcmSettings() : null;
        command.noVideo().audioCodec("flac").outputOptions(["-compression_level 12"]);
        if (s) command.audioFrequency(s.rate).audioChannels(s.channels);
        command.format("flac");
        break;
      }
      case "webm": {
        const s = applyVideo("libvpx-vp9", 38, ["-deadline good", "-cpu-used 4", "-row-mt 1"]);
        if (s.crf != null) command.outputOptions(["-b:v 0"]);
        command.audioCodec("libopus").audioBitrate(`${s.audio || 96}k`).format("webm");
        break;
      }
      case "mov":
      case "mkv":
      case "mp4":
      case "avi": {
        const s = applyVideo("libx264", 30, ["-preset fast", "-pix_fmt yuv420p"]);
        command.audioCodec("aac").audioBitrate(`${s.audio || 96}k`);
        if (format === "mp4") command.outputOptions(["-movflags +faststart"]).format("mp4");
        else if (format === "mov") command.format("mov");
        else if (format === "mkv") command.format("matroska");
        else command.format("avi");
        break;
      }
      default:
        command.format(format);
    }
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
    imageBuffer = await heicToJpeg(imageBuffer);
  }

  // Ensure image is compatible with pdf-lib (JPG or PNG)
  const metadata = await sharp(imageBuffer).metadata();
  if (metadata.format !== "jpeg" && metadata.format !== "png") {
    imageBuffer = await sharp(imageBuffer).rotate().jpeg({ quality: 95 }).toBuffer();
  }

  updateJob(jobId, { progress: 50 });

  const pdfDoc = await PDFDocument.create();
  let image;
  try {
    image = metadata.format === "png" ? await pdfDoc.embedPng(imageBuffer) : await pdfDoc.embedJpg(imageBuffer);
  } catch (e) {
    imageBuffer = await sharp(imageBuffer).png().toBuffer();
    image = await pdfDoc.embedPng(imageBuffer);
  }

  const page = pdfDoc.addPage([image.width, image.height]);
  page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });

  updateJob(jobId, { progress: 80 });
  fs.writeFileSync(outputPath, await pdfDoc.save());
  updateJob(jobId, { progress: 95 });
}

/**
 * Simple PDF compression (re-save) via pdf-lib
 */
async function compressPdf(job) {
  const { jobId, inputPath, outputPath } = job;
  updateJob(jobId, { progress: 30 });

  const pdfBytes = fs.readFileSync(inputPath);
  updateJob(jobId, { progress: 50 });

  try {
    const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
    updateJob(jobId, { progress: 75 });
    // Object streams memadatkan struktur PDF; hasilnya dipakai hanya bila memang lebih kecil.
    const compressedBytes = await pdfDoc.save({ useObjectStreams: true });
    fs.writeFileSync(outputPath, compressedBytes.length < pdfBytes.length ? compressedBytes : pdfBytes);
  } catch (err) {
    console.error("PDF compress error:", err);
    fs.copyFileSync(inputPath, outputPath);
  }

  updateJob(jobId, { progress: 95 });
}
