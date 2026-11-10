import { Globe, Instagram, Youtube, Music2, Facebook, Twitter, Linkedin, Github, MessageCircle, Mail } from 'lucide-react';

export const MAX_ITEMS = 100;
export const SLUG_RE = /^[a-z0-9][a-z0-9_-]{2,29}$/;

// Ikon sosial. Platform harus sama dengan daftar di server.
export const SOCIAL = [
  { id: 'website', label: 'Website', icon: Globe, placeholder: 'https://website-anda.com' },
  { id: 'instagram', label: 'Instagram', icon: Instagram, placeholder: 'https://instagram.com/akun' },
  { id: 'youtube', label: 'YouTube', icon: Youtube, placeholder: 'https://youtube.com/@akun' },
  { id: 'tiktok', label: 'TikTok', icon: Music2, placeholder: 'https://tiktok.com/@akun' },
  { id: 'facebook', label: 'Facebook', icon: Facebook, placeholder: 'https://facebook.com/akun' },
  { id: 'x', label: 'X (Twitter)', icon: Twitter, placeholder: 'https://x.com/akun' },
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin, placeholder: 'https://linkedin.com/in/akun' },
  { id: 'github', label: 'GitHub', icon: Github, placeholder: 'https://github.com/akun' },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, placeholder: 'https://wa.me/628xxxxxxxxxx' },
  { id: 'email', label: 'Email', icon: Mail, placeholder: 'nama@email.com' },
];
export const SOCIAL_BY_ID = Object.fromEntries(SOCIAL.map((s) => [s.id, s]));

// Tema siap pakai. Semuanya gratis.
export const THEME_PRESETS = [
  {
    id: 'putih',
    label: 'Putih',
    theme: {
      bg: { type: 'color', color: '#FFFFFF', color2: '#E0E7FF' },
      text: '#111111',
      button: { style: 'fill', radius: 'pill', color: '#111111', textColor: '#FFFFFF' },
    },
  },
  {
    id: 'gelap',
    label: 'Gelap',
    theme: {
      bg: { type: 'color', color: '#0B0B0F', color2: '#1F2937' },
      text: '#FAFAFA',
      button: { style: 'fill', radius: 'pill', color: '#FFFFFF', textColor: '#0B0B0F' },
    },
  },
  {
    id: 'senja',
    label: 'Senja',
    theme: {
      bg: { type: 'gradient', color: '#F97316', color2: '#EC4899' },
      text: '#FFFFFF',
      button: { style: 'outline', radius: 'pill', color: '#FFFFFF', textColor: '#FFFFFF' },
    },
  },
  {
    id: 'laut',
    label: 'Laut',
    theme: {
      bg: { type: 'gradient', color: '#0EA5E9', color2: '#1E3A8A' },
      text: '#FFFFFF',
      button: { style: 'fill', radius: 'rounded', color: '#FFFFFF', textColor: '#1E3A8A' },
    },
  },
  {
    id: 'hutan',
    label: 'Hutan',
    theme: {
      bg: { type: 'gradient', color: '#14532D', color2: '#84CC16' },
      text: '#FFFFFF',
      button: { style: 'shadow', radius: 'rounded', color: '#FFFFFF', textColor: '#14532D' },
    },
  },
  {
    id: 'pastel',
    label: 'Pastel',
    theme: {
      bg: { type: 'gradient', color: '#FDE2E4', color2: '#E2ECE9' },
      text: '#1F2937',
      button: { style: 'shadow', radius: 'pill', color: '#FFFFFF', textColor: '#1F2937' },
    },
  },
];

export const BUTTON_STYLE_OPTIONS = [
  { id: 'fill', label: 'Solid' },
  { id: 'outline', label: 'Garis' },
  { id: 'shadow', label: 'Bayangan' },
];

export const BUTTON_RADIUS_OPTIONS = [
  { id: 'pill', label: 'Bulat' },
  { id: 'rounded', label: 'Sedang' },
  { id: 'square', label: 'Kotak' },
];

// Alamat dari judul: huruf kecil, angka, dan tanda - saja.
export const slugify = (text) =>
  String(text || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30);

// ID item di browser. Server memberi ID baru untuk item yang belum tersimpan.
export const newId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const newItem = (type) => ({
  id: newId(),
  type,
  title: type === 'header' ? 'Header baru' : type === 'link' ? 'Tautan baru' : '',
  url: '',
  platform: type === 'social' ? 'instagram' : null,
  enabled: true,
});

// Salinan editable dari Linktree yang tersimpan di server.
export const toDraft = (tree) => ({
  title: tree.title,
  bio: tree.bio || '',
  slug: tree.slug,
  published: Boolean(tree.published),
  theme: tree.theme,
  avatar: tree.avatar || null,
  items: (tree.items || []).map((i) => ({
    id: i.id,
    type: i.type,
    title: i.title || '',
    url: i.url || '',
    platform: i.platform || null,
    enabled: i.enabled !== false,
  })),
});

// Isi yang dikirim ke server saat menyimpan. Foto dikirim terpisah hanya bila berubah.
export const draftPayload = (draft) => ({
  title: draft.title.trim(),
  bio: draft.bio,
  slug: draft.slug,
  published: draft.published,
  theme: draft.theme,
  items: draft.items.map((i) => ({
    id: i.id,
    type: i.type,
    title: i.title,
    url: i.url,
    platform: i.platform,
    enabled: i.enabled,
  })),
});

export const isDirty = (draft, saved) =>
  JSON.stringify({ ...draftPayload(draft), avatar: draft.avatar }) !==
  JSON.stringify({ ...draftPayload(toDraft(saved)), avatar: saved.avatar || null });
