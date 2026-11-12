import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

// Kartu fitur di beranda. Satu komponen untuk semua kartu: panggung ilustrasi + teks ringkas.
// Tiap kartu punya warna sendiri (tone) berupa gradasi lembut, dengan teks putih dan elemen kaca di atasnya.
// Di ponsel selalu bertumpuk (panggung di atas). Varian lebar menjadi mendatar di layar yang lebih besar.
// Seluruh kartu adalah satu tautan, jadi tidak ada tautan atau tombol di dalamnya.
//
// Ilustrasi 3D: benda padat yang berdiri miring dan diam. Saat kursor bergerak di atas kartu, ilustrasinya
// miring mengikuti kursor (kartunya sendiri tetap diam). Gayanya ada di index.css (.illus-*).
//
// Catatan: jangan menambah outline-none di sini. index.css sudah menggambar fokus keyboard untuk <a>.

// Saat disorot, kartunya sendiri diam (tidak terangkat, tombol panah tidak berubah).
// Kelas "group" tetap dipakai supaya ilustrasi di dalamnya tetap bergerak (group-hover).
const LINK =
  'tone-card group flex h-full min-w-0 flex-col overflow-hidden rounded-[28px] sm:rounded-[32px]';
const STAGE =
  'tone-stage pointer-events-none relative flex shrink-0 select-none items-center justify-center overflow-hidden border-b border-white/15';

// Kelas ditulis utuh supaya terbaca Tailwind. Tidak ada dua kelas untuk properti yang sama di satu breakpoint.
const VARIANTS = {
  // Tegak di semua ukuran.
  default: {
    link: '',
    stage: 'h-36 sm:h-56',
    body: 'p-3 sm:p-5',
    title: 'text-[13px] leading-5 sm:text-[16px] sm:leading-6',
    desc: '',
    chips: 'mt-auto pt-2.5 sm:pt-3',
  },
  // Mendatar mulai 640px (kartu utama).
  wideSm: {
    link: 'sm:min-h-[264px] sm:flex-row-reverse',
    // Panggungnya lebar, jadi ilustrasinya diperbesar.
    scene: 'sm:[&>.illus-tilt]:[scale:1.2]',
    stage: 'h-36 sm:h-auto sm:w-1/2 sm:border-b-0 sm:border-l',
    body: 'p-3 sm:justify-center sm:p-6',
    title: 'text-[15px] leading-[22px] sm:text-[20px] sm:leading-7',
    desc: 'sm:max-w-[40ch] sm:text-[14px] sm:leading-[22px]',
    chips: 'mt-auto pt-2.5 sm:mt-3 sm:pt-0',
  },
  // Mendatar mulai 1024px. Di tablet tetap tegak karena hanya menempati setengah lebar.
  wideLg: {
    link: 'lg:flex-row-reverse',
    scene: 'lg:[&>.illus-tilt]:[scale:1.2]',
    stage: 'h-36 sm:h-56 lg:h-auto lg:w-1/2 lg:border-b-0 lg:border-l',
    body: 'p-3 sm:p-5 lg:justify-center lg:p-6',
    title: 'text-[13px] leading-5 sm:text-[16px] sm:leading-6 lg:text-[20px] lg:leading-7',
    desc: 'lg:max-w-[40ch] lg:text-[14px] lg:leading-[22px]',
    chips: 'mt-auto pt-2.5 sm:pt-3 lg:mt-3 lg:pt-0',
  },
};

export default function FeatureCard({ id, to, icon: Icon, title, desc, chips = [], variant = 'default', tone = 'slate', children }) {
  const v = VARIANTS[variant] || VARIANTS.default;
  const cardRef = useRef(null);
  const frame = useRef(0);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  // Kursor di atas kartu: ilustrasi miring mengikuti posisinya. Hanya untuk mouse, dan tidak saat gerak dikurangi.
  const onMove = (e) => {
    const card = cardRef.current;
    if (!card || e.pointerType !== 'mouse') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const box = card.getBoundingClientRect();
    const px = Math.min(0.5, Math.max(-0.5, (e.clientX - box.left) / box.width - 0.5));
    const py = Math.min(0.5, Math.max(-0.5, (e.clientY - box.top) / box.height - 0.5));
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      card.dataset.tracking = 'true';
      card.style.setProperty('--iry', `${(px * 44).toFixed(2)}deg`);
      card.style.setProperty('--irx', `${(-py * 32).toFixed(2)}deg`);
    });
  };

  const onLeave = () => {
    const card = cardRef.current;
    if (!card) return;
    cancelAnimationFrame(frame.current);
    card.dataset.tracking = 'false';
    card.style.removeProperty('--iry');
    card.style.removeProperty('--irx');
  };

  return (
    <Link
      ref={cardRef}
      to={to}
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-desc`}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={`${LINK} tone-${tone} ${v.link}`}
    >
      {/* Panggung ilustrasi: dekoratif, jadi disembunyikan dari pembaca layar. */}
      <div aria-hidden="true" className={`${STAGE} ${v.stage}`}>
        {/* Di ponsel ilustrasi dikecilkan supaya muat di panggung yang lebih pendek. */}
        <div className={`illus-scene flex h-full w-full items-center justify-center max-sm:scale-[0.8] ${v.scene || ''}`}>
          <div className="illus-tilt">
            <span className="illus-ground" />
            {children}
          </div>
        </div>
      </div>

      <div className={`flex min-w-0 flex-1 flex-col ${v.body}`}>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Icon size={18} strokeWidth={1.75} className="shrink-0 text-white max-sm:h-[15px] max-sm:w-[15px]" aria-hidden="true" />
          <h3 id={`${id}-title`} className={`min-w-0 flex-1 font-medium tracking-tight text-white ${v.title}`}>
            {title}
          </h3>
          <span
            aria-hidden="true"
            className="glass-on-color flex h-8 w-8 shrink-0 items-center justify-center rounded-full sm:h-10 sm:w-10"
          >
            <ArrowUpRight size={17} strokeWidth={1.5} className="max-sm:h-3.5 max-sm:w-3.5" />
          </span>
        </div>

        <p id={`${id}-desc`} className={`mt-1 text-[12px] leading-[18px] text-white/80 sm:mt-1.5 sm:text-[13px] sm:leading-5 ${v.desc}`}>
          {desc}
        </p>

        <ul role="list" className={`flex flex-wrap gap-1 sm:gap-1.5 ${v.chips}`}>
          {chips.map((chip) => (
            <li
              key={chip}
              className="glass-on-color inline-flex h-5 items-center rounded-full px-2 text-[10px] font-medium sm:h-6 sm:px-2.5 sm:text-[11px]"
            >
              {chip}
            </li>
          ))}
        </ul>
      </div>
    </Link>
  );
}
