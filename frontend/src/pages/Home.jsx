import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, Loader2, Shield } from 'lucide-react';
import PageContainer from '../components/layout/PageContainer';
import StatsOverview from '../components/converter/StatsOverview';
import ConverterCategoryList from '../components/converter/ConverterCategoryList';
import Button from '../components/ui/Button';
import { fetchTools, fetchCompressors } from '../services/converterApi';
import { useTranslation, Trans } from 'react-i18next';

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [compressorCategories, setCompressorCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const [toolsData, compressorsData] = await Promise.all([
          fetchTools(),
          fetchCompressors()
        ]);
        if (toolsData && toolsData.categories) {
          setCategories(toolsData.categories);
        }
        if (compressorsData && compressorsData.categories) {
          setCompressorCategories(compressorsData.categories);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <PageContainer>
      {/* Hero Section */}
      <section className="mb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-border">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-card border border-border text-[12px] font-medium text-secondary mb-3">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <Shield size={14} className="text-secondary" />
              <span>{t('home.hero_badge', 'Offline-ready & Privacy First Engine')}</span>
            </div>
            <h1 className="text-[26px] sm:text-[32px] font-semibold text-primary tracking-tight leading-[36px] sm:leading-[42px]">
              <Trans 
                i18nKey="home.hero_title" 
                defaults="<1>Free</1> Convert & Compress Video, Audio & Images"
                components={{ 1: <span className="text-blue-500 font-semibold" /> }} 
              />
            </h1>
            <p className="text-[14px] text-secondary leading-[22px] max-w-[620px] mt-1.5">
              {t('home.hero_desc', 'High speed, clean file converter. Zero ads, zero watermarks, and powered by high-performance FFmpeg and Sharp engines.')}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              size="md"
              icon={Sparkles}
              onClick={() => {
                window.location.href = '/batch';
              }}
            >
              {t('home.batch_convert', 'Batch Convert')}
            </Button>
          </div>
        </div>
      </section>



      {/* Converter Categories & Search */}
      <section className="mb-12">
        <div className="mb-5">
          <h2 className="text-[22px] font-semibold text-primary tracking-tight">{t('home.converters_title', 'File Converters')}</h2>
          <p className="text-[13px] text-secondary mt-0.5">{t('home.converters_desc', 'Change formats instantly without losing quality.')}</p>
        </div>
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3 text-secondary">
            <Loader2 className="animate-spin" size={28} />
            <p className="text-[13px]">{t('home.loading', 'Loading tools...')}</p>
          </div>
        ) : (
          <ConverterCategoryList categories={categories} />
        )}
      </section>

      {/* Compressor Categories */}
      <section className="mb-12">
        <div className="mb-5 border-t border-border pt-12">
          <h2 className="text-[22px] font-semibold text-primary tracking-tight">{t('home.compressors_title', 'File Compressors')}</h2>
          <p className="text-[13px] text-secondary mt-0.5">{t('home.compressors_desc', 'Reduce file size dramatically for web and storage.')}</p>
        </div>
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3 text-secondary">
            <Loader2 className="animate-spin" size={28} />
            <p className="text-[13px]">{t('home.loading', 'Loading tools...')}</p>
          </div>
        ) : (
          <ConverterCategoryList categories={compressorCategories} isCompressor={true} />
        )}
      </section>
    </PageContainer>
  );
}
