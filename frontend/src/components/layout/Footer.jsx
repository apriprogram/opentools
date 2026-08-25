import React from 'react';
import { ArrowLeftRight, Github } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export default function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-card border-t border-border mt-auto pb-20 sm:pb-8">
      <div className="max-w-[1140px] mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-6">
          
          {/* Logo & Info */}
          <div className="flex flex-col items-center md:items-start gap-3">
            <a href="https://apriprogram.web.id" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 group">
              <div className="w-[32px] h-[32px] flex items-center justify-center">
                <img src="/logo_opentools.png" alt="OpenTools Logo" className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col">
                <span className="text-[14px] font-semibold text-primary tracking-tight leading-[16px] hover:underline">
                  Apriprogram
                </span>
              </div>
            </a>
            <div className="flex flex-col gap-2 mt-1">
              <p className="text-[13px] text-secondary text-center md:text-left">
                {t('footer.support', 'Dukung pengembangan Open Source ini:')}
              </p>
              <a 
                href="https://github.com/apriprogram/opentools.git" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center justify-center md:justify-start gap-2 text-[13px] font-medium text-primary bg-card-muted hover:bg-border px-3 py-2 rounded-md transition-colors border border-border w-fit mx-auto md:mx-0"
              >
                <Github size={16} />
                <span>GitHub Repository</span>
              </a>
            </div>
          </div>

          {/* Copyright & Links */}
          <div className="flex flex-col items-center md:items-end gap-3 text-[13px] text-secondary">
            <div className="flex items-center gap-4">
              <Link to="/privacy" className="hover:text-primary transition-colors">{t('footer.privacy', 'Kebijakan Privasi')}</Link>
              <Link to="/terms" className="hover:text-primary transition-colors">{t('footer.terms', 'Syarat Ketentuan')}</Link>
              <a href="https://wa.me/6282181361433?text=Halo%20saya%20ingin%20konsultasi%20mengenai%20website%20OpenTools" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">{t('footer.contact', 'Kontak')}</a>
            </div>
            <div>
              &copy; {currentYear}{' '}
              <a href="https://apriprogram.web.id" target="_blank" rel="noopener noreferrer" className="hover:text-primary hover:underline transition-colors font-medium">
                Apriprogram
              </a>. {t('footer.rights', 'Hak cipta dilindungi undang-undang.')}
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
}
