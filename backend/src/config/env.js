import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Muat .env dari folder backend (bukan dari cwd), dan dipanggil sebelum modul lain membaca process.env.
const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(here, "../../.env") });
