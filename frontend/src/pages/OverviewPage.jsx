import React from 'react';
import PageContainer from '../components/layout/PageContainer';
import StatsOverview from '../components/converter/StatsOverview';

export default function OverviewPage() {
  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-[26px] font-semibold text-primary tracking-tight">Platform Overview</h1>
        <p className="text-[14px] text-secondary mt-1">Real-time statistics and engine status.</p>
      </div>
      <StatsOverview />
    </PageContainer>
  );
}
