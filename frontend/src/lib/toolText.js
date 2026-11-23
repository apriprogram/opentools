// Nama dan deskripsi alat konverter/kompresor dalam bahasa aktif.
// Server mengirim nama dan deskripsi berbahasa Inggris; terjemahannya ada di locales/<bahasa>/tools.json
// dengan kunci tools.<id alat>.label / .description dan toolCategories.<id kategori>.
// Bila terjemahan belum ada, teks dari server dipakai apa adanya.
export const toolLabel = (t, tool) => (tool ? t(`tools.${tool.id}.label`, { defaultValue: tool.label }) : '');
export const toolDescription = (t, tool) => (tool ? t(`tools.${tool.id}.description`, { defaultValue: tool.description || '' }) : '');
export const categoryLabel = (t, category) => (category ? t(`toolCategories.${category.id}.label`, { defaultValue: category.label }) : '');
export const categoryDescription = (t, category) =>
  category ? t(`toolCategories.${category.id}.description`, { defaultValue: category.description || '' }) : '';
