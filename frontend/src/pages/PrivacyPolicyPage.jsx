import React from 'react';
import PageContainer from '../components/layout/PageContainer';
import Card from '../components/ui/Card';
import { Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function PrivacyPolicyPage() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith('en') ? 'en-US' : 'id-ID';

  return (
    <PageContainer>
      <div className="max-w-3xl mx-auto py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
            <Shield size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-primary">{t('legal.privacy.title')}</h1>
            <p className="text-secondary mt-1">{t('legal.last_updated', { date: new Date().toLocaleDateString(locale) })}</p>
          </div>
        </div>

        <Card className="p-8 space-y-6 text-[15px] leading-relaxed text-primary">
          <section>
            <h2 className="text-xl font-semibold mb-3">{t('legal.privacy.s1_title')}</h2>
            <p className="text-secondary">
              {t('legal.privacy.s1_p')}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">{t('legal.privacy.s2_title')}</h2>
            <ul className="list-disc pl-5 space-y-2 text-secondary">
              <li><strong>{t('legal.privacy.s2_li1_label')}</strong> {t('legal.privacy.s2_li1_text')}</li>
              <li><strong>{t('legal.privacy.s2_li2_label')}</strong> {t('legal.privacy.s2_li2_text')}</li>
              <li><strong>{t('legal.privacy.s2_li3_label')}</strong> {t('legal.privacy.s2_li3_text')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">{t('legal.privacy.s3_title')}</h2>
            <p className="text-secondary mb-2">
              {t('legal.privacy.s3_intro_before')} <strong>{t('legal.privacy.s3_intro_strong')}</strong> {t('legal.privacy.s3_intro_after')}
            </p>
            <ul className="list-disc pl-5 space-y-2 text-secondary">
              <li>{t('legal.privacy.s3_li1')}</li>
              <li>{t('legal.privacy.s3_li2')}</li>
              <li>{t('legal.privacy.s3_li3')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">{t('legal.privacy.s4_title')}</h2>
            <p className="text-secondary">
              {t('legal.privacy.s4_p')}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">{t('legal.privacy.s5_title')}</h2>
            <p className="text-secondary">
              {t('legal.privacy.s5_p')}
            </p>
          </section>
        </Card>
      </div>
    </PageContainer>
  );
}
