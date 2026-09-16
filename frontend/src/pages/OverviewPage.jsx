import React from 'react';
import { useTranslation } from 'react-i18next';
import PageContainer from '../components/layout/PageContainer';
import StatsOverview from '../components/converter/StatsOverview';

export default function OverviewPage() {
  const { t } = useTranslation();
  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-[26px] font-semibold text-primary tracking-tight">{t('overview.title', 'Platform Overview')}</h1>
        <p className="text-[14px] text-secondary mt-1">{t('overview.desc', 'Real-time statistics and engine status.')}</p>
      </div>
      <StatsOverview />
    </PageContainer>
  );
}
