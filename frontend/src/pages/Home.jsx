import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeftRight, BarChart2, Check, ImagePlus, Layers, Link2, Minimize2, QrCode } from 'lucide-react';
import PageContainer from '../components/layout/PageContainer';
import FeatureCard from '../components/home/FeatureCard';
import {
  IllusBatch,
  IllusCompress,
  IllusConvert,
  IllusLinktree,
  IllusQr,
  IllusStats,
  IllusTwibbon,
} from '../components/home/HomeIllustrations';

// Pintasan fitur di hero. Di ponsel berupa grid 3 kolom setinggi 32px dengan area sentuh 44px (lewat ::after).
const PILL =
  'relative flex h-8 w-full min-w-0 items-center justify-center gap-1 rounded-full border px-2 text-[12px] font-medium leading-none transition-all duration-200 ease-out after:absolute after:inset-x-0 after:-inset-y-1.5 md:h-9 md:w-auto md:gap-1.5 md:px-3.5 md:text-[13px] md:after:-inset-y-1';
const PILL_OUTLINE = 'border-border bg-card text-primary hover:border-blue-500 active:border-blue-500';
const PILL_FILLED =
  'border-accent-black bg-accent-black text-card hover:border-accent-black-hover hover:bg-accent-black-hover';

const SPAN_HALF = 'col-span-12 sm:col-span-6 lg:col-span-4';

export default function Home() {
  const { t } = useTranslation();

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
      icon: BarChart2,
      title: t('home.card_stats_title', 'Statistik'),
      desc: t('home.card_stats_desc', 'Lihat jumlah pengunjung, file yang diproses, dan fitur terpopuler secara realtime.'),
      chips: ['Realtime', t('home.chip_visitors', 'Pengunjung'), t('home.chip_files_processed', 'File diproses')],
      art: <IllusStats />,
    },
  ];

  return (
    <PageContainer>
      <div className="mx-auto w-full max-w-5xl">
        {/* ── Hero: judul, tiga fakta, dan pintasan fitur ── */}
        <section className="mb-4 sm:mb-6 sm:border-b sm:border-border sm:pb-6">
          <div className="lg:flex lg:items-end lg:justify-between lg:gap-8">
            <h1
              className="min-w-0 max-w-[640px] text-balance text-[24px] font-normal leading-[1.2] tracking-tight text-primary sm:text-[30px] lg:text-[34px]"
              style={{ fontFamily: "'Special Gothic Expanded One', sans-serif" }}
            >
              {t('home.hero_h1_a', 'Semua tools yang kamu butuhkan,')}{' '}
              <span className="text-blue-500">{t('home.hero_h1_b', 'gratis.')}</span>
            </h1>

            <ul role="list" className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 lg:mt-0 lg:shrink-0 lg:flex-col">
              {facts.map((fact) => (
                <li
                  key={fact}
                  className="flex items-start gap-1.5 text-[12px] font-medium leading-[18px] text-primary sm:text-[13px] sm:leading-5"
                >
                  <Check size={16} strokeWidth={1.75} className="mt-px shrink-0" aria-hidden="true" />
                  {fact}
                </li>
              ))}
            </ul>
          </div>

          <nav aria-label={t('home.shortcuts_label', 'Pintasan fitur')} className="mt-4 sm:mt-5">
            <ul
              role="list"
              className="grid grid-cols-3 gap-x-2 gap-y-3 sm:max-w-[420px] md:flex md:max-w-none md:flex-wrap md:gap-2"
            >
              {shortcuts.map((s) => (
                <li key={s.to} className="min-w-0">
                  <Link to={s.to} className={`${PILL} ${s.filled ? PILL_FILLED : PILL_OUTLINE}`}>
                    <s.icon
                      size={16}
                      strokeWidth={1.75}
                      className={s.filled ? 'shrink-0' : 'shrink-0 text-secondary'}
                      aria-hidden="true"
                    />
                    <span className="truncate">{s.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </section>

        {/* ── Tujuh kartu fitur ── */}
        <section aria-labelledby="home-tools-heading">
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
