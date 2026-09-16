import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import PageContainer from '../components/layout/PageContainer';
import ConverterCategoryList from '../components/converter/ConverterCategoryList';
import { fetchCompressors } from '../services/converterApi';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Button from '../components/ui/Button';

export default function CompressorsPage() {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const compressorsData = await fetchCompressors();
        if (compressorsData && compressorsData.categories) {
          setCategories(compressorsData.categories);
        }
      } catch (err) {
        console.error('Failed to load compressor categories:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <PageContainer>
      <section className="mb-12 pt-6">
        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-[26px] sm:text-[32px] font-semibold text-primary tracking-tight leading-[36px] sm:leading-[42px]">
              {t('home.compressors_title', 'File Compressors')}
            </h1>
            <p className="text-[14px] text-secondary leading-[22px] max-w-[620px] mt-2">
              {t('home.compressors_desc', 'Reduce file size dramatically for web and storage without losing perceived quality.')}
            </p>
          </div>
          <Link to="/" className="shrink-0">
            <Button variant="secondary" icon={ArrowLeft}>
              {t('common.back', 'Kembali')}
            </Button>
          </Link>
        </div>
        
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3 text-secondary">
            <Loader2 className="animate-spin" size={28} />
            <p className="text-[13px]">{t('home.loading', 'Loading tools...')}</p>
          </div>
        ) : (
          <ConverterCategoryList categories={categories} isCompressor={true} />
        )}

      </section>
    </PageContainer>
  );
}
