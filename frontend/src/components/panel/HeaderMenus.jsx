import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle, Bell, CheckCircle2, ChevronDown, Eye, EyeOff, Globe, Info, KeyRound, LifeBuoy, LogOut, Save, UserRound, XCircle,
} from 'lucide-react';
import Button from '../ui/Button';
import { useToast } from '../ui/Toast';
import { useAuth } from '../../contexts/AuthContext';
import { changeMyPassword, updateMyProfile } from '../../services/authApi';
import DetailModal, { DetailSection } from './DetailModal';
import { useNotifications } from './useNotifications';

// Bantuan lewat WhatsApp admin.
const HELP_URL = `https://wa.me/6285188009152?text=${encodeURIComponent('Halo, saya butuh bantuan untuk akun OpenTools saya.')}`;
const ROLE_LABEL = { user: 'User', superadmin: 'Super Admin' };
const CLOSE_MS = 150;

const INPUT =
  'ios-no-zoom h-10 w-full rounded-md border border-border bg-card px-3 text-[13px] text-primary placeholder:text-tertiary transition-smooth focus:border-border-focus focus:outline-none disabled:bg-card-muted disabled:text-secondary';
const LABEL = 'mb-1 block text-[12px] font-medium text-secondary';

// Panel kecil yang menempel di bawah tombolnya (rata kanan). Digambar lewat portal dengan posisi fixed.
// Ditutup dengan klik di luar, Escape, atau saat halaman digulir atau ukuran layar berubah.
function usePopover(width) {
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false);
  const [pos, setPos] = useState(null);
  const buttonRef = useRef(null);
  const panelRef = useRef(null);
  const timer = useRef(null);

  const close = () => {
    setShown(false);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(false), CLOSE_MS);
  };

  const show = () => {
    const rect = buttonRef.current.getBoundingClientRect();
    const w = Math.min(width, window.innerWidth - 16);
    const left = Math.min(Math.max(8, rect.right - w), window.innerWidth - w - 8);
    setPos({ left, top: rect.bottom + 8, width: w, maxHeight: Math.max(200, window.innerHeight - rect.bottom - 24) });
    clearTimeout(timer.current);
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return undefined;
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (e) => {
      if (panelRef.current?.contains(e.target) || buttonRef.current?.contains(e.target)) return;
      close();
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        close();
        buttonRef.current?.focus({ preventScroll: true });
      }
    };
    const onScroll = (e) => {
      if (panelRef.current && e.target instanceof Node && panelRef.current.contains(e.target)) return;
      close();
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('resize', close);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('resize', close);
      window.removeEventListener('scroll', onScroll, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const toggle = () => (open && shown ? close() : show());
  const panelProps = pos && {
    ref: panelRef,
    style: { left: pos.left, top: pos.top, width: pos.width, maxHeight: pos.maxHeight },
    className: `fixed z-[70] flex origin-top-right flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-menu transition-[opacity,transform] duration-150 ease-out motion-reduce:transition-none dark:shadow-menu-dark ${
      shown ? 'translate-y-0 scale-100 opacity-100' : 'pointer-events-none -translate-y-1 scale-95 opacity-0'
    }`,
  };
  return { open, expanded: open && shown, buttonRef, toggle, close, panelProps };
}

const TONE = {
  success: { icon: CheckCircle2, cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  warning: { icon: AlertTriangle, cls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  danger: { icon: XCircle, cls: 'bg-red-500/10 text-red-600 dark:text-red-400' },
  info: { icon: Info, cls: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
  muted: { icon: Info, cls: 'bg-card-muted text-secondary' },
};

const timeAgo = (iso) => {
  if (!iso) return '';
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return 'Baru saja';
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} hari lalu`;
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

// Lonceng notifikasi: angka merah untuk yang belum dibaca, dan daftar notifikasi saat diklik.
export function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { items, unreadIds, loading, refresh, markAllRead } = useNotifications(user);
  const popover = usePopover(340);
  const [fresh, setFresh] = useState([]);
  const count = unreadIds.length;

  const onToggle = () => {
    if (!popover.expanded) {
      // Yang belum dibaca tetap diberi titik selama panel terbuka, lalu dianggap sudah dibaca.
      setFresh(unreadIds);
      refresh();
      markAllRead();
    }
    popover.toggle();
  };

  const openItem = (item) => {
    popover.close();
    if (item.to) navigate(item.to);
  };

  return (
    <>
      <button
        ref={popover.buttonRef}
        type="button"
        onClick={onToggle}
        aria-label={count ? `Notifikasi, ${count} belum dibaca` : 'Notifikasi'}
        aria-haspopup="dialog"
        aria-expanded={popover.expanded}
        title="Notifikasi"
        className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-secondary transition-smooth hover:text-primary ${
          popover.expanded ? 'border-border-focus text-primary' : 'border-border hover:border-border-hover'
        }`}
      >
        <Bell size={16} strokeWidth={1.75} aria-hidden="true" className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        {count > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-semibold leading-none text-white">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {popover.open && popover.panelProps &&
        createPortal(
          <div {...popover.panelProps} role="dialog" aria-label="Notifikasi">
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
              <p className="text-[14px] font-semibold text-primary">Notifikasi</p>
              <span className="text-[11px] text-tertiary">{loading ? 'Memuat...' : `${items.length} notifikasi`}</span>
            </div>
            {items.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-card-muted text-secondary">
                  <Bell size={18} strokeWidth={1.75} aria-hidden="true" />
                </span>
                <p className="mt-3 text-[13px] font-medium text-primary">Belum ada notifikasi</p>
                <p className="mt-1 text-[12px] text-secondary">Kabar soal pesanan, QR, dan Linktree kamu akan muncul di sini.</p>
              </div>
            ) : (
              <ul className="overflow-y-auto p-1.5">
                {items.map((item) => {
                  const tone = TONE[item.tone] || TONE.info;
                  const Icon = tone.icon;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => openItem(item)}
                        className="flex w-full items-start gap-3 rounded-md px-2.5 py-2.5 text-left transition-smooth hover:bg-card-muted focus:bg-card-muted focus:outline-none"
                      >
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${tone.cls}`}>
                          <Icon size={16} strokeWidth={1.75} aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[13px] font-medium leading-snug text-primary">{item.title}</span>
                          <span className="mt-0.5 block text-[12px] leading-snug text-secondary [overflow-wrap:anywhere]">{item.text}</span>
                          <span className="mt-1 block text-[11px] text-tertiary">{timeAgo(item.time)}</span>
                        </span>
                        {fresh.includes(item.id) && <span aria-label="Belum dibaca" className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>,
          document.body
        )}
    </>
  );
}

const MENU_ITEM =
  'flex h-10 w-full items-center gap-2.5 rounded-md px-2.5 text-left text-[13px] transition-smooth hover:bg-card-muted focus:bg-card-muted focus:outline-none';

// Foto profil di header. Diklik: menu profil (data akun dan password), lihat website, bantuan, dan keluar.
export function ProfileMenu({ onLogout }) {
  const { user } = useAuth();
  const popover = usePopover(260);
  const [modal, setModal] = useState(null);
  const role = user?.role === 'superadmin' ? 'superadmin' : 'user';
  const name = user?.name || user?.username || '';
  const initial = (name || 'A').slice(0, 1).toUpperCase();

  const pick = (action) => {
    popover.close();
    action();
  };

  return (
    <>
      <button
        ref={popover.buttonRef}
        type="button"
        onClick={popover.toggle}
        aria-haspopup="menu"
        aria-expanded={popover.expanded}
        aria-label={`Menu akun ${name}`}
        title="Menu akun"
        className={`flex min-w-0 items-center rounded-full border bg-card-muted/50 p-0.5 text-left transition-smooth sm:gap-2.5 sm:py-1 sm:pl-1 sm:pr-2.5 ${
          popover.expanded ? 'border-border-focus' : 'border-border hover:border-border-hover'
        }`}
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-black text-[12px] font-semibold text-white dark:bg-white dark:text-black">
          {initial}
        </span>
        <span className="hidden min-w-0 leading-tight sm:block">
          <span className="block max-w-[160px] truncate text-[13px] font-medium text-primary">{name}</span>
          <span className="block text-[11px] text-tertiary">{ROLE_LABEL[role]}</span>
        </span>
        <ChevronDown
          size={14}
          strokeWidth={1.75}
          aria-hidden="true"
          className={`hidden shrink-0 text-tertiary transition-transform duration-150 motion-reduce:transition-none sm:block ${popover.expanded ? 'rotate-180' : ''}`}
        />
      </button>

      {popover.open && popover.panelProps &&
        createPortal(
          <div {...popover.panelProps} role="menu" aria-label="Menu akun">
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-black text-[15px] font-semibold text-white dark:bg-white dark:text-black">
                {initial}
              </span>
              <div className="min-w-0 leading-tight">
                <p className="truncate text-[14px] font-semibold text-primary">{name}</p>
                <p className="truncate text-[12px] text-secondary">{user?.email || `@${user?.username || ''}`}</p>
                <p className="mt-0.5 text-[11px] text-tertiary">{ROLE_LABEL[role]}</p>
              </div>
            </div>
            <div className="p-1.5">
              <button type="button" role="menuitem" onClick={() => pick(() => setModal('profile'))} className={`${MENU_ITEM} text-primary`}>
                <UserRound size={16} strokeWidth={1.75} aria-hidden="true" className="shrink-0 text-secondary" /> Profil saya
                <span className="ml-auto text-[11px] text-tertiary">{role === 'user' ? 'Data dan password' : 'Data akun'}</span>
              </button>
              <a href="/" target="_blank" rel="noopener noreferrer" role="menuitem" onClick={popover.close} className={`${MENU_ITEM} text-primary`}>
                <Globe size={16} strokeWidth={1.75} aria-hidden="true" className="shrink-0 text-secondary" /> Lihat website
              </a>
              <a href={HELP_URL} target="_blank" rel="noopener noreferrer" role="menuitem" onClick={popover.close} className={`${MENU_ITEM} text-primary`}>
                <LifeBuoy size={16} strokeWidth={1.75} aria-hidden="true" className="shrink-0 text-secondary" /> Bantuan
                <span className="ml-auto text-[11px] text-tertiary">WhatsApp</span>
              </a>
            </div>
            <div className="border-t border-border p-1.5">
              <button type="button" role="menuitem" onClick={() => pick(onLogout)} className={`${MENU_ITEM} text-danger`}>
                <LogOut size={16} strokeWidth={1.75} aria-hidden="true" className="shrink-0" /> Keluar
              </button>
            </div>
          </div>,
          document.body
        )}

      {modal === 'profile' && <ProfileModal onClose={() => setModal(null)} />}
    </>
  );
}

// Modal "Profil saya": data akun (nama dan WhatsApp) dan ubah password, masing-masing dengan tombol simpannya sendiri.
function ProfileModal({ onClose }) {
  const { user } = useAuth();
  const admin = user?.role === 'superadmin';
  return (
    <DetailModal
      title="Profil saya"
      subtitle={admin ? 'Ubah data akun kamu.' : 'Ubah data akun dan password kamu.'}
      icon={UserRound}
      onClose={onClose}
      footer={<Button size="sm" variant="secondary" onClick={onClose}>Tutup</Button>}
    >
      <DetailSection title="Data profil" icon={UserRound}>
        <ProfileForm />
      </DetailSection>
      <DetailSection title="Ubah password" icon={KeyRound}>
        {admin ? (
          <p className="text-[12px] text-secondary sm:text-[13px]">
            Password super admin diatur di pengaturan server (cPanel), jadi tidak bisa diganti dari halaman ini.
          </p>
        ) : (
          <PasswordForm />
        )}
      </DetailSection>
    </DetailModal>
  );
}

// Ubah nama dan nomor WhatsApp akun.
function ProfileForm() {
  const { user, updateUser } = useAuth();
  const { addToast: toast } = useToast();
  const admin = user?.role === 'superadmin';
  const [name, setName] = useState(user?.name || '');
  const [whatsapp, setWhatsapp] = useState(user?.whatsapp || '');
  const [saving, setSaving] = useState(false);
  const changed = name.trim() !== (user?.name || '') || whatsapp.trim() !== (user?.whatsapp || '');

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const next = await updateMyProfile({ name: name.trim(), whatsapp: whatsapp.trim() });
      updateUser(next);
      setName(next.name || '');
      setWhatsapp(next.whatsapp || '');
      toast({ type: 'success', title: 'Profil disimpan' });
    } catch (err) {
      toast({ type: 'error', title: 'Gagal menyimpan', message: err?.response?.data?.message || 'Coba lagi beberapa saat.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2 sm:gap-4">
      <div>
        <label htmlFor="profile-name" className={LABEL}>Nama</label>
        <input id="profile-name" type="text" required minLength={2} maxLength={120} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className={INPUT} />
      </div>
      <div>
        <label htmlFor="profile-wa" className={LABEL}>Nomor WhatsApp{admin ? ' (boleh kosong)' : ''}</label>
        <input
          id="profile-wa"
          type="tel"
          inputMode="tel"
          required={!admin}
          maxLength={20}
          autoComplete="tel"
          placeholder="081234567890"
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          className={INPUT}
        />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="profile-login" className={LABEL}>{admin ? 'Username' : 'Email'}</label>
        <input id="profile-login" type="text" value={admin ? user?.username || '' : user?.email || ''} disabled readOnly className={INPUT} />
        <p className="mt-1 text-[11px] text-tertiary">
          {admin ? 'Username super admin diatur di pengaturan server.' : 'Email dipakai untuk masuk dan tidak bisa diubah dari sini.'}
        </p>
      </div>
      <div className="flex justify-end sm:col-span-2">
        <Button size="sm" variant="primary" icon={Save} type="submit" disabled={saving || !changed || name.trim().length < 2}>
          {saving ? 'Menyimpan...' : 'Simpan profil'}
        </Button>
      </div>
    </form>
  );
}

function PasswordField({ id, label, value, onChange, autoComplete, hint }) {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label htmlFor={id} className={LABEL}>{label}</label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          required
          maxLength={200}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${INPUT} pr-10`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Sembunyikan password' : 'Tampilkan password'}
          title={visible ? 'Sembunyikan' : 'Tampilkan'}
          className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-tertiary transition-smooth hover:text-primary"
        >
          {visible ? <EyeOff size={15} strokeWidth={1.75} aria-hidden="true" /> : <Eye size={15} strokeWidth={1.75} aria-hidden="true" />}
        </button>
      </div>
      {hint && <p className="mt-1 text-[11px] text-tertiary">{hint}</p>}
    </div>
  );
}

// Ganti password akun. Setelah diganti, perangkat lain yang masih masuk otomatis keluar.
function PasswordForm() {
  const { addToast: toast } = useToast();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);

  const tooShort = next.length > 0 && next.length < 8;
  const mismatch = confirm.length > 0 && confirm !== next;
  const same = next.length > 0 && next === current;
  const ready = current && next.length >= 8 && confirm === next && !same;

  const submit = async (e) => {
    e.preventDefault();
    if (!ready) return;
    setSaving(true);
    try {
      await changeMyPassword({ currentPassword: current, newPassword: next });
      toast({ type: 'success', title: 'Password diganti', message: 'Perangkat lain yang masih masuk otomatis keluar.' });
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch (err) {
      toast({ type: 'error', title: 'Gagal mengganti password', message: err?.response?.data?.message || 'Coba lagi beberapa saat.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2 sm:gap-4">
      <div className="sm:col-span-2">
        <PasswordField id="pw-current" label="Password saat ini" value={current} onChange={setCurrent} autoComplete="current-password" />
      </div>
      <PasswordField id="pw-new" label="Password baru" value={next} onChange={setNext} autoComplete="new-password" hint="Minimal 8 karakter." />
      <PasswordField id="pw-confirm" label="Ulangi password baru" value={confirm} onChange={setConfirm} autoComplete="new-password" />
      {(tooShort || mismatch || same) && (
        <p className="rounded-md bg-red-500/10 px-2.5 py-2 text-[12px] text-red-700 dark:text-red-400 sm:col-span-2">
          {tooShort
            ? 'Password baru minimal 8 karakter.'
            : same
              ? 'Password baru harus berbeda dari password saat ini.'
              : 'Ulangi password baru belum sama.'}
        </p>
      )}
      <div className="flex justify-end sm:col-span-2">
        <Button size="sm" variant="primary" icon={KeyRound} type="submit" disabled={saving || !ready}>
          {saving ? 'Menyimpan...' : 'Ganti password'}
        </Button>
      </div>
    </form>
  );
}
