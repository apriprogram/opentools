import React from 'react';
import PageContainer from '../components/layout/PageContainer';
import Card from '../components/ui/Card';
import { FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function TermsOfServicePage() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith('en') ? 'en-US' : 'id-ID';

  return (
    <PageContainer>
      <div className="max-w-3xl mx-auto py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
            <FileText size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-primary">{t('legal.terms.title')}</h1>
            <p className="text-secondary mt-1">{t('legal.last_updated', { date: new Date().toLocaleDateString(locale) })}</p>
          </div>
        </div>

        <Card className="p-8 space-y-6 text-[15px] leading-relaxed text-primary">
          <section>
            <h2 className="text-xl font-semibold mb-3">{t('legal.terms.s1_title')}</h2>
            <p className="text-secondary">
              {t('legal.terms.s1_p')}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">{t('legal.terms.s2_title')}</h2>
            <p className="text-secondary mb-2">
              {t('legal.terms.s2_p')}
            </p>
            <ul className="list-disc pl-5 space-y-2 text-secondary">
              <li>{t('legal.terms.s2_li1')}</li>
              <li>{t('legal.terms.s2_li2')}</li>
              <li>{t('legal.terms.s2_li3')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">{t('legal.terms.s3_title')}</h2>
            <p className="text-secondary">
              {t('legal.terms.s3_p')}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">{t('legal.terms.s4_title')}</h2>
            <p className="text-secondary">
              {t('legal.terms.s4_p')}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">{t('legal.terms.s5_title')}</h2>
            <p className="text-secondary">
              {t('legal.terms.s5_p')}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">{t('legal.terms.s6_title')}</h2>
            <p className="text-secondary">
              {t('legal.terms.s6_p')}
            </p>
          </section>
        </Card>
      </div>
    </PageContainer>
  );
}
