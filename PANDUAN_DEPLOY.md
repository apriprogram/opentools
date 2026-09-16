# Panduan Deploy Aplikasi OpenTools ke cPanel Hosting

Panduan ini akan menjelaskan langkah-langkah untuk meng-upload dan men-deploy aplikasi (Frontend React/Vite dan Backend Node.js) ke hosting cPanel, serta mengatur domain `opentools.web.id`.

## 1. Persiapan Build (Lokal)

Sebelum mengupload ke hosting, Anda perlu melakukan build pada aplikasi frontend Anda.

1. Buka terminal di folder `frontend`.
2. Jalankan perintah:
   ```bash
   npm run build
   ```
3. Proses ini akan membuat sebuah folder bernama `dist` di dalam folder `frontend`. Folder ini berisi file statis HTML, CSS, dan JS yang sudah dioptimasi dan siap di-upload.

## 2. Setting Domain di cPanel

Karena Anda sudah memesan domain `opentools.web.id`, kita perlu memastikannya terhubung ke hosting Anda.

1. Login ke akun **cPanel** hosting Anda.
2. Cari menu **Domains** (atau Addon Domains jika ini bukan domain utama).
3. Pastikan `opentools.web.id` sudah terdaftar dan menunjuk ke direktori yang benar. Berdasarkan file `.cpanel.yml` Anda, direktori root-nya adalah `/home/tanjunak/public/opentools.web.id/`.
   - Document Root: `/home/tanjunak/public/opentools.web.id/`

## 3. Deploy Frontend (React/Vite)

Ada dua cara mendeploy frontend: secara manual via File Manager atau otomatis via Git Version Control (karena Anda memiliki `.cpanel.yml`).

### Opsi A: Cara Manual (File Manager)
1. Di komputer Anda, masuk ke folder `frontend/dist`.
2. Block semua isi dari folder `dist` dan jadikan file `.zip` (misal: `dist.zip`).
3. Di cPanel, buka **File Manager**.
4. Masuk ke direktori `public/opentools.web.id/`.
5. Klik **Upload** dan unggah file `dist.zip` tadi.
6. Setelah selesai, kembali ke File Manager, klik kanan file `dist.zip` dan pilih **Extract**.
7. Pastikan file `index.html` dan folder `assets` berada langsung di dalam folder `public/opentools.web.id/`.

### Opsi B: Cara Git Version Control (Menggunakan .cpanel.yml)
Karena Anda sudah punya `.cpanel.yml`:
1. Pastikan Anda sudah mem-push kode Anda (termasuk folder frontend/dist) ke repositori Git yang terhubung dengan cPanel di menu **Git Version Control**.
2. Klik **Manage** pada repository tersebut di cPanel, lalu klik tab **Pull or Deploy**.
3. Klik tombol **Update from Remote** lalu klik **Deploy HEAD Commit**. Sistem akan otomatis menyalin isi folder `dist` ke folder public domain Anda sesuai dengan skrip di `.cpanel.yml`.

## 4. Deploy Backend (Node.js API)

Backend Node.js Anda memerlukan setup khusus di cPanel.

1. Di cPanel, cari menu **Setup Node.js App** (biasanya di bawah kategori Software).
2. Klik **Create Application**.
3. Isi konfigurasi berikut:
   - **Node.js version**: Pilih versi LTS (misal 18.x atau 20.x, sesuaikan dengan yang Anda gunakan di lokal).
   - **Application mode**: `Production`
   - **Application root**: Isi dengan folder untuk backend, misalnya `backend_api` (cPanel akan membuat folder ini di `/home/tanjunak/backend_api`).
   - **Application URL**: Pilih `opentools.web.id` dan tambahkan `/api` di kotak sebelahnya (sehingga menjadi `opentools.web.id/api`). *Atau Anda bisa menggunakan subdomain khusus seperti `api.opentools.web.id` jika Anda sudah membuatnya*.
   - **Application startup file**: `src/server.js` (sesuai `main` di `package.json` backend Anda).
4. Klik **Create**.
5. Sekarang, buka **File Manager** di cPanel dan masuk ke folder `backend_api` yang baru saja dibuat.
6. Upload file-file backend Anda dari komputer (`package.json`, folder `src`, dll) ke dalam folder ini. **TIDAK PERLU** mengupload folder `node_modules`.
7. Kembali ke menu **Setup Node.js App**, edit aplikasi yang baru dibuat.
8. Scroll ke bawah dan klik tombol **Run NPM Install** untuk menginstal dependensi backend secara otomatis di server.
9. Jika ada file `.env`, buat file `.env` di dalam folder `backend_api` melalui File Manager dan isi dengan *environment variables* yang dibutuhkan backend Anda di mode production (seperti URL frontend yang diizinkan untuk CORS, port, dll).
10. Terakhir, klik tombol **Restart** di halaman Setup Node.js App.

## 5. Konfigurasi API Endpoint di Frontend

Setelah backend berjalan di hosting, URL API Anda tidak lagi `http://localhost:xxxx`.

1. Di komputer lokal Anda, buka file konfigurasi frontend (misalnya tempat Anda mendefinisikan Axios instance atau fetch API, biasanya ada variabel `API_URL` atau `VITE_API_URL` di file `.env` frontend).
2. Ubah URL API yang mengarah ke localhost menjadi URL production Anda (contoh: `https://opentools.web.id/api` atau `https://api.opentools.web.id` tergantung konfigurasi Anda di langkah 4).
3. Anda harus mem-build ulang frontend Anda (Langkah 1) dan mengunggah ulang ke cPanel (Langkah 3) jika Anda mengubah URL API ini secara hardcode.

## 6. SSL / HTTPS (Keamanan)
Pastikan domain Anda sudah menggunakan HTTPS.
1. Di cPanel, cari menu **SSL/TLS Status** atau **Let's Encrypt SSL**.
2. Centang domain `opentools.web.id` dan klik **Run AutoSSL** atau **Issue** agar website Anda bisa diakses secara aman dengan gembok `https://`.

---
*Catatan:* Jika Anda menggunakan routing React (react-router-dom) atau Vue Router di Frontend, Anda mungkin perlu membuat file `.htaccess` di dalam folder `public/opentools.web.id/` agar refresh halaman tidak error 404:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```
