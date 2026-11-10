# OpenTools Design System & Guidelines

Dokumen ini memuat panduan gaya desain (Design System) yang digunakan pada website OpenTools. Desain ini mengedepankan prinsip **Minimalis, Flat, dan Modern**, dengan meminimalkan penggunaan shadow (bayangan) dan lebih mengandalkan garis tepi (border) serta transisi halus (smooth transition).

---

## 1. Filosofi Desain (Design Philosophy)

1. **Flat & Border-Driven:** Hindari penggunaan `box-shadow` tebal. Kedalaman (depth) antar elemen diciptakan melalui hierarki warna latar (background) dan penggunaan garis batas (border) yang tipis dan tegas.
2. **Minimalis & Bersih:** Ruang kosong (white space) adalah elemen desain. Margin dan padding yang konsisten membuat tampilan lebih lega.
3. **Fokus pada Konten:** Pengguna datang untuk mengkonversi/mengompres file. UI tidak boleh mendistraksi dari fungsi utama.
4. **Responsif & Smooth:** Interaksi seperti hover dan klik harus memberikan _feedback_ instan dengan animasi yang mulus (`transition-all`).

---

## 2. Palet Warna (Color Palette)

Aplikasi mendukung Mode Terang (Light) dan Mode Gelap (Dark). Warna diatur melalui CSS Variables di `index.css` dan dikonfigurasi pada `tailwind.config.js`.

### Tema Terang (Light Mode)
- **Background Page (`bg-page`):** `#EDEDEF` (Abu-abu sangat terang, memberikan kesan bersih namun tidak menyilaukan).
- **Background Card (`bg-card`):** `#FFFFFF` (Putih murni untuk memisahkan area konten utama dari background halaman).
- **Background Card Muted (`bg-card-muted`):** `#F7F7F8` (Untuk elemen sekunder di dalam card).
- **Border Default (`border-border`):** `#E4E4E7` (Garis tepi sangat tipis dan halus).
- **Border Hover (`border-hover`):** `#C9C9CE` (Garis tepi saat kursor berada di atas elemen).
- **Border Focus (`border-focus`):** `#1A1A1E` (Garis tepi saat elemen sedang aktif / difokuskan).
- **Text Primary (`text-primary`):** `#121214` (Hampir hitam pekat, untuk judul dan teks utama).
- **Text Secondary (`text-secondary`):** `#8A8A93` (Abu-abu sedang, untuk deksripsi dan teks bantuan).
- **Text Tertiary (`text-tertiary`):** `#B4B4BA` (Teks yang kurang penting/disabled).
- **Aksen Hitam (`bg-accent-black`):** `#18181B` (Digunakan untuk tombol primer).
- **Biru (Highlight/Ring):** Warna `blue-500` bawaan Tailwind digunakan khusus untuk outline/ring saat card atau tombol di-hover.

### Tema Gelap (Dark Mode)
- **Background Page:** `#09090b` (Hitam pekat).
- **Background Card:** `#18181b` (Abu-abu sangat gelap).
- **Border Default:** `#3f3f46`.
- **Text Primary:** `#fafafa`.

---

## 3. Tipografi (Typography)

- **Font Utama:** `Poppins`, sans-serif.
- **Font Khusus Heading (Hero):** `'Special Gothic Expanded One', sans-serif` (Digunakan secara khusus pada teks promosi utama untuk memberikan kesan tebal dan unik).
- **Base Size:** Ukuran dasar font body adalah `13px` dengan `line-height: 20px`. Ini membuat tampilan teks lebih ringkas, presisi, dan modern seperti gaya UI dashboard/aplikasi native.
- **Heading 1 (h1):** `24px` (Bold - font-weight: 600).
- **Heading 2 (h2):** `18px` (Bold - font-weight: 600).

---

## 4. Layout & Grid (Tata Letak)

- **Container Utama:** Menggunakan `max-w-5xl` (sekitas 1024px) yang berada di tengah (`mx-auto`).
- **Jarak (Spacing):** Memanfaatkan _padding_ dan _margin_ dari Tailwind (`p-4`, `m-4`, `gap-4`). Skala spacing Tailwind standar di-extend untuk kepresisian:
  - `1`: 4px | `2`: 8px | `3`: 12px | `4`: 16px | `5`: 20px | `6`: 24px | `8`: 32px
- **Struktur Grid:** Menggunakan CSS Grid (`grid-cols-12`) untuk halaman beranda. Card horizontal menempati 8 kolom (`col-span-8`), sedangkan card vertikal menempati 4 kolom (`col-span-4`).

---

## 5. Komponen Utama (Core Components)

### A. Card (Kartu)
- **Bentuk:** Sudut sangat melengkung (`rounded-2xl` / 16px).
- **Batas (Border):** Wajib menggunakan `border border-border`.
- **Shadow:** **TANPA SHADOW**. Hindari shadow untuk desain flat.
- **Hover State:** Saat di-hover, card tidak menggunakan shadow melayang, melainkan warna border berubah menjadi biru menyala dengan efek ring tunggal: `hover:border-blue-500` dipadukan dengan `transition-all duration-200`.

### B. Navigation Bar (Navbar Top)
- **Gaya:** Menyatu dengan halaman tanpa shadow (`shadow-none`), memiliki border tipis di bagian bawah `border-b border-border` jika diperlukan pemisah.
- **Background:** Tembus pandang (transparan) atau putih bersih (`bg-card`).

### C. Bottom Navigation Widget (Menu Melayang)
- **Posisi:** `fixed bottom-6 left-1/2 -translate-x-1/2` (Melayang di tengah bawah).
- **Desain:** Bentuk kapsul (`rounded-full`), memiliki background blur (`backdrop-blur-md` / kaca / _glassmorphism_) dengan warna transparan (`bg-card/90` atau putih transparan).
- **Ukuran:** Sengaja dibuat kecil dan kompak (ketinggian sekitar `56px` / `h-14`) agar tidak menutupi konten utama.
- **Border:** `border border-border`.
- **Ikon Menu:** Ukuran kecil (`18px`) dengan ketebalan (stroke) `1.5` hingga `2`. Label teks sangat kecil (`text-[10px]`) atau disembunyikan jika tidak aktif.

### D. Button (Tombol)
- **Primary Button:** Background sangat gelap (`bg-accent-black`), text putih, sudut `rounded-xl` atau `rounded-full`.
- **Secondary/Outline Button:** Background transparan, `border border-border`, text `text-primary`.
- **Hover:** Efek perubahan opacity atau pergeseran warna tipis (`hover:bg-accent-black-hover`). Wajib menggunakan `outline-none focus:outline-none`.

### E. Badge / Label
- Digunakan untuk menandakan status ("NEW", "Video", dsb).
- Berbentuk kapsul memanjang (`rounded-full`) dengan padding horizontal yang cukup.
- **Badge Animasi:** Untuk teks "NEW" atau "Coming Soon", gunakan efek `animate-pulse` dari Tailwind untuk menarik perhatian pengguna tanpa harus menggunakan warna yang terlalu mencolok.

---

## 6. Ikonografi (Iconography)

- **Library:** Menggunakan pustaka [Lucide React](https://lucide.dev/).
- **Gaya:** Minimalis berupa garis (line icons). Jangan menggunakan icon block / filled kecuali sangat terpaksa.
- **Ukuran Standar:** `size={16}` atau `size={18}`.
- **Ketebalan (Stroke Width):** Standar `1.5` hingga `1.75`.

---

## 7. Animasi & Transisi (Animations)

- Hindari animasi yang berat atau terlalu mencolok.
- **Transisi Dasar:** Gunakan kelas `transition-all duration-200 ease-out` pada interaksi hover (tombol, card, ikon).
- **Pulse:** Gunakan `animate-pulse` pada elemen kecil yang membutuhkan fokus (seperti dot indikator online atau badge NEW).
- Pustaka tambahan: `tailwindcss-animate` digunakan untuk animasi *fade-in*, *slide-up*, dan efek transisi antar halaman (jika ditambahkan).

---

## 8. Aturan Larangan Keras (Strict Guidelines)

1. **JANGAN gunakan shadow besar/tebal** seperti `shadow-lg` atau `shadow-2xl`. Jika terpaksa (seperti pada dropdown atau modal), gunakan custom shadow yang sangat subtil: `boxShadow: '0 4px 16px rgba(17, 17, 20, 0.06)'`.
2. **JANGAN gunakan gradasi warna pelangi.** Gradasi hanya diizinkan untuk efek pantulan transparan (misal `from-transparent to-card/70`) pada tumpukan gambar.
3. **JANGAN gunakan outline ganda (double ring) saat hover.** Cukup ganti warna border (misal ke `border-blue-500`) tanpa menambahkan ring tambahan jika berpotensi membuat tampilan border terlihat menumpuk (seperti error "dua outline biru").
4. **HINDARI padding/margin berlebihan pada mode mobile.** Desain harus ringkas agar tetap bisa dilihat seluruhnya di layar HP kecil.
