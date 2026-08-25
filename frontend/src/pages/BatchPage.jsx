import React from 'react';
import PageContainer from '../components/layout/PageContainer';
import BatchConvertSection from '../components/converter/BatchConvertSection';
import { useTranslation } from 'react-i18next';

export default function BatchPage() {
  const { t } = useTranslation();

  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-[26px] font-semibold text-primary tracking-tight">{t('batch.title', 'Konversi Massal')}</h1>
        <p className="text-[14px] text-secondary mt-1">{t('batch.subtitle', 'Konversi puluhan file secara bersamaan.')}</p>
      </div>
      <BatchConvertSection />
    </PageContainer>
  );
}
