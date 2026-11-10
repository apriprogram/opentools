import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

// Kartu fitur di beranda. Satu komponen untuk semua kartu: panggung ilustrasi + teks ringkas.
// Di ponsel selalu bertumpuk (panggung di atas). Varian lebar menjadi mendatar di layar yang lebih besar.
// Seluruh kartu adalah satu tautan, jadi tidak ada tautan atau tombol di dalamnya.
//
// Catatan: jangan menambah outline-none di sini. index.css sudah menggambar fokus keyboard untuk <a>.

const LINK =
  'group relative flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-200 ease-out hover:border-blue-500 active:border-blue-500';
const STAGE =
  'pointer-events-none relative flex shrink-0 select-none items-center justify-center overflow-hidden border-b border-border bg-card-muted';

// Kelas ditulis utuh supaya terbaca Tailwind. Tidak ada dua kelas untuk properti yang sama di satu breakpoint.
const VARIANTS = {
  // Tegak di semua ukuran.
  default: {
    link: '',
    stage: 'h-40 sm:h-44',
    body: 'p-4 sm:p-5',
    title: 'text-[15px] leading-[22px] sm:text-[16px] sm:leading-6',
    desc: '',
    chips: 'mt-auto pt-3',
  },
  // Mendatar mulai 640px (kartu utama).
  wideSm: {
    link: 'sm:min-h-[232px] sm:flex-row-reverse',
    stage: 'h-40 sm:h-auto sm:w-1/2 sm:border-b-0 sm:border-l',
    body: 'p-4 sm:justify-center sm:p-6',
    title: 'text-[18px] leading-6 sm:text-[20px] sm:leading-7',
    desc: 'sm:max-w-[40ch] sm:text-[14px] sm:leading-[22px]',
    chips: 'mt-auto pt-3 sm:mt-3 sm:pt-0',
  },
  // Mendatar mulai 1024px. Di tablet tetap tegak karena hanya menempati setengah lebar.
  wideLg: {
    link: 'lg:flex-row-reverse',
    stage: 'h-40 sm:h-44 lg:h-auto lg:w-1/2 lg:border-b-0 lg:border-l',
    body: 'p-4 sm:p-5 lg:justify-center lg:p-6',
    title: 'text-[15px] leading-[22px] sm:text-[16px] sm:leading-6 lg:text-[20px] lg:leading-7',
    desc: 'lg:max-w-[40ch] lg:text-[14px] lg:leading-[22px]',
    chips: 'mt-auto pt-3 lg:mt-3 lg:pt-0',
  },
};

export default function FeatureCard({ id, to, icon: Icon, title, desc, chips = [], variant = 'default', children }) {
  const v = VARIANTS[variant] || VARIANTS.default;

  return (
    <Link to={to} aria-labelledby={`${id}-title`} aria-describedby={`${id}-desc`} className={`${LINK} ${v.link}`}>
      {/* Panggung ilustrasi: dekoratif, jadi disembunyikan dari pembaca layar. */}
      <div aria-hidden="true" className={`${STAGE} ${v.stage}`}>
        {children}
      </div>

      <div className={`flex min-w-0 flex-1 flex-col ${v.body}`}>
        <div className="flex items-center gap-2">
          <Icon size={18} strokeWidth={1.75} className="shrink-0 text-primary" aria-hidden="true" />
          <h3 id={`${id}-title`} className={`min-w-0 flex-1 font-semibold tracking-tight text-primary ${v.title}`}>
            {title}
          </h3>
          <span
            aria-hidden="true"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border text-secondary transition-all duration-200 ease-out group-hover:border-blue-500 group-hover:text-blue-500"
          >
            <ArrowUpRight
              size={16}
              strokeWidth={1.75}
              className="transition-transform duration-200 ease-out motion-safe:group-hover:-translate-y-0.5 motion-safe:group-hover:translate-x-0.5"
            />
          </span>
        </div>

        <p id={`${id}-desc`} className={`mt-1.5 text-[13px] leading-5 text-secondary ${v.desc}`}>
          {desc}
        </p>

        <ul role="list" className={`flex flex-wrap gap-1.5 ${v.chips}`}>
          {chips.map((chip) => (
            <li
              key={chip}
              className="inline-flex h-6 items-center rounded-full border border-border bg-card-muted px-2 text-[11px] font-medium text-primary"
            >
              {chip}
            </li>
          ))}
        </ul>
      </div>
    </Link>
  );
}
