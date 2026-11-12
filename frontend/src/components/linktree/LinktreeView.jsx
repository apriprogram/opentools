import React, { useEffect } from 'react';
import { SOCIAL_BY_ID, LINK_ICON_BY_ID } from './constants';
import { fontFamily, loadFont } from './fonts';
import LinkIcon from './LinkIcon';

// Tautan punya ikon jika berisi gambar unggahan atau ikon bawaan yang dikenal.
const hasIcon = (value) =>
  typeof value === 'string' &&
  (value.startsWith('data:image/') || (value.startsWith('preset:') && Boolean(LINK_ICON_BY_ID[value.slice(7)])));

// Latar halaman dari tema. Dipakai juga oleh halaman publik agar seluruh layar ikut berwarna.
export function pageBackground(theme) {
  const bg = (theme && theme.bg) || {};
  if (bg.type === 'image' && bg.image) {
    return { backgroundImage: `url("${bg.image}")`, backgroundSize: 'cover', backgroundPosition: 'center' };
  }
  if (bg.type === 'gradient') {
    return { backgroundImage: `linear-gradient(160deg, ${bg.color}, ${bg.color2})` };
  }
  return { backgroundColor: bg.color };
}

// Liquid glass memakai kelas CSS (lihat index.css) karena butuh kilau dan gerak saat ditekan.
export const isLiquidButton = (theme) => Boolean(theme && theme.button && theme.button.style === 'liquid');
export const isLiquidSocial = (theme) => Boolean(theme && theme.social && theme.social.style === 'liquid');

// Gaya tombol tautan dari tema: solid, garis, bayangan tegas, bayangan lembut, kaca, atau liquid glass.
export function linkButtonStyle(theme) {
  const btn = (theme && theme.button) || {};
  const text = (theme && theme.text) || '#111111';
  const radius = { pill: '9999px', rounded: '14px', square: '0px' }[btn.radius] || '9999px';
  const base = { borderRadius: radius };
  switch (btn.style) {
    case 'outline':
      return { ...base, background: 'transparent', border: `2px solid ${btn.color}`, color: btn.color };
    case 'shadow':
      return { ...base, background: btn.color, color: btn.textColor, border: '2px solid transparent', boxShadow: '0 6px 0 rgba(0,0,0,0.18)' };
    case 'soft':
      return { ...base, background: btn.color, color: btn.textColor, border: '2px solid transparent', boxShadow: '0 12px 24px -10px rgba(0,0,0,0.45)' };
    case 'glass':
      return {
        ...base,
        background: `color-mix(in srgb, ${btn.color} 18%, transparent)`,
        border: `1px solid color-mix(in srgb, ${btn.color} 50%, transparent)`,
        color: text,
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      };
    case 'liquid':
      return { ...base, '--lt-tint': btn.color, color: text };
    default:
      return { ...base, background: btn.color, color: btn.textColor, border: '2px solid transparent' };
  }
}

// Gaya satu ikon sosial: garis lingkaran, tanpa lingkaran, berlatar, warna brand, atau liquid glass.
// Warna ikon pada gaya berlatar memakai warna latar halaman supaya selalu kontras dengan warna teks.
export function socialIconStyle(theme, meta) {
  const text = (theme && theme.text) || '#111111';
  const pageColor = (theme && theme.bg && theme.bg.color) || '#FFFFFF';
  const style = (theme && theme.social && theme.social.style) || 'outline';
  if (style === 'plain') return { box: { color: text }, iconSize: 24 };
  if (style === 'liquid') return { box: { '--lt-tint': text, color: text }, iconSize: 19 };
  if (style === 'fill') return { box: { background: text, color: pageColor }, iconSize: 19 };
  if (style === 'brand') {
    return meta && meta.color
      ? { box: { background: meta.color, color: '#FFFFFF' }, iconSize: 19 }
      : { box: { background: text, color: pageColor }, iconSize: 19 };
  }
  return { box: { border: `2px solid ${text}`, color: text }, iconSize: 18 };
}

// Tampilan Linktree. Dipakai di halaman publik, pratinjau editor, dan contoh di landing.
// preview: klik tautan tidak membuka halaman. onLinkClick: dipanggil saat tautan publik diklik.
export default function LinktreeView({ tree, preview = false, onLinkClick }) {
  const theme = tree.theme || {};
  const text = theme.text || '#111111';
  const avatarOutline = !theme.avatar || theme.avatar.outline !== false;
  const items = (tree.items || []).filter((i) => i.enabled !== false);
  const socials = items.filter((i) => i.type === 'social');
  const rest = items.filter((i) => i.type !== 'social');

  const pageStyle = pageBackground(theme);
  const buttonStyle = linkButtonStyle(theme);
  const liquidButton = isLiquidButton(theme);
  const liquidSocial = isLiquidSocial(theme);

  // Huruf pilihan dimuat saat dibutuhkan.
  useEffect(() => {
    loadFont(theme.font);
  }, [theme.font]);

  const handleClick = (event, item) => {
    if (preview) {
      event.preventDefault();
      return;
    }
    onLinkClick?.(item);
  };

  return (
    <div className="min-h-full w-full px-5 py-10" style={{ ...pageStyle, color: text, fontFamily: fontFamily(theme.font) }}>
      <div className="mx-auto flex w-full max-w-[420px] flex-col items-center">
        {tree.avatar ? (
          <img
            src={tree.avatar}
            alt=""
            className="h-24 w-24 rounded-full object-cover"
            style={avatarOutline ? { border: `3px solid ${text}` } : undefined}
          />
        ) : (
          <div
            className="flex h-24 w-24 items-center justify-center rounded-full text-[30px] font-semibold"
            style={
              avatarOutline
                ? { border: `2px solid ${text}`, color: text }
                : { background: `color-mix(in srgb, ${text} 14%, transparent)`, color: text }
            }
          >
            {(tree.title || '?').trim().slice(0, 1).toUpperCase() || '?'}
          </div>
        )}

        <h1 className="mt-4 break-words text-center text-[20px] font-semibold leading-[28px]" style={{ color: text }}>
          {tree.title}
        </h1>
        {tree.bio && (
          <p className="mt-2 max-w-[340px] whitespace-pre-line break-words text-center text-[14px] leading-[22px] opacity-80">
            {tree.bio}
          </p>
        )}

        {socials.length > 0 && (
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            {socials.map((item, index) => {
              const meta = SOCIAL_BY_ID[item.platform] || SOCIAL_BY_ID.website;
              const Icon = meta.icon;
              const look = socialIconStyle(theme, meta);
              return (
                <a
                  key={item.id}
                  href={item.url}
                  rel="noopener noreferrer"
                  aria-label={meta.label}
                  title={meta.label}
                  onClick={(e) => handleClick(e, item)}
                  className={`flex h-11 w-11 items-center justify-center rounded-full ${
                    liquidSocial ? 'lt-liquid lt-pop' : 'transition-transform hover:scale-105'
                  }`}
                  style={{ ...look.box, '--lt-i': index }}
                >
                  <Icon size={look.iconSize} strokeWidth={1.75} />
                </a>
              );
            })}
          </div>
        )}

        <div className="mt-6 flex w-full flex-col gap-3">
          {rest.map((item, index) =>
            item.type === 'header' ? (
              <p key={item.id} className="break-words pt-2 text-center text-[13px] font-semibold uppercase tracking-wider opacity-80">
                {item.title}
              </p>
            ) : (
              <a
                key={item.id}
                href={item.url}
                rel="noopener noreferrer"
                onClick={(e) => handleClick(e, item)}
                className={`relative flex min-h-[52px] w-full items-center justify-center break-words py-3 text-center text-[15px] font-medium ${
                  liquidButton ? 'lt-liquid lt-pop' : 'transition-all hover:opacity-90 active:scale-[0.99]'
                } ${hasIcon(item.icon) ? 'px-14' : 'px-5'}`}
                style={{ ...buttonStyle, '--lt-i': index + socials.length }}
              >
                {/* Ikon di kiri, judul tetap di tengah tombol. */}
                {hasIcon(item.icon) && (
                  <span className="absolute left-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center">
                    <LinkIcon value={item.icon} size={20} />
                  </span>
                )}
                {item.title}
              </a>
            )
          )}
        </div>
      </div>
    </div>
  );
}
