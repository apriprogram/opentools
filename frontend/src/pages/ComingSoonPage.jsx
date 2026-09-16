import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from '../components/ui/Button';
import PageContainer from '../components/layout/PageContainer';

export default function ComingSoonPage({ toolName = 'Fitur Baru' }) {
  const { t } = useTranslation();

  return (
    <PageContainer>
      <section className="mb-12 pt-6">
        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-medium mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
              {t('coming_soon.status', 'Dalam Pengembangan')}
            </div>
            <h1 className="text-[26px] sm:text-[32px] font-semibold text-primary tracking-tight leading-[36px] sm:leading-[42px]">
              {toolName}
            </h1>
            <p className="text-[14px] text-secondary leading-[22px] max-w-[620px] mt-2">
              {t('coming_soon.desc', 'Fitur ini sedang dalam pengembangan aktif (COMING SOON) dan akan segera hadir. Pantau terus update terbaru dari kami!')}
            </p>
          </div>
          <Link to="/" className="shrink-0">
            <Button variant="secondary" icon={ArrowLeft}>
              {t('common.back', 'Kembali')}
            </Button>
          </Link>
        </div>
        
        <div className="w-full bg-card border border-border rounded-xl p-6 mb-8 max-w-lg">
          <div className="flex justify-between text-xs text-secondary mb-2">
            <span>{t('coming_soon.progress', 'Progress Pengembangan')}</span>
            <span className="text-purple-400 font-medium">60%</span>
          </div>
          <div className="h-2 bg-card-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-purple-500 to-violet-500 transition-all duration-1000"
              style={{ width: '60%' }}
            />
          </div>
        </div>

      </section>
    </PageContainer>
  );
}
