import React from 'react';
import { Calendar, CalendarRange, CheckCircle2, Clock, MessageCircle, XCircle } from 'lucide-react';

// Chip: label pil kecil untuk data di tabel dan modal (paket, status, lisensi, bukti).
const TONES = {
  neutral: 'bg-card-muted text-primary',
  muted: 'bg-card-muted text-secondary',
  success: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  warning: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  danger: 'bg-red-500/10 text-red-700 dark:text-red-400',
  info: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
};
const DOTS = {
  neutral: 'bg-primary',
  muted: 'bg-tertiary',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  info: 'bg-blue-500',
};

export function Chip({ tone = 'neutral', icon: Icon, dot = false, children, className = '', title }) {
  return (
    <span
      title={title}
      className={`inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full px-2 text-[11px] font-medium sm:px-2.5 sm:text-[12px] ${TONES[tone] || TONES.neutral} ${className}`}
    >
      {Icon && <Icon size={12} strokeWidth={2} aria-hidden="true" className="shrink-0" />}
      {dot && <span aria-hidden="true" className={`h-1.5 w-1.5 shrink-0 rounded-full ${DOTS[tone] || DOTS.neutral}`} />}
      {children}
    </span>
  );
}

// Paket: Bulanan atau Tahunan.
export function PlanChip({ plan, label }) {
  const yearly = plan === 'yearly';
  return (
    <Chip tone={yearly ? 'info' : 'neutral'} icon={yearly ? CalendarRange : Calendar}>
      {label}
    </Chip>
  );
}

const ORDER_STATUS = {
  pending: { tone: 'warning', icon: Clock, text: 'Menunggu' },
  paid: { tone: 'success', icon: CheckCircle2, text: 'Lunas' },
  cancelled: { tone: 'danger', icon: XCircle, text: 'Batal' },
};

export function OrderStatusChip({ status }) {
  const s = ORDER_STATUS[status] || ORDER_STATUS.pending;
  return <Chip tone={s.tone} icon={s.icon}>{s.text}</Chip>;
}

const LICENSE = {
  aktif: { tone: 'success', text: 'Lisensi aktif' },
  nonaktif: { tone: 'danger', text: 'Lisensi nonaktif' },
  berakhir: { tone: 'muted', text: 'Lisensi berakhir' },
  tidak_ada: { tone: 'muted', text: 'Tanpa lisensi' },
};

export function LicenseChip({ state }) {
  const s = LICENSE[state];
  if (!s) return null;
  return <Chip tone={s.tone} dot>{s.text}</Chip>;
}

const PROOF = {
  approved: { tone: 'success', text: 'Bukti otomatis lunas' },
  review: { tone: 'warning', text: 'Bukti perlu dicek' },
  rejected: { tone: 'danger', text: 'Bukti ditolak' },
  checking: { tone: 'info', text: 'Bukti diperiksa' },
};

export function ProofChip({ verifyStatus, hasProof }) {
  const s = PROOF[verifyStatus] || (hasProof ? { tone: 'neutral', text: 'Bukti diunggah' } : { tone: 'muted', text: 'Bukti belum ada' });
  return <Chip tone={s.tone} dot>{s.text}</Chip>;
}

// Diterbitkan atau Draf (Linktree).
export function PublishChip({ published }) {
  return <Chip tone={published ? 'success' : 'muted'} dot>{published ? 'Diterbitkan' : 'Draf'}</Chip>;
}

// Tombol pil WhatsApp: membuka chat ke nomor tersebut.
export function WhatsappPill({ number, className = '' }) {
  if (!number) return null;
  return (
    <a
      href={`https://wa.me/${number}`}
      target="_blank"
      rel="noopener noreferrer"
      title={`Chat WhatsApp +${number}`}
      className={`inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full bg-emerald-500/10 px-2 text-[11px] font-medium tabular-nums text-emerald-700 transition-smooth hover:bg-emerald-500/20 dark:text-emerald-400 sm:px-2.5 sm:text-[12px] ${className}`}
    >
      <MessageCircle size={12} strokeWidth={2} aria-hidden="true" className="shrink-0" />
      +{number}
    </a>
  );
}
