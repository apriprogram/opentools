import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import BrandLogo from '../ui/BrandLogo';

export default function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-white/60 bg-white/40 backdrop-blur-xl mt-auto pb-16 sm:pb-8 dark:border-white/10 dark:bg-zinc-950/40">
      <div className="w-full px-4 sm:px-6 md:px-8 py-4 sm:py-8">
        <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-2.5 sm:gap-6">
          
          {/* Logo & Info */}
          <div className="flex flex-col items-center md:items-start gap-3">
            <div className="flex items-center gap-2 sm:gap-2.5">
              <div className="flex h-[16px] w-[26px] sm:h-[24px] sm:w-[39px] items-center justify-center">
                <BrandLogo className="h-full w-full text-primary" title="Logo Garudanexa" />
              </div>
              <span className="text-[12px] sm:text-[14px] font-semibold leading-[16px] tracking-tight text-primary">
                PT. Garuda Nexa Bahtera
              </span>
            </div>
          </div>

          {/* Copyright & Links */}
          <div className="flex flex-col items-center md:items-end gap-1.5 sm:gap-3 text-center text-[11px] sm:text-[13px] md:text-right text-secondary">
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 sm:gap-4">
              <Link to="/privacy" className="hover:text-primary transition-colors">{t('footer.privacy', 'Kebijakan Privasi')}</Link>
              <Link to="/terms" className="hover:text-primary transition-colors">{t('footer.terms', 'Syarat Ketentuan')}</Link>
              <a href="https://wa.me/6282181361433?text=Halo%20saya%20ingin%20konsultasi%20mengenai%20website%20OpenTools" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">{t('footer.contact', 'Kontak')}</a>
            </div>
            <div>
              &copy; {currentYear}{' '}
              <span className="font-medium text-primary">PT. Garuda Nexa Bahtera</span>. {t('footer.rights', 'Hak cipta dilindungi undang-undang.')}
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
}
