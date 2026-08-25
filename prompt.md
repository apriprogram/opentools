# PROMPT: Bangun Website "File Converter" (React JS + JSON API)

Gunakan prompt ini sebagai instruksi lengkap untuk AI coding assistant (Claude Code, Cursor, dll) untuk membangun aplikasi web file converter dari nol.

---

## 1. Ringkasan Proyek

Buat sebuah **website konversi file** (Video & Audio, Image) menggunakan **React JS** di frontend dan **JSON REST API** di backend. Website harus modern, minimalis, rapi, dengan komponen berbentuk card, rounded corner besar, banyak whitespace, dan font **Poppins** di seluruh UI — mengikuti gaya pada gambar referensi (dashboard/manajemen proyek: card putih, border tipis abu-abu, shadow lembut, tombol hitam pekat/solid, icon outline sederhana).

---

## 2. Tech Stack

**Frontend**
- React JS (Vite)
- React Router DOM (routing antar halaman/kategori converter)
- Tailwind CSS (utility-first, memudahkan replikasi style card & spacing)
- Axios (fetch ke API)
- Font: **Poppins** (Google Fonts) — weight 400 (regular), 500 (medium), 600 (semibold), 700 (bold)
- Icon: `lucide-react` (icon outline tipis, senada dengan gambar referensi)
- React Dropzone (drag & drop upload file)

**Backend**
- Node.js + Express
- REST **JSON API** (bukan GraphQL)
- FFmpeg (untuk convert video/audio) via `fluent-ffmpeg`
- Sharp (untuk convert image: WEBP, PNG, JPG, HEIC, dll)
- Multer (handle upload file multipart)
- Job disimpan sementara di storage lokal / folder `temp`, response berupa JSON berisi status & URL download

---

## 3. Design System — Detail UI/UX (mengacu ke gambar referensi ke-2, ke-3, ke-4, ke-5)

**Prinsip utama: flat & minim shadow.** Elevasi antar elemen dibentuk lewat *border tipis* dan *perbedaan warna background* (card putih di atas page abu-abu), **bukan** drop-shadow tebal. Shadow hanya dipakai sangat halus pada modal (opsional) dan tidak sama sekali pada card biasa.

### 3.1 Warna
| Token | Hex | Penggunaan |
|---|---|---|
| `--bg-page` | `#EDEDEF` | Background halaman (abu sangat muda) |
| `--bg-card` | `#FFFFFF` | Background card/modal |
| `--bg-card-muted` | `#F7F7F8` | Background dropzone / item non-interaktif di dalam card |
| `--border` | `#E4E4E7` | Border default card, input, list item |
| `--border-hover` | `#C9C9CE` | Border saat hover |
| `--border-focus` | `#1A1A1E` | Border saat focus (input aktif) |
| `--text-primary` | `#121214` | Judul, teks utama, nilai angka besar |
| `--text-secondary` | `#8A8A93` | Label kecil, subteks, placeholder |
| `--text-tertiary` | `#B4B4BA` | Icon default (non-hover), disabled text |
| `--accent-black` | `#18181B` | Tombol utama (solid), teks aktif |
| `--accent-black-hover` | `#000000` | Tombol utama saat hover |
| `--success` | `#16A34A` | Indikator naik / status berhasil |
| `--danger` | `#DC2626` | Indikator turun / status gagal |
| `--overlay` | `rgba(17,17,20,0.45)` | Backdrop di belakang modal |

### 3.2 Spacing Scale (4px base grid)
Gunakan skala kelipatan 4 secara konsisten — jangan pakai angka acak (`10px`, `13px`, dst).

| Token | Nilai | Contoh pemakaian |
|---|---|---|
| `space-1` | 4px | gap antar icon & label kecil |
| `space-2` | 8px | gap antar elemen dalam satu baris (icon+text) |
| `space-3` | 12px | padding vertikal tombol, gap antar list item |
| `space-4` | 16px | padding input field, gap antar card dalam grid |
| `space-5` | 20px | padding dalam card kecil, margin antar section |
| `space-6` | 24px | padding dalam card besar / modal body |
| `space-8` | 32px | jarak antar section utama di halaman |
| `space-10` | 40px | margin atas-bawah container utama modal |

### 3.3 Radius Scale
| Token | Nilai | Pemakaian |
|---|---|---|
| `radius-sm` | 8px | badge kecil, chip format file |
| `radius-md` | 12px | input field, dropzone, button rectangular |
| `radius-lg` | 16px | card menu/list item, card file preview |
| `radius-xl` | 20–24px | modal container |
| `radius-full` | 9999px | button pill (mis. "Browse files"), avatar |

### 3.4 Shadow (diminimalkan)
- **Card biasa (list item, file preview card)**: **tanpa shadow**, cukup `border: 1px solid var(--border)`.
- **Card saat hover**: tanpa shadow juga — cukup border berubah ke `var(--border-hover)` + background tetap putih.
- **Modal/dialog saja** boleh pakai shadow sangat tipis untuk memisahkan dari overlay:
  `box-shadow: 0 4px 16px rgba(17,17,20,0.06);` — jangan lebih gelap/besar dari ini.
- **Dropdown/menu popover**: shadow tipis serupa modal, `0 2px 8px rgba(17,17,20,0.08)`.
- Jangan gunakan shadow bawaan Tailwind `shadow-md`/`shadow-lg`/`shadow-xl` — terlalu tebal untuk gaya ini.

### 3.5 Tipografi (Poppins) — Scale Lengkap
| Elemen | Ukuran | Weight | Line-height | Warna |
|---|---|---|---|---|
| Judul halaman (H1) | 24px | 600 | 32px | `--text-primary` |
| Judul modal/section (H2) | 18px | 600 | 26px | `--text-primary` |
| Label section kecil (mis. "Folder Name") | 13px | 600 | 18px | `--text-primary` |
| Nama item/card (judul list) | 14–15px | 500 | 20px | `--text-primary` |
| Angka statistik besar (mis. "48.2k") | 26–28px | 600 | 34px | `--text-primary` |
| Body / deskripsi | 13px | 400 | 20px | `--text-secondary` |
| Sub-teks / caption (mis. "Up to 50MB") | 12px | 400 | 16px | `--text-secondary` |
| Label tombol | 14px | 500 | 20px | mengikuti varian tombol |
| Placeholder input | 14px | 400 | 20px | `--text-secondary` |
| Badge/chip kecil | 11px | 500 | 14px | `--text-secondary` |

### 3.6 Ukuran Icon
| Konteks | Ukuran | Stroke width | Warna default | Warna hover |
|---|---|---|---|---|
| Icon navigasi bawah (tab bar, gambar ke-3) | 24px | 1.5px | `--text-tertiary` | `--text-primary` (aktif: solid/filled) |
| Icon dalam card header (folder, briefcase) | 18px | 1.75px | `--text-primary` | — |
| Icon action per-item (edit, hapus/trash, kanan card) | 16px | 1.75px | `--text-tertiary` | `--danger` untuk trash, `--text-primary` untuk edit |
| Icon di tombol (download, share, close X) | 16–18px | 1.75px | mengikuti warna teks tombol | — |
| Icon besar di tengah dropzone (cloud-upload) | 32–36px | 1.5px | `--text-tertiary` | `--text-primary` saat drag-over |
| Icon chevron/dropdown | 16px | 2px | `--text-secondary` | `--text-primary` |

### 3.7 Card Menu / List Item (acuan card "Task Management App" di gambar ke-2)
- Tinggi total: `88–92px` (termasuk padding)
- Padding dalam: `space-3` (12px) vertikal, `space-4` (16px) horizontal
- Radius: `radius-lg` (16px)
- Border: `1px solid var(--border)`, **tanpa shadow**
- Gap antar card dalam list: `space-3` (12px)
- Layout internal: thumbnail kiri (`56×56px`, radius `10px`, `object-fit: cover`) → gap `space-4` (16px) → kolom teks (judul 14px/500 + subjudul 12px/400 abu, gap `4px` antar baris) → flex-grow spacer → icon actions kanan (gap antar icon `space-3`/12px, area klik tiap icon minimal `32×32px` agar mudah di-tap)
- **Hover state**: border berubah ke `--border-hover`, background tetap putih (bukan abu), cursor `pointer`, transisi `150ms ease` pada `border-color`. Icon action baru terlihat penuh opacity saat hover card (opsional: opacity 0.6 default → 1 saat hover card, khusus desktop)

### 3.8 Card Statistik (acuan grid 2 kolom "Followers/Engagement" di gambar ke-3)
- Ukuran: mengisi grid 2 kolom dengan gap `space-3` (12px), aspect kotak-mendekati-persegi, padding internal `space-5` (20px)
- Radius: `radius-lg` (16px), border `1px solid var(--border)`, tanpa shadow
- Isi: label kecil di atas (13px/400 abu) → jarak `8px` → angka besar (26px/600 hitam) → jarak `4px` → indikator perubahan (12px/500, hijau `--success` atau merah `--danger`, dengan ikon panah kecil 12px opsional)

### 3.9 Input Field & Textarea (acuan "Folder Name", "Description Project" di gambar ke-2 & ke-4)
- Tinggi input single-line: `44px`
- Padding: `12px 14px`
- Radius: `radius-md` (12px)
- Border default: `1px solid var(--border)`
- Font: 14px/400, warna `--text-primary`, placeholder `--text-secondary`
- Label di atas input: `13px/600`, margin-bottom `8px`
- **Focus state**: border → `2px solid var(--border-focus)` (hitam), tanpa outline browser default (`outline: none`), tanpa glow/shadow biru
- **Hover state (belum fokus)**: border → `--border-hover`
- **Disabled**: background `--bg-card-muted`, teks `--text-tertiary`, cursor `not-allowed`
- **Error state**: border `1px solid var(--danger)`, teks bantuan error 12px merah di bawah input dengan margin-top `4px`
- Textarea: tinggi minimum `96px`, padding sama, resize vertical only

### 3.10 Upload Box / Dropzone (acuan gambar ke-2, ke-4, ke-5)
- Tinggi: `180–220px` (desktop), full-width dalam card container
- Border: `1.5px dashed var(--border)`, radius `radius-md` (12px)
- Background: `--bg-card-muted`
- Konten tersusun vertikal & center: icon cloud (`space-3`/12px margin-bottom) → judul "Choose a file or drag & drop it here." (14px/500, `--text-primary`) → jarak `4px` → subteks format & ukuran (12px/400, `--text-secondary`) → jarak `space-4`/16px → tombol pill "Browse files" (lihat 3.11, ukuran small)
- **Hover state**: border → `--border-hover`, background tetap
- **Drag-over state (file ditarik ke atas box)**: border → `2px solid var(--border-focus)` (hitam, solid bukan dashed), background berubah ke putih, icon & judul warna → `--text-primary`
- **Error (format ditolak)**: border `1.5px dashed var(--danger)`, teks error muncul di bawah subteks

### 3.11 Tombol (Button) — Semua Varian & State
**Ukuran (berlaku untuk semua varian):**
| Ukuran | Tinggi | Padding horizontal | Font |
|---|---|---|---|
| Small | 32px | 14px | 12px/500 |
| Default | 40px | 18px | 14px/500 |
| Large | 44px | 22px | 14px/500 |

Radius tombol: `radius-md` (12px) untuk tombol rectangular (mis. "Save Folder"), `radius-full` untuk tombol pill kecil (mis. "Browse files", "Preview" full-width tetap radius-md/lg mengikuti container).

**Primary (solid hitam, mis. "Save Folder", "Preview")**
- Default: bg `--accent-black`, teks putih, **tanpa border, tanpa shadow**
- Hover: bg `--accent-black-hover` (hitam lebih pekat), transisi `150ms ease`
- Active/pressed: scale `0.98` (opsional, transform halus) atau bg sedikit lebih gelap
- Disabled: bg `#D4D4D8`, teks `#FFFFFF` opacity 0.8, cursor `not-allowed`
- Focus (keyboard): outline ring `2px solid var(--accent-black)` dengan offset `2px` (untuk aksesibilitas, bukan default browser)

**Secondary (outline, mis. "Download Data", "Share")**
- Default: bg putih, border `1px solid var(--border)`, teks `--text-primary`, tanpa shadow
- Hover: border → `--border-hover`, bg → `--bg-card-muted`
- Active: bg sedikit lebih gelap dari hover
- Disabled: teks & border `--text-tertiary`

**Ghost/Text button (mis. tombol "..." menu, back arrow di gambar ke-3)**
- Default: transparan, tanpa border, icon `--text-primary`
- Hover: bg `--bg-card-muted` bentuk lingkaran (untuk icon button) radius `radius-full`, ukuran hit-area `36×36px` atau `40×40px`
- Active: bg sedikit lebih gelap dari hover

### 3.12 Icon Button Bulat (back button, more-menu — acuan gambar ke-3)
- Ukuran: `40×40px`
- Background default: putih dengan border `1px solid var(--border)` **atau** `--bg-card-muted` tanpa border (pilih salah satu, konsisten di seluruh app)
- Radius: `radius-full`
- Icon di dalam: 20px, warna `--text-primary`
- Hover: background → `--bg-card-muted` (jika default putih) atau border → `--border-hover`
- Tanpa shadow

### 3.13 Modal / Dialog
- Lebar: `480–560px` (form sederhana) atau `640–720px` (form kompleks seperti gambar ke-2/ke-4), max-height `90vh` dengan scroll internal jika konten panjang
- Radius: `radius-xl` (20–24px)
- Padding internal: `space-6` (24px), header terpisah dari body dengan `border-bottom: 1px solid var(--border)` padding-bottom `space-4`
- Shadow: satu-satunya tempat shadow boleh terlihat — `0 4px 16px rgba(17,17,20,0.06)`, **bukan** shadow gelap besar
- Overlay backdrop: `--overlay`, klik di luar modal → close (kecuali sedang proses upload)
- Tombol close (X): icon button bulat 32×32px pojok kanan atas, lihat 3.12 versi kecil
- Footer modal: `border-top: 1px solid var(--border)`, padding-top `space-4`, tombol-tombol rata kanan/kiri sesuai layout gambar ke-2 (secondary kiri, primary kanan)

### 3.14 Bottom Navigation (acuan gambar ke-3)
- Tinggi bar: `64–72px`
- Item aktif: dibungkus pill/kapsul dengan background `--bg-card-muted` atau hitam solid tergantung kontras, radius `radius-full`, icon 24px
- Item non-aktif: icon 24px warna `--text-tertiary`, tanpa background
- Tombol "+" (add/plus) di ujung kanan: lingkaran solid hitam `44×44px`, icon putih 20px, **tanpa shadow** (border tipis putih/abu opsional jika perlu kontras dari page)

### 3.15 Chip / Badge Format File
- Contoh: label "MP4", "PNG" pada dropdown format
- Ukuran: tinggi `24px`, padding horizontal `10px`, radius `radius-sm` (8px) atau `radius-full`
- Font: 11px/500, uppercase
- Background: `--bg-card-muted`, teks `--text-secondary`; saat dipilih (selected) → bg `--accent-black`, teks putih

### 3.16 Transisi & Motion (global)
- Semua hover/focus state pakai transisi halus: `transition: all 150ms ease-out;` (khusus `border-color`, `background-color`, `color`, `transform` — jangan transition `all` pada shadow karena shadow diminimalkan)
- Modal muncul: fade + scale kecil dari `0.98` → `1`, durasi `180ms`
- Tidak ada animasi berlebihan (bounce, elastic) — semua terasa cepat & presisi, sesuai gaya minimalis referensi

---

## 4. Fitur & Struktur Kategori Converter (mengacu ke gambar referensi ke-1)

Buat 2 kategori utama, ditampilkan sebagai 2 kolom/section di halaman utama:

### A. Video & Audio
- Video Converter
- Audio Converter
- MP3 Converter
- MP4 to MP3
- Video to MP3
- MP4 Converter
- MOV to MP4
- MP3 to OGG

### B. Image
- Image Converter
- WEBP to PNG
- JFIF to PNG
- PNG to SVG
- HEIC to JPG
- HEIC to PNG
- WEBP to JPG
- SVG Converter

Setiap item dalam list adalah **tombol/link** yang mengarah ke halaman converter spesifik (`/convert/:type`, contoh: `/convert/mp4-to-mp3`), dengan icon kecil di depan tiap kategori section (`Video & Audio` pakai icon play/video, `Image` pakai icon gambar).

---

## 5. Halaman & Alur (User Flow)

### Halaman 1 — Landing / Pilih Tools
- Dua kolom sesuai poin 4 (Video & Audio | Image)
- Search bar di atas untuk mencari jenis converter
- Klik salah satu item → buka halaman converter (atau modal upload)

### Halaman 2 — Upload & Convert (mengikuti style gambar ke-2, ke-4, ke-5)
Tampilkan sebagai **card/modal** besar berisi:
1. Judul modal (contoh: "Convert MP4 to MP3") + icon kategori + tombol close (X)
2. Dropzone / **Upload Box** dashed:
   - Icon cloud upload
   - Teks: "Choose a file or drag & drop it here."
   - Subteks: format & ukuran max yang didukung, contoh: "mp4, mov - Up to 50MB"
   - Tombol kecil "Browse files"
3. Setelah file terpilih → tampilkan **card preview file** (mirip card "Task Management App" di gambar ke-2):
   - Thumbnail kecil di kiri
   - Nama file & tipe/ukuran file
   - Icon edit (ganti file) & icon hapus (trash) di kanan
   - Bisa multiple file (list card ke bawah)
4. Pilihan format output (dropdown / pill button, contoh: PNG, JPG, WEBP)
5. Footer modal (mirip footer gambar ke-2):
   - Kiri: tombol sekunder "Download Data" (jadi "Download All" setelah convert selesai)
   - Kanan: tombol sekunder "Share" (opsional) + tombol utama solid hitam "Convert Now" (menggantikan "Save Folder")

### Halaman 3 — Progress & Hasil
- Progress bar per file saat proses convert (status: uploading → converting → done)
- Setelah selesai, card berubah menampilkan tombol "Download" per file + tombol "Download All (ZIP)"

### Komponen tambahan — Import/Batch (mengacu gambar ke-5)
- Modal kecil terpisah "Batch Convert" mirip pola "Add People":
  - Icon file besar di tengah (bukan CSV, tapi icon folder/zip)
  - Teks "Import Multiple Files" + subteks "Drop files or click here to choose"
  - Tombol solid full-width di bawah: "Preview" → lanjut ke halaman hasil

---

## 6. Struktur Folder Frontend (React + Vite + Tailwind)

```
src/
  assets/
  components/
    layout/
      Navbar.jsx
      PageContainer.jsx
    ui/
      Button.jsx
      Card.jsx
      Modal.jsx
      UploadBox.jsx
      FileItemCard.jsx
      ProgressBar.jsx
      Dropdown.jsx
    converter/
      ConverterCategoryList.jsx   // list dari gambar 1
      ConverterModal.jsx          // modal upload dari gambar 2/4
      FormatSelect.jsx
      ResultList.jsx
  pages/
    Home.jsx
    ConvertPage.jsx
  services/
    api.js         // axios instance ke JSON API
    converterApi.js
  hooks/
    useUpload.js
    useConvertJob.js
  App.jsx
  main.jsx
  index.css        // import font Poppins + tailwind
tailwind.config.js
```

---

## 7. Spesifikasi JSON API (Backend Express)

Base URL: `/api/v1`

### `GET /api/v1/tools`
Mengembalikan daftar kategori & tools converter (untuk render halaman 1 dari data, bukan hardcode).
```json
{
  "categories": [
    {
      "id": "video-audio",
      "label": "Video & Audio",
      "icon": "video",
      "tools": [
        { "id": "video-converter", "label": "Video Converter", "from": ["mp4","mov","avi"], "to": ["mp4","mov","mkv"] },
        { "id": "mp4-to-mp3", "label": "MP4 to MP3", "from": ["mp4"], "to": ["mp3"] }
      ]
    },
    {
      "id": "image",
      "label": "Image",
      "icon": "image",
      "tools": [
        { "id": "webp-to-png", "label": "WEBP to PNG", "from": ["webp"], "to": ["png"] },
        { "id": "heic-to-jpg", "label": "HEIC to JPG", "from": ["heic"], "to": ["jpg"] }
      ]
    }
  ]
}
```

### `POST /api/v1/convert`
Upload file (multipart/form-data) + target format → return job id.
- Body: `file`, `toolId`, `targetFormat`
- Response:
```json
{
  "success": true,
  "jobId": "job_8f21ab",
  "status": "processing",
  "fileName": "video.mp4"
}
```

### `GET /api/v1/convert/:jobId/status`
Polling status job.
```json
{
  "jobId": "job_8f21ab",
  "status": "done",
  "progress": 100,
  "downloadUrl": "/api/v1/convert/job_8f21ab/download"
}
```
Status enum: `queued | processing | done | failed`

### `GET /api/v1/convert/:jobId/download`
Stream file hasil convert (binary), atau redirect ke storage URL.

### `POST /api/v1/convert/batch`
Upload banyak file sekaligus (dipakai fitur "Import Multiple Files" di gambar 5).
- Response: array of `jobId`.

### Error format standar
```json
{
  "success": false,
  "error": {
    "code": "UNSUPPORTED_FORMAT",
    "message": "Format .xyz tidak didukung untuk konversi ini."
  }
}
```

---

## 8. Detail Implementasi Fungsional (wajib berfungsi, bukan sekadar UI)

1. **Drag & drop + klik browse** harus benar-benar bisa memilih file dari device.
2. **Validasi tipe file** sebelum upload sesuai `from` format tool yang dipilih; tampilkan error toast jika tidak sesuai.
3. **Progress upload** real (pakai axios `onUploadProgress`) ditampilkan di `ProgressBar`.
4. **Polling status** job convert tiap 1–2 detik sampai `status: done` atau `failed`.
5. **Multi-file**: setiap file jadi 1 card, punya progress & status masing-masing.
6. **Tombol hapus (trash icon)** pada card file: batalkan/keluarkan file dari antrean sebelum convert.
7. **Tombol edit (pencil icon)**: ganti file yang sudah dipilih tanpa reset form.
8. **Download All**: zip semua hasil convert (backend generate zip, frontend trigger download).
9. **Responsive**: layout tetap rapi di mobile (card upload full width, list kategori jadi 1 kolom).
10. **Loading state & empty state** yang jelas (skeleton/spinner saat fetch `/tools`).

---

## 9. Instruksi untuk AI Coding Assistant

> Bangun proyek ini sebagai 2 folder terpisah: `frontend/` (React + Vite + Tailwind) dan `backend/` (Express). Ikuti Design System di bagian 3 **secara presisi, bukan perkiraan** — pakai persis nilai spacing (grid 4px), radius, ukuran font, ukuran icon, ukuran card/input, dan warna yang tercantum di tabel 3.1–3.16. Definisikan semua token di atas sebagai CSS variables (`:root`) dan/atau `tailwind.config.js` (`theme.extend`), lalu pakai token tersebut di semua komponen — jangan hardcode angka baru di luar skala yang sudah ditentukan.
>
> **Minimalkan shadow secara ketat**: card, list item, dan tombol TIDAK memakai shadow sama sekali (cukup border 1px). Shadow hanya boleh dipakai pada modal dan dropdown/popover dengan nilai yang sudah ditentukan di 3.4.
>
> Implementasikan **semua hover, focus, active, disabled, dan error state** yang dijelaskan di setiap sub-bagian 3.7–3.13 (jangan hanya styling default). Gunakan transisi sesuai 3.16.
>
> Gunakan struktur folder di bagian 6. Implementasikan seluruh endpoint JSON API di bagian 7 agar fitur upload-convert-download benar-benar berfungsi end-to-end, bukan dummy/mock. Prioritaskan komponen reusable (`Card`, `Button`, `Modal`, `UploadBox`, `FileItemCard`, `IconButton`, `Chip`) agar bisa dipakai ulang di semua halaman converter, masing-masing menerima props varian/ukuran (`size`, `variant`) sesuai skala di bagian 3.
