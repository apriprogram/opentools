import { query } from "../db/mysql.js";

let stats = {
  visitors: 0,
  uploadsBytes: 0,
  downloadsBytes: 0,
  processedFiles: 0,
  countries: {},
  toolUsage: {}
};

export function getStats() {
  return stats;
}

export function recordVisitor(country) {
  stats.visitors += 1;
  if (country) {
    stats.countries[country] = (stats.countries[country] || 0) + 1;
  }
}

export function recordUpload(bytes) {
  stats.uploadsBytes += bytes;
}

export function recordDownload(bytes) {
  stats.downloadsBytes += bytes;
}

// Hari menurut WIB (UTC+7), supaya satu hari di statistik sama dengan satu hari bagi pengguna di Indonesia.
const todayWib = () => new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);

// Satu file selesai diproses. Angka di memori dipakai halaman Overview; tabel tool_usage_daily dipakai
// Statistik admin dan bertahan saat server dinyalakan ulang. Kegagalan mencatat tidak boleh menggagalkan konversi.
export function recordProcessed(toolId, { bytesIn = 0, bytesOut = 0 } = {}) {
  stats.processedFiles += 1;
  if (toolId) {
    stats.toolUsage[toolId] = (stats.toolUsage[toolId] || 0) + 1;
  }
  const id = String(toolId || "custom").slice(0, 64);
  const kind = id.includes("compressor") ? "compress" : "convert";
  query(
    `INSERT INTO tool_usage_daily (day, tool_id, kind, uses, bytes_in, bytes_out) VALUES (?, ?, ?, 1, ?, ?)
     ON DUPLICATE KEY UPDATE uses = uses + 1, bytes_in = bytes_in + VALUES(bytes_in), bytes_out = bytes_out + VALUES(bytes_out)`,
    [todayWib(), id, kind, Math.max(0, Number(bytesIn) || 0), Math.max(0, Number(bytesOut) || 0)]
  ).catch((err) => console.error("Gagal mencatat pemakaian alat:", err.message));
}

// Pemakaian per hari dan per alat, untuk halaman Statistik admin.
export async function listToolUsage() {
  const rows = await query(
    "SELECT DATE_FORMAT(day, '%Y-%m-%d') AS day, tool_id, kind, uses, bytes_in, bytes_out FROM tool_usage_daily ORDER BY day ASC LIMIT 50000"
  );
  return rows.map((row) => ({
    day: row.day,
    toolId: row.tool_id,
    kind: row.kind,
    uses: Number(row.uses || 0),
    bytesIn: Number(row.bytes_in || 0),
    bytesOut: Number(row.bytes_out || 0)
  }));
}
