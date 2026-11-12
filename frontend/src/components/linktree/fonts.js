// Pilihan huruf halaman Linktree. ID harus sama dengan daftar di server.
// google: nama keluarga huruf dan ketebalannya di Google Fonts. Poppins sudah dimuat situs, jadi tidak dimuat ulang.
export const FONTS = [
  { id: 'poppins', label: 'Poppins', note: 'Bawaan, bulat dan ramah', family: "'Poppins', sans-serif", google: null },
  { id: 'inter', label: 'Inter', note: 'Bersih dan netral', family: "'Inter', sans-serif", google: 'Inter:wght@400;500;600;700' },
  { id: 'jakarta', label: 'Plus Jakarta Sans', note: 'Modern, buatan Indonesia', family: "'Plus Jakarta Sans', sans-serif", google: 'Plus+Jakarta+Sans:wght@400;500;600;700' },
  { id: 'montserrat', label: 'Montserrat', note: 'Tegas dan lebar', family: "'Montserrat', sans-serif", google: 'Montserrat:wght@400;500;600;700' },
  { id: 'outfit', label: 'Outfit', note: 'Geometris dan ringan', family: "'Outfit', sans-serif", google: 'Outfit:wght@400;500;600;700' },
  { id: 'nunito', label: 'Nunito', note: 'Membulat dan santai', family: "'Nunito', sans-serif", google: 'Nunito:wght@400;600;700' },
  { id: 'space', label: 'Space Grotesk', note: 'Teknologi dan unik', family: "'Space Grotesk', sans-serif", google: 'Space+Grotesk:wght@400;500;600;700' },
  { id: 'playfair', label: 'Playfair Display', note: 'Elegan, bergaya majalah', family: "'Playfair Display', serif", google: 'Playfair+Display:wght@400;500;600;700' },
  { id: 'bebas', label: 'Bebas Neue', note: 'Kapital tebal, mencolok', family: "'Bebas Neue', sans-serif", google: 'Bebas+Neue' },
  { id: 'caveat', label: 'Caveat', note: 'Tulisan tangan', family: "'Caveat', cursive", google: 'Caveat:wght@400;500;600;700' },
];
export const FONT_BY_ID = Object.fromEntries(FONTS.map((f) => [f.id, f]));

export const fontFamily = (id) => (FONT_BY_ID[id] || FONT_BY_ID.poppins).family;

// Muat huruf dari Google Fonts sekali saja per huruf.
export function loadFont(id) {
  const font = FONT_BY_ID[id];
  if (!font || !font.google || typeof document === 'undefined') return;
  const linkId = `lt-font-${font.id}`;
  if (document.getElementById(linkId)) return;
  const link = document.createElement('link');
  link.id = linkId;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${font.google}&display=swap`;
  document.head.appendChild(link);
}
