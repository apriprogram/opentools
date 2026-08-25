# OpenTools

OpenTools adalah platform konversi dan kompresi file berkinerja tinggi, minimalis, dan sangat berfokus pada privasi. 

Dengan memproses file menggunakan mesin berkecepatan tinggi, kami menawarkan pengalaman tanpa batas: **Tanpa iklan, tanpa watermark, dan privasi penuh**. File Anda akan dihapus secara otomatis dari sistem kami setelah 5 menit.

## Fitur Utama

- **Konversi & Kompresi Berbagai Format:** Mendukung Video (MP4, AVI, MKV), Audio (MP3, WAV), Gambar (WEBP, PNG, JPG), hingga Dokumen.
- **Konversi Massal (Batch Convert):** Proses beberapa file sekaligus secara instan.
- **Privacy-First Engine:** Tidak ada penyimpanan data permanen. Enkripsi end-to-end dengan sistem penghapusan file otomatis (Auto-Delete dalam 5 menit).
- **Desain UI/UX Premium:** Antarmuka yang mulus, mendukung *Dark Mode*, dan navigasi super cepat (Apple-like feel).
- **Multi-Bahasa (i18n):** Mendukung Bahasa Indonesia dan Bahasa Inggris.

---

## Prasyarat (Requirements)

Sebelum menjalankan aplikasi ini, pastikan Anda telah menginstal beberapa alat berikut di komputer Anda:
1. **[Node.js](https://nodejs.org/en/)** (Direkomendasikan versi 18.x atau lebih baru).
2. **[FFmpeg](https://ffmpeg.org/download.html)**: Dibutuhkan oleh *backend* untuk melakukan konversi video dan audio (Pastikan `ffmpeg` sudah didaftarkan ke PATH sistem operasi (Environment Variables) Anda).

---

## Cara Menjalankan Aplikasi di Komputer Lokal

Aplikasi ini menggunakan sistem terpisah: **Backend** (Node.js/Express) dan **Frontend** (React/Vite). Anda perlu menjalankan keduanya di dua terminal yang berbeda.

### 1. Menjalankan Backend (Server API)
Buka terminal/CMD baru, arahkan ke folder proyek Anda, dan jalankan perintah berikut:

```bash
# Pindah ke folder backend
cd backend

# Instal semua dependensi server
npm install

# Jalankan server backend (biasanya akan berjalan di http://localhost:3001)
npm run dev
```

### 2. Menjalankan Frontend (Antarmuka Pengguna)
Buka terminal/CMD baru lainnya (jangan tutup terminal backend), dan jalankan perintah berikut:

```bash
# Pindah ke folder frontend
cd frontend

# Instal semua dependensi React/Vite
npm install

# Jalankan server frontend (biasanya akan berjalan di http://localhost:5173)
npm run dev
```

### 3. Akses Website
Setelah kedua server berjalan, buka browser web favorit Anda (Chrome, Edge, Firefox, dll) dan kunjungi:
👉 **[http://localhost:5173](http://localhost:5173)**

---

## Dukung Proyek Open Source Ini!
Proyek ini gratis 100% dan bersifat Open Source. Jika proyek ini membantu Anda, silakan berikan **⭐ Star** pada repositori ini atau berkontribusi langsung pada pengembangan kode!

**Copyright &copy; 2026 Apriprogram. All rights reserved.**
