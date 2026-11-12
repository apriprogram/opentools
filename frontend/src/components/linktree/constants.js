import { brandIcon, BRANDS } from './brandIcons';
import {
  Globe, Mail,
  Link2, ShoppingBag, ShoppingCart, Store, Utensils, Coffee, MapPin, Phone, Calendar, Clock, Star, Heart, Gift, Tag,
  Percent, CreditCard, Wallet, Camera, Image, Video, Music, Play, BookOpen, FileText, Download, Briefcase,
  GraduationCap, Home, User, Users, Send, Ticket, Truck, Package,
} from 'lucide-react';

export const MAX_ITEMS = 100;

// Pilihan ikon untuk tautan. Disimpan sebagai "preset:<id>". ID hanya huruf kecil, angka, dan tanda -.
export const LINK_ICONS = [
  { id: 'link', label: 'Tautan', icon: Link2 },
  { id: 'globe', label: 'Website', icon: Globe },
  { id: 'store', label: 'Toko', icon: Store },
  { id: 'shopping-bag', label: 'Belanja', icon: ShoppingBag },
  { id: 'shopping-cart', label: 'Keranjang', icon: ShoppingCart },
  { id: 'package', label: 'Paket', icon: Package },
  { id: 'truck', label: 'Pengiriman', icon: Truck },
  { id: 'tag', label: 'Harga', icon: Tag },
  { id: 'percent', label: 'Promo', icon: Percent },
  { id: 'gift', label: 'Hadiah', icon: Gift },
  { id: 'ticket', label: 'Tiket', icon: Ticket },
  { id: 'credit-card', label: 'Pembayaran', icon: CreditCard },
  { id: 'wallet', label: 'Dompet', icon: Wallet },
  { id: 'utensils', label: 'Makanan', icon: Utensils },
  { id: 'coffee', label: 'Minuman', icon: Coffee },
  { id: 'map-pin', label: 'Lokasi', icon: MapPin },
  { id: 'phone', label: 'Telepon', icon: Phone },
  { id: 'whatsapp', label: 'WhatsApp', icon: brandIcon('whatsapp') },
  { id: 'telegram', label: 'Telegram', icon: brandIcon('telegram') },
  { id: 'mail', label: 'Email', icon: Mail },
  { id: 'send', label: 'Kirim pesan', icon: Send },
  { id: 'calendar', label: 'Jadwal', icon: Calendar },
  { id: 'clock', label: 'Jam buka', icon: Clock },
  { id: 'star', label: 'Unggulan', icon: Star },
  { id: 'heart', label: 'Favorit', icon: Heart },
  { id: 'camera', label: 'Foto', icon: Camera },
  { id: 'image', label: 'Galeri', icon: Image },
  { id: 'video', label: 'Video', icon: Video },
  { id: 'play', label: 'Putar', icon: Play },
  { id: 'music', label: 'Musik', icon: Music },
  { id: 'book', label: 'Katalog', icon: BookOpen },
  { id: 'file', label: 'Dokumen', icon: FileText },
  { id: 'download', label: 'Unduh', icon: Download },
  { id: 'briefcase', label: 'Portofolio', icon: Briefcase },
  { id: 'school', label: 'Kursus', icon: GraduationCap },
  { id: 'home', label: 'Beranda', icon: Home },
  { id: 'user', label: 'Profil', icon: User },
  { id: 'users', label: 'Komunitas', icon: Users },
  { id: 'instagram', label: 'Instagram', icon: brandIcon('instagram') },
  { id: 'youtube', label: 'YouTube', icon: brandIcon('youtube') },
  { id: 'tiktok', label: 'TikTok', icon: brandIcon('tiktok') },
  { id: 'facebook', label: 'Facebook', icon: brandIcon('facebook') },
  { id: 'x', label: 'X', icon: brandIcon('x') },
  { id: 'threads', label: 'Threads', icon: brandIcon('threads') },
  { id: 'linkedin', label: 'LinkedIn', icon: brandIcon('linkedin') },
  { id: 'shopee', label: 'Shopee', icon: brandIcon('shopee') },
  { id: 'github', label: 'GitHub', icon: brandIcon('github') },
];
export const LINK_ICON_BY_ID = Object.fromEntries(LINK_ICONS.map((i) => [i.id, i]));
export const SLUG_RE = /^[a-z0-9][a-z0-9_-]{2,29}$/;

// Ikon sosial. Platform harus sama dengan daftar di server.
// Ikonnya memakai bentuk logo brand masing-masing; color adalah warna resmi brand (untuk gaya "warna brand").
const brand = (id) => ({ icon: brandIcon(id), color: BRANDS[id].color });
export const SOCIAL = [
  { id: 'website', label: 'Website', icon: Globe, color: null, placeholder: 'https://website-anda.com' },
  { id: 'instagram', label: 'Instagram', ...brand('instagram'), placeholder: 'https://instagram.com/akun' },
  { id: 'youtube', label: 'YouTube', ...brand('youtube'), placeholder: 'https://youtube.com/@akun' },
  { id: 'tiktok', label: 'TikTok', ...brand('tiktok'), placeholder: 'https://tiktok.com/@akun' },
  { id: 'facebook', label: 'Facebook', ...brand('facebook'), placeholder: 'https://facebook.com/akun' },
  { id: 'x', label: 'X (Twitter)', ...brand('x'), placeholder: 'https://x.com/akun' },
  { id: 'threads', label: 'Threads', ...brand('threads'), placeholder: 'https://threads.net/@akun' },
  { id: 'linkedin', label: 'LinkedIn', ...brand('linkedin'), placeholder: 'https://linkedin.com/in/akun' },
  { id: 'github', label: 'GitHub', ...brand('github'), placeholder: 'https://github.com/akun' },
  { id: 'whatsapp', label: 'WhatsApp', ...brand('whatsapp'), placeholder: 'https://wa.me/628xxxxxxxxxx' },
  { id: 'telegram', label: 'Telegram', ...brand('telegram'), placeholder: 'https://t.me/akun' },
  { id: 'shopee', label: 'Shopee', ...brand('shopee'), placeholder: 'https://shopee.co.id/toko' },
  { id: 'email', label: 'Email', icon: Mail, color: null, placeholder: 'nama@email.com' },
];
export const SOCIAL_BY_ID = Object.fromEntries(SOCIAL.map((s) => [s.id, s]));

// Gaya ikon sosial di halaman.
export const SOCIAL_STYLE_OPTIONS = [
  { id: 'outline', label: 'Garis lingkaran' },
  { id: 'plain', label: 'Tanpa lingkaran' },
  { id: 'fill', label: 'Latar' },
  { id: 'brand', label: 'Warna brand' },
  { id: 'liquid', label: 'Liquid glass' },
];

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
  { id: 'soft', label: 'Lembut' },
  { id: 'glass', label: 'Kaca' },
  { id: 'liquid', label: 'Liquid glass' },
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
  icon: null,
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
    icon: i.type === 'link' ? i.icon || null : null,
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
    icon: i.type === 'link' ? i.icon || null : null,
    enabled: i.enabled,
  })),
});

export const isDirty = (draft, saved) =>
  JSON.stringify({ ...draftPayload(draft), avatar: draft.avatar }) !==
  JSON.stringify({ ...draftPayload(toDraft(saved)), avatar: saved.avatar || null });
