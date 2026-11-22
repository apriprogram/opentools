import dotenv from "dotenv";
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";

// Muat .env dari folder backend (bukan dari cwd), dan dipanggil sebelum modul lain membaca process.env.
const here = path.dirname(fileURLToPath(import.meta.url));

// Hosting yang membuat folder build baru setiap deploy (mis. Hostinger Web Apps) menyimpan .env
// di luar folder build: ENV_FILE, atau ~/opentools-data/.env milik akun. Nilai yang sudah ada tidak ditimpa.
const homes = [os.homedir()];
try { homes.push(os.userInfo().homedir); } catch (_) { /* abaikan */ }
const persistentEnv = [process.env.ENV_FILE, ...homes.map((h) => h && path.join(h, "opentools-data", ".env"))]
  .find((file) => file && fs.existsSync(file));
if (persistentEnv) dotenv.config({ path: persistentEnv });

dotenv.config({ path: path.join(here, "../../.env") });
