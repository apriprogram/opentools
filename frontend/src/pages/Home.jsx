import React from 'react';
import { ArrowRight, Shield, ArrowLeftRight, Minimize2, ImagePlus, Link2, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageContainer from '../components/layout/PageContainer';
import Button from '../components/ui/Button';

/* ── Vertical card (image top, content bottom) ─────────────────────────── */
function VerticalCard({ tool }) {
  const Icon = tool.icon;
  return (
    <Link
      to={tool.to}
      className={`group flex flex-col bg-card border border-border ${tool.ring} rounded-2xl overflow-hidden transition-all duration-200 outline-none focus:outline-none h-full`}
    >
      {/* Image */}
      <div className="relative w-full h-48 shrink-0 overflow-hidden">
        <img
          src={tool.img}
          alt={tool.label}
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent from-50% to-card/70 pointer-events-none" />
        {tool.isNew && (
          <span className="absolute top-3 left-3 z-10 text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-md bg-rose-500 text-white shadow-sm animate-pulse">
            NEW
          </span>
        )}
        <span className={`absolute top-3 right-3 z-10 text-[11px] font-medium px-2.5 py-1 rounded-full border backdrop-blur-sm ${tool.badgeBg} ${tool.comingSoon ? 'animate-pulse' : ''}`}>
          {tool.badge}
        </span>
      </div>
      {/* Content */}
      <div className="flex flex-col gap-3 p-5 flex-1 relative z-10">
        <div className={`w-9 h-9 rounded-xl ${tool.iconBg} flex items-center justify-center shrink-0`}>
          <Icon size={17} strokeWidth={1.75} />
        </div>
        <div className="flex-1">
          <h2 className="text-[17px] font-bold text-primary tracking-tight leading-snug whitespace-pre-line">
            {tool.title}
          </h2>
          <p className="text-[12px] text-secondary leading-relaxed mt-1.5">{tool.desc}</p>
        </div>
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex flex-wrap gap-1.5">
            {tool.chips.map(c => (
              <span key={c} className={`text-[11px] px-2 py-0.5 rounded-md border ${tool.chipColor}`}>{c}</span>
            ))}
          </div>
          <div className={`w-7 h-7 rounded-full border flex items-center justify-center ${tool.arrowColor} opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0`}>
            <ArrowRight size={13} />
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ── Horizontal card (content left, image right) ────────────────────────── */
function HorizontalCard({ tool }) {
  const Icon = tool.icon;
  return (
    <Link
      to={tool.to}
      className={`group flex flex-row bg-card border border-border ${tool.ring} rounded-2xl overflow-hidden transition-all duration-200 outline-none focus:outline-none h-full`}
    >
      {/* Content — left */}
      <div className="flex flex-col justify-between gap-3 p-6 flex-1 min-w-0 relative z-10">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl ${tool.iconBg} flex items-center justify-center shrink-0`}>
            <Icon size={17} strokeWidth={1.75} />
          </div>
          {tool.isNew && (
            <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-md bg-rose-500 text-white shadow-sm animate-pulse">
              NEW
            </span>
          )}
          <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full border ${tool.badgeBg} ${tool.comingSoon ? 'animate-pulse' : ''}`}>
            {tool.badge}
          </span>
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <h2 className="text-[20px] font-bold text-primary tracking-tight leading-snug whitespace-pre-line">
            {tool.title}
          </h2>
          <p className="text-[12px] text-secondary leading-relaxed mt-2">{tool.desc}</p>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            {tool.chips.map(c => (
              <span key={c} className={`text-[11px] px-2 py-0.5 rounded-md border ${tool.chipColor}`}>{c}</span>
            ))}
          </div>
          <div className={`w-7 h-7 rounded-full border flex items-center justify-center ${tool.arrowColor} opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0`}>
            <ArrowRight size={13} />
          </div>
        </div>
      </div>

      {/* Image — right */}
      <div className="relative w-[42%] shrink-0 overflow-hidden">
        <img
          src={tool.img}
          alt={tool.label}
          className="w-full h-full object-cover object-center"
        />
        {/* Gradient fade from left */}
        <div className="absolute inset-0 bg-gradient-to-r from-card/60 via-transparent to-transparent pointer-events-none" />
      </div>
    </Link>
  );
}

/* ── Data ─────────────────────────────────────────────────────────────────── */

export default function Home() {
  const { t } = useTranslation();

  const convert = {
    id: 'convert', to: '/converters', label: 'Konverter',
    badge: 'Video · Audio · Gambar',
    title: t('home.convert_title', 'Konversi File\nInstant'),
    desc: t('home.convert_desc', 'Ubah format video, audio, dan gambar dalam hitungan detik. Tanpa watermark, tanpa biaya.'),
    icon: ArrowLeftRight, img: '/images/tools/fitur1.png',
    chips: ['MP4', 'MP3', 'WebP', 'PDF'],
    ring: 'hover:border-blue-500',
    badgeBg: 'bg-secondary/10 text-primary border-border',
    iconBg: 'bg-secondary/10 text-primary',
    chipColor: 'bg-secondary/10 text-primary border-border',
    arrowColor: 'text-primary border-border',
  };

  const compress = {
    id: 'compress', to: '/compressors', label: 'Kompresor',
    badge: 'Kurangi Ukuran',
    title: t('home.compress_title', 'Kompres\nTanpa Rugi Kualitas'),
    desc: t('home.compress_desc', 'Perkecil ukuran file untuk web dan penyimpanan tanpa kehilangan kualitas.'),
    icon: Minimize2, img: '/images/tools/fitur2.png',
    chips: ['−80%', 'Cepat', 'Lossless'],
    ring: 'hover:border-blue-500',
    badgeBg: 'bg-secondary/10 text-primary border-border',
    iconBg: 'bg-secondary/10 text-primary',
    chipColor: 'bg-secondary/10 text-primary border-border',
    arrowColor: 'text-primary border-border',
  };

  const twibbon = {
    id: 'twibbon', to: '/campaigns', label: 'Twibbon',
    badge: 'Frame Maker',
    title: t('home.twibbon_title', 'Buat Frame\nTwibbon Kamu'),
    desc: t('home.twibbon_desc', 'Frame kustom, preview campaign, dan bagikan ke komunitas dengan mudah.'),
    icon: ImagePlus, img: '/images/tools/fitur3.png',
    chips: ['Frame', 'Campaign', 'Share'],
    ring: 'hover:border-blue-500',
    badgeBg: 'bg-secondary/10 text-primary border-border',
    iconBg: 'bg-secondary/10 text-primary',
    chipColor: 'bg-secondary/10 text-primary border-border',
    arrowColor: 'text-primary border-border',
    isNew: true,
  };

  const linktree = {
    id: 'linktree', to: '/linktree', label: 'Linktree',
    badge: 'Coming Soon',
    title: t('home.linktree_title', 'Linktree\nBuilder'),
    desc: t('home.linktree_desc', 'Halaman bio link personal yang elegan untuk semua platform sosial mediamu.'),
    icon: Link2, img: '/images/tools/fitur4.png',
    chips: ['Bio', 'Social', 'QR Code'],
    ring: 'hover:border-blue-500',
    badgeBg: 'bg-secondary/10 text-primary border-border',
    iconBg: 'bg-secondary/10 text-primary',
    chipColor: 'bg-secondary/10 text-primary border-border',
    arrowColor: 'text-primary border-border',
    comingSoon: true,
  };

  return (
    <PageContainer>

      {/* ── Hero ── */}
      <section className="mb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-border">
          <div>

            <h1 className="text-[28px] sm:text-[34px] font-bold text-primary tracking-tight leading-[1.2]" style={{ fontFamily: "'Special Gothic Expanded One', sans-serif" }}>
              {t('home.hero_title2', 'Semua Tools yang Kamu')}<br />
              <span className="text-blue-500">{t('home.hero_title3', 'Butuhkan')}</span>{t('home.hero_title4', ', dalam Satu Tempat')} <span className="text-blue-500">{t('home.hero_title5', 'GRATIS!')}</span>
            </h1>
            <p className="text-[14px] text-secondary leading-relaxed max-w-[480px] mt-2">
              {t('home.hero_desc2', 'Konversi, kompres, buat twibbon, hingga bio link — gratis, cepat, dan tanpa iklan.')}
            </p>
          </div>
          <div className="shrink-0">
            <Link to="/batch">
              <Button variant="primary" size="md" icon={Sparkles}>Batch Convert</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Tools Grid ── */}
      {/*
        Layout:
          Row 1: [Konversi — horizontal wide col-8] [Kompres — vertical col-4]
          Row 2: [Twibbon  — vertical col-4]         [Linktree — horizontal wide col-8]
      */}
      <section className="mb-12">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-12 gap-4">

            {/* Row 1 — Konversi (lebar, horizontal) */}
            <div className="col-span-12 md:col-span-8 min-h-[220px]">
              <HorizontalCard tool={convert} />
            </div>

            {/* Row 1 — Kompres (normal, vertikal) */}
            <div className="col-span-12 md:col-span-4 min-h-[220px]">
              <VerticalCard tool={compress} />
            </div>

            {/* Row 2 — Twibbon (normal, vertikal) */}
            <div className="col-span-12 md:col-span-4 min-h-[220px]">
              <VerticalCard tool={twibbon} />
            </div>

            {/* Row 2 — Linktree (lebar, horizontal) */}
            <div className="col-span-12 md:col-span-8 min-h-[220px]">
              <HorizontalCard tool={linktree} />
            </div>

          </div>
        </div>
      </section>

    </PageContainer>
  );
}
