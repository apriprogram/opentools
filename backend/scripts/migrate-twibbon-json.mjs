// Sekali jalan: pindahkan data Twibbon dari backend/data/twibbon.json ke MySQL.
// Pemakaian: node scripts/migrate-twibbon-json.mjs
import "../src/config/env.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { ensureSchema } from "../src/db/schema.js";
import { pool, query } from "../src/db/mysql.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const file = path.join(here, "../data/twibbon.json");
if (!fs.existsSync(file)) {
  console.log("Tidak ada twibbon.json, tidak ada yang dimigrasi.");
  process.exit(0);
}

const db = JSON.parse(fs.readFileSync(file, "utf8"));
await ensureSchema();

let users = 0;
for (const u of db.users || []) {
  await query(
    "INSERT IGNORE INTO twibbon_users (id, name, email, created_at) VALUES (?, ?, ?, ?)",
    [u.id, u.name, u.email, new Date(u.createdAt || Date.now())]
  );
  users++;
}

let campaigns = 0;
for (const c of db.campaigns || []) {
  await query(
    `INSERT IGNORE INTO twibbon_campaigns
      (id, slug, title, description, frame_base64, creator_id, views, usage_count, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      c.id,
      c.slug,
      c.title,
      c.description || "",
      c.frameBase64,
      c.creatorId,
      c.views || 0,
      c.usage || 0,
      new Date(c.createdAt || Date.now())
    ]
  );
  campaigns++;
}

console.log(`Migrasi selesai: ${users} user, ${campaigns} campaign diproses (INSERT IGNORE, aman dijalankan ulang).`);
await pool.end();
