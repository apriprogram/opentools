import React from 'react';
import { SOCIAL_BY_ID } from './constants';

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

// Tampilan Linktree. Dipakai di halaman publik, pratinjau editor, dan contoh di landing.
// preview: klik tautan tidak membuka halaman. onLinkClick: dipanggil saat tautan publik diklik.
export default function LinktreeView({ tree, preview = false, onLinkClick }) {
  const theme = tree.theme || {};
  const bg = theme.bg || {};
  const btn = theme.button || {};
  const text = theme.text || '#111111';
  const items = (tree.items || []).filter((i) => i.enabled !== false);
  const socials = items.filter((i) => i.type === 'social');
  const rest = items.filter((i) => i.type !== 'social');

  const pageStyle = pageBackground(theme);

  const radius = { pill: '9999px', rounded: '14px', square: '0px' }[btn.radius] || '9999px';
  const buttonStyle =
    btn.style === 'outline'
      ? { background: 'transparent', border: `2px solid ${btn.color}`, color: btn.color }
      : btn.style === 'shadow'
        ? { background: btn.color, color: btn.textColor, border: '2px solid transparent', boxShadow: '0 6px 0 rgba(0,0,0,0.18)' }
        : { background: btn.color, color: btn.textColor, border: '2px solid transparent' };

  const handleClick = (event, item) => {
    if (preview) {
      event.preventDefault();
      return;
    }
    onLinkClick?.(item);
  };

  return (
    <div className="min-h-full w-full px-5 py-10" style={{ ...pageStyle, color: text }}>
      <div className="mx-auto flex w-full max-w-[420px] flex-col items-center">
        {tree.avatar ? (
          <img
            src={tree.avatar}
            alt=""
            className="h-24 w-24 rounded-full object-cover"
            style={{ border: `3px solid ${text}` }}
          />
        ) : (
          <div
            className="flex h-24 w-24 items-center justify-center rounded-full text-[30px] font-semibold"
            style={{ border: `2px solid ${text}`, color: text }}
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
            {socials.map((item) => {
              const meta = SOCIAL_BY_ID[item.platform] || SOCIAL_BY_ID.website;
              const Icon = meta.icon;
              return (
                <a
                  key={item.id}
                  href={item.url}
                  rel="noopener noreferrer"
                  aria-label={meta.label}
                  title={meta.label}
                  onClick={(e) => handleClick(e, item)}
                  className="flex h-11 w-11 items-center justify-center rounded-full transition-transform hover:scale-105"
                  style={{ border: `2px solid ${text}`, color: text }}
                >
                  <Icon size={18} strokeWidth={1.75} />
                </a>
              );
            })}
          </div>
        )}

        <div className="mt-6 flex w-full flex-col gap-3">
          {rest.map((item) =>
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
                className="flex min-h-[52px] w-full items-center justify-center break-words px-5 py-3 text-center text-[15px] font-medium transition-all hover:opacity-90 active:scale-[0.99]"
                style={{ ...buttonStyle, borderRadius: radius }}
              >
                {item.title}
              </a>
            )
          )}
        </div>
      </div>
    </div>
  );
}
