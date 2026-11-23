import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Terjemahan dibagi per fitur supaya rapi: locales/<bahasa>/<nama>.json.
// File translation.json berisi teks umum; file lain (misalnya tools.json, qr.json) berisi teks satu fitur.
// Semua file satu bahasa digabung menjadi satu kamus "translation", jadi kuncinya tetap dipanggil
// seperti biasa: t('qr.title'), t('tools.word-to-pdf.label'), dan seterusnya.
const files = import.meta.glob('./locales/*/*.json', { eager: true });

const resources = {};
for (const [path, mod] of Object.entries(files)) {
  const lng = path.split('/')[2];
  resources[lng] ||= { translation: {} };
  Object.assign(resources[lng].translation, mod.default || mod);
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('i18nextLng') || 'id',
    fallbackLng: 'id',
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  });

// Atribut lang di <html> mengikuti bahasa aktif (dipakai pembaca layar dan terjemahan otomatis browser).
const syncLang = (lng) => document.documentElement.setAttribute('lang', lng?.startsWith('en') ? 'en' : 'id');
syncLang(i18n.language);
i18n.on('languageChanged', syncLang);

export default i18n;
