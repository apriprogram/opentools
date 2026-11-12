import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeftRight, BarChart2, Check, ImagePlus, Layers, Link2, Minimize2, QrCode } from 'lucide-react';
import PageContainer from '../components/layout/PageContainer';
import FeatureCard from '../components/home/FeatureCard';
import { SearchBox, SearchResults, searchTools, useToolIndex } from '../components/home/ToolSearch';
import {
  IllusBatch,
  IllusCompress,
  IllusConvert,
  IllusLinktree,
  IllusQr,
  IllusStats,
  IllusTwibbon,
} from '../components/home/HomeIllustrations';

// Pintasan fitur di hero. Di ponsel berupa grid 3 kolom setinggi 28px dengan area sentuh 44px (lewat ::after).
const PILL =
  'relative flex h-7 w-full min-w-0 items-center justify-center gap-1 rounded-full border px-2 text-[11px] font-medium leading-none transition-all duration-200 ease-out after:absolute after:inset-x-0 after:-inset-y-2 sm:h-8 sm:text-[12px] sm:after:-inset-y-1.5 md:h-9 md:w-auto md:gap-1.5 md:px-3.5 md:text-[13px] md:after:-inset-y-1';
const PILL_OUTLINE = 'glass text-primary hover:bg-white dark:hover:bg-white/15';
const PILL_FILLED =
  'border-transparent bg-accent-black text-card shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_8px_20px_-12px_rgba(15,23,42,0.55)] hover:bg-accent-black-hover';

const SPAN_HALF = 'col-span-12 sm:col-span-6 lg:col-span-4';

export default function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [searchUsed, setSearchUsed] = useState(false);

  const facts = [
    t('home.fact_no_ads', 'Tanpa iklan'),
    t('home.fact_no_watermark', 'Tanpa watermark'),
    t('home.fact_auto_delete', 'File konversi terhapus otomatis setelah 5 menit'),
  ];

  const shortcuts = [
    { to: '/converters', icon: ArrowLeftRight, label: t('home.job_convert', 'Konversi'), filled: true },
    { to: '/compressors', icon: Minimize2, label: t('home.job_compress', 'Kompres') },
    { to: '/campaigns', icon: ImagePlus, label: t('home.job_twibbon', 'Twibbon') },
    { to: '/qr', icon: QrCode, label: t('home.job_qr', 'QR code') },
    { to: '/linktree', icon: Link2, label: t('home.job_linktree', 'Link bio') },
    { to: '/batch', icon: Layers, label: t('home.job_batch', 'Massal') },
  ];

  // Urutan di sini = urutan tampil di semua ukuran layar.
  const cards = [
    {
      id: 'home-convert',
      to: '/converters',
      span: 'col-span-12 lg:col-span-8',
      variant: 'wideSm',
      tone: 'dusk',
      icon: ArrowLeftRight,
      title: t('home.converters_title', 'Konverter File'),
      desc: t('home.card_convert_desc', 'Ubah format video, audio, dan gambar. Misalnya MP4 ke MP3 atau HEIC ke JPG.'),
      chips: ['Video', 'Audio', t('home.chip_image', 'Gambar'), 'GIF'],
      art: <IllusConvert />,
    },
    {
      id: 'home-compress',
      to: '/compressors',
      span: SPAN_HALF,
      tone: 'blue',
      icon: Minimize2,
      title: t('home.compressors_title', 'Kompresor File'),
      desc: t('home.card_compress_desc', 'Perkecil ukuran video, gambar, audio, dan GIF biar gampang dikirim.'),
      chips: ['MP4', 'JPG', 'PNG', 'MP3'],
      art: <IllusCompress />,
    },
    {
      id: 'home-twibbon',
      to: '/campaigns',
      span: SPAN_HALF,
      tone: 'magenta',
      icon: ImagePlus,
      title: 'Twibbon',
      desc: t('home.card_twibbon_desc', 'Unggah frame PNG, bagikan link-nya, dan siapa pun bisa pasang fotonya.'),
      chips: [
        t('home.chip_png_frame', 'Frame PNG'),
        t('home.chip_campaign_link', 'Link campaign'),
        t('home.chip_download_photo', 'Unduh foto'),
      ],
      art: <IllusTwibbon />,
    },
    {
      id: 'home-qr',
      to: '/qr',
      span: SPAN_HALF,
      tone: 'graphite',
      icon: QrCode,
      title: 'QR Generator',
      desc: t('home.card_qr_desc', 'Ubah link jadi QR code. Gratis dengan logo, Premium bisa ganti warna dan tanpa logo.'),
      chips: [t('home.chip_free', 'Gratis'), 'PNG & SVG', 'Premium per QR'],
      art: <IllusQr />,
    },
    {
      id: 'home-linktree',
      to: '/linktree',
      span: SPAN_HALF,
      tone: 'green',
      icon: Link2,
      title: 'Linktree',
      desc: t('home.card_linktree_desc', 'Satu halaman buat semua link kamu. Gratis, cukup daftar akun, dan bisa bikin banyak.'),
      chips: [
        t('home.chip_free', 'Gratis'),
        t('home.chip_themes', 'Tema & warna'),
        t('home.chip_click_stats', 'Statistik klik'),
      ],
      art: <IllusLinktree />,
    },
    {
      id: 'home-batch',
      to: '/batch',
      span: 'col-span-12 sm:col-span-6 lg:col-span-8',
      variant: 'wideLg',
      tone: 'slate',
      icon: Layers,
      title: t('home.batch_convert', 'Konversi Massal'),
      desc: t('home.card_batch_desc', 'Konversi sampai 20 file sekaligus ke satu format, lalu unduh sebagai ZIP.'),
      chips: [
        t('home.chip_max_files', 'Maks. 20 file'),
        t('home.chip_one_format', 'Satu format'),
        t('home.chip_zip', 'Unduh ZIP'),
      ],
      art: <IllusBatch />,
    },
    {
      id: 'home-stats',
      to: '/overview',
      span: SPAN_HALF,
      tone: 'violet',
      icon: BarChart2,
      title: t('home.card_stats_title', 'Statistik'),
      desc: t('home.card_stats_desc', 'Lihat jumlah pengunjung, file yang diproses, dan fitur terpopuler secara realtime.'),
      chips: ['Realtime', t('home.chip_visitors', 'Pengunjung'), t('home.chip_files_processed', 'File diproses')],
      art: <IllusStats />,
    },
  ];

  // Pencarian mencakup tujuh fitur di bawah, ditambah semua konverter dan kompresor.
  const index = useToolIndex(cards, searchUsed);
  const searching = query.trim().length > 0;
  const results = searching ? searchTools(index.items, query) : [];

  return (
    <PageContainer>
      <div className="mx-auto w-full max-w-5xl">
        {/* ── Hero: judul, tiga fakta, dan pintasan fitur ── */}
        <section className="mb-4 sm:mb-7">
          <div className="lg:flex lg:items-end lg:justify-between lg:gap-8">
            <h1
              className="min-w-0 max-w-[640px] text-balance text-[27px] font-light leading-[1.12] tracking-[-0.03em] text-primary sm:text-[38px] lg:text-[46px]"
            >
              {t('home.hero_h1_a', 'Semua tools yang kamu butuhkan,')}{' '}
              <span className="font-medium text-blue-500">{t('home.hero_h1_b', 'gratis.')}</span>
            </h1>

            <ul role="list" className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 lg:mt-0 lg:shrink-0 lg:flex-col">
              {facts.map((fact) => (
                <li
                  key={fact}
                  className="flex items-start gap-1 text-[11px] font-medium leading-4 text-primary sm:gap-1.5 sm:text-[13px] sm:leading-5"
                >
                  <Check size={16} strokeWidth={1.75} className="mt-px shrink-0 max-sm:h-3.5 max-sm:w-3.5" aria-hidden="true" />
                  {fact}
                </li>
              ))}
            </ul>
          </div>

          <nav aria-label={t('home.shortcuts_label', 'Pintasan fitur')} className="mt-4 sm:mt-5">
            <ul
              role="list"
              className="grid grid-cols-3 gap-x-1.5 gap-y-2 sm:max-w-[420px] sm:gap-x-2 sm:gap-y-3 md:flex md:max-w-none md:flex-wrap md:gap-2"
            >
              {shortcuts.map((s) => (
                <li key={s.to} className="min-w-0">
                  <Link to={s.to} className={`${PILL} ${s.filled ? PILL_FILLED : PILL_OUTLINE}`}>
                    <s.icon
                      size={16}
                      strokeWidth={1.75}
                      className={`shrink-0 max-sm:h-3.5 max-sm:w-3.5 ${s.filled ? '' : 'text-secondary'}`}
                      aria-hidden="true"
                    />
                    <span className="truncate">{s.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <SearchBox
            value={query}
            onChange={(value) => {
              setQuery(value);
              // Daftar konverter dan kompresor dimuat begitu pencarian mulai dipakai.
              setSearchUsed(true);
            }}
            onFocus={() => setSearchUsed(true)}
            onSubmit={() => {
              if (results[0]) navigate(results[0].to);
            }}
          />
        </section>

        {/* ── Hasil pencarian menggantikan kartu selama kolom pencarian terisi ── */}
        {searching && <SearchResults query={query} results={results} loading={index.loading} />}

        {/* ── Tujuh kartu fitur ── */}
        <section aria-labelledby="home-tools-heading" hidden={searching}>
          <h2 id="home-tools-heading" className="sr-only">
            {t('home.tools_heading', 'Semua tools')}
          </h2>
          <ul role="list" className="grid grid-cols-12 gap-3 sm:gap-4">
            {cards.map((card) => (
              <li key={card.id} className={`min-w-0 ${card.span}`}>
                <FeatureCard
                  id={card.id}
                  to={card.to}
                  icon={card.icon}
                  title={card.title}
                  desc={card.desc}
                  chips={card.chips}
                  variant={card.variant}
                  tone={card.tone}
                >
                  {card.art}
                </FeatureCard>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </PageContainer>
  );
}
