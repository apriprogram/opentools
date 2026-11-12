import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Download, Eye, ImagePlus, LayoutDashboard, Plus, Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import PageContainer from '../components/layout/PageContainer';
import FramePreview from '../components/twibbon/FramePreview';
import Button from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { getCampaigns } from '../services/twibbonApi';

const CREATE_PATH = '/dashboard/twibbon/baru';
const angka = (n) => Number(n || 0).toLocaleString('id-ID');

// Daftar Twibbon publik. Siapa saja bisa memakai Twibbon; membuat Twibbon wajib masuk akun.
export default function CampaignsListPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    getCampaigns()
      .then((data) => setCampaigns(data || []))
      .catch(() => setCampaigns([]));
  }, []);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return campaigns || [];
    return (campaigns || []).filter((c) => `${c.title} ${c.description || ''} ${c.creatorName || ''}`.toLowerCase().includes(q));
  }, [campaigns, query]);

  // Moderasi (hapus Twibbon) dilakukan super admin dari menu Data Twibbon, bukan dari halaman publik ini.

  // Tombol buat: akun yang sudah masuk ke panel, tamu ke halaman masuk (lalu diteruskan ke pembuat Twibbon).
  const createButton = user ? (
    <Link to={CREATE_PATH}>
      <Button variant="primary" icon={Plus}>{t('twibbon.create_btn', 'Buat Twibbon')}</Button>
    </Link>
  ) : (
    <Link to={`/masuk?next=${encodeURIComponent(CREATE_PATH)}`}>
      <Button variant="primary" icon={Plus}>{t('twibbon.create_btn', 'Buat Twibbon')}</Button>
    </Link>
  );

  return (
    <PageContainer>
      <section className="pt-6">
        <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-[26px] font-semibold leading-[36px] tracking-tight text-primary sm:text-[32px] sm:leading-[42px]">
              {t('twibbon.campaigns_title', 'Twibbon')}
            </h1>
            <p className="mt-2 max-w-[620px] text-[14px] leading-[22px] text-secondary">
              {t('twibbon.campaigns_desc', 'Pilih bingkai, pasang fotomu, lalu unduh. Mau membuat bingkai sendiri? Masuk dulu ke akunmu.')}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:gap-3">
            <Link to="/">
              <Button variant="secondary" icon={ArrowLeft}>{t('common.back', 'Kembali')}</Button>
            </Link>
            {user && (
              <Link to="/dashboard/twibbon">
                <Button variant="secondary" icon={LayoutDashboard}>Twibbon saya</Button>
              </Link>
            )}
            {createButton}
          </div>
        </div>

        <label className="relative mb-6 block w-full max-w-[540px]">
          <span className="sr-only">Cari Twibbon</span>
          <Search size={18} strokeWidth={1.75} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('twibbon.search_campaigns', 'Cari Twibbon...')}
            className="h-[44px] w-full rounded-md border border-border bg-card pl-10 pr-10 text-[14px] text-primary placeholder-secondary transition-smooth hover:border-border-hover focus:border-border-focus focus:outline-none"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} aria-label="Hapus pencarian" className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-sm text-secondary transition-smooth hover:text-primary">
              <X size={15} strokeWidth={1.75} />
            </button>
          )}
        </label>

        {campaigns === null ? (
          <p className="py-16 text-center text-[13px] text-secondary">{t('home.loading', 'Memuat...')}</p>
        ) : campaigns.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-card-muted text-secondary">
              <ImagePlus size={22} strokeWidth={1.75} aria-hidden="true" />
            </span>
            <p className="mt-3 text-[15px] font-semibold text-primary">{t('twibbon.no_campaigns', 'Belum ada Twibbon')}</p>
            <p className="mt-1 text-[13px] text-secondary">{t('twibbon.no_campaigns_desc', 'Jadilah yang pertama membuat Twibbon.')}</p>
            {createButton && <div className="mt-4 inline-block">{createButton}</div>}
          </div>
        ) : shown.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <p className="text-[14px] font-medium text-primary">Tidak ada Twibbon yang cocok</p>
            <p className="mt-1 text-[12px] text-secondary">Coba kata kunci lain.</p>
          </div>
        ) : (
          <ul role="list" className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {shown.map((campaign) => (
              <li key={campaign.id}>
                <Link
                  to={`/c/${campaign.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-smooth hover:border-blue-500"
                >
                  <FramePreview src={campaign.frameBase64} alt={campaign.title} rounded="rounded-none" />
                  <div className="flex flex-1 flex-col p-3">
                    <h2 className="line-clamp-2 text-[13px] font-semibold leading-snug text-primary sm:text-[14px]">{campaign.title}</h2>
                    {campaign.description && <p className="mt-1 line-clamp-2 text-[12px] leading-snug text-secondary">{campaign.description}</p>}
                    <div className="mt-auto flex items-center justify-between gap-2 pt-3 text-[11px] text-tertiary">
                      <span className="min-w-0 truncate">{campaign.creatorName || t('twibbon.anonymous', 'Anonim')}</span>
                      <span className="flex shrink-0 items-center gap-2">
                        <span className="inline-flex items-center gap-1" title={t('twibbon.views', 'Dilihat')}>
                          <Eye size={12} strokeWidth={1.75} aria-hidden="true" /> {angka(campaign.views)}
                        </span>
                        <span className="inline-flex items-center gap-1" title={t('twibbon.downloads', 'Dipakai')}>
                          <Download size={12} strokeWidth={1.75} aria-hidden="true" /> {angka(campaign.usage)}
                        </span>
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </PageContainer>
  );
}
