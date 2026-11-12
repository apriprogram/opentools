import "./config/env.js";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import apiRouter from "./routes/api.js";
import { ensureSchema } from "./db/schema.js";
import { scanQr } from "./controllers/scan.controller.js";
import { ensureSuperAdmin } from "./services/auth.service.js";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// API Routes
app.use("/api/v1", apiRouter);

// Alamat yang tertanam di gambar QR pengguna. Pendek supaya pola QR tidak terlalu rapat.
// Sengaja di bawah /api, karena di server produksi hanya alamat /api yang diteruskan ke aplikasi Node.
app.get("/api/q/:code", scanQr);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "file-converter-backend"
  });
});

// Serve React frontend static files (build output in the public root, next to the backend folder).
// STATIC_DIR bisa diisi untuk menunjuk folder lain. Folder backend (berisi .env dan kode server)
// tidak boleh terbaca dari web, jadi permintaan ke /backend, /node_modules, /.git dan file dotfile ditolak.
const frontendDist = process.env.STATIC_DIR
  ? path.resolve(process.env.STATIC_DIR)
  : path.join(__dirname, "../../");

app.use((req, res, next) => {
  if (/^\/(backend|node_modules|\.git|temp|data)(\/|$)/i.test(req.path) || /\/\.[^/]+$/.test(req.path)) {
    return res.status(404).end();
  }
  next();
});
app.use(express.static(frontendDist, { dotfiles: "ignore" }));

// Endpoint API yang tidak ada: balas JSON, jangan index.html
app.all("/api/*", (req, res) => {
  res.status(404).json({ success: false, message: "Endpoint tidak ditemukan" });
});

// SPA fallback — serve index.html for all non-API routes
app.get("*", (req, res) => {
  res.sendFile(path.join(frontendDist, "index.html"));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled Server Error:", err);
  res.status(err.status || 500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: err.message || "An unexpected error occurred"
    }
  });
});

ensureSchema()
  .then(() => ensureSuperAdmin())
  .then(() => console.log("🗄️  MySQL schema siap"))
  .catch((err) => console.error("⚠️  MySQL belum terhubung (fitur Twibbon & QR tidak aktif):", err.message))
  .finally(() => {
    app.listen(PORT, () => {
      console.log(`🚀 File Converter Backend API running on http://localhost:${PORT}`);
      console.log(`📡 Endpoints available under http://localhost:${PORT}/api/v1`);
      console.log(`🌐 Serving React frontend from: ${frontendDist}`);
    });
  });
