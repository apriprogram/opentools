import multer from "multer";

// Bukti transfer disimpan di memori (tidak ditulis ke disk), maksimal 4 MB, satu file per permintaan.
const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const proofUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES, files: 1 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) return cb(null, true);
    const err = new Error("Format bukti harus JPG, PNG, atau WEBP.");
    err.status = 400;
    return cb(err);
  }
});

// Membungkus multer agar error upload selalu dikembalikan sebagai JSON, bukan halaman HTML.
export function proofUploadSingle(req, res, next) {
  proofUpload.single("proof")(req, res, (err) => {
    if (!err) return next();
    const message = err.code === "LIMIT_FILE_SIZE" ? "Ukuran bukti maksimal 4 MB." : err.message;
    return res.status(err.status || 400).json({ success: false, message });
  });
}
