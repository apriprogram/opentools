import React, { useState } from 'react';
import { X, Copy, Check, Heart, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from './Button';

export default function DonateModal({ isOpen, onClose }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const danaNumber = '082181361433';

  if (!isOpen) return null;

  const handleCopyDana = () => {
    navigator.clipboard.writeText(danaNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative w-full max-w-md bg-card rounded-2xl shadow-2xl border border-border overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
        <div className="p-5 border-b border-border flex items-center justify-between bg-card-muted/50">
          <div className="flex items-center gap-2 text-danger">
            <Heart size={20} className="fill-danger" />
            <h2 className="text-lg font-semibold text-primary">{t('donate.title', 'Dukung Proyek Kami')}</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-secondary hover:text-primary hover:bg-border rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <p className="text-[14px] text-secondary leading-relaxed text-center">
            {t('donate.desc', 'Jika alat ini bermanfaat bagi Anda, pertimbangkan untuk mendukung kami! Dukungan Anda membantu kami menjaga server tetap berjalan dan alat ini tetap gratis.')}
          </p>

          {/* DANA Option */}
          <div className="bg-card-muted rounded-xl p-4 border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-primary flex items-center gap-2">
                <img src="/Dana_logo.png" alt="DANA" className="h-4 object-contain" />
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div 
                className="flex-1 bg-card border border-border rounded-lg px-3 py-2 text-primary font-semibold text-[15px] tracking-wide"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                {danaNumber}
              </div>
              <Button 
                variant={copied ? 'primary' : 'secondary'}
                className={copied ? 'bg-success hover:bg-success border-success' : ''}
                icon={copied ? Check : Copy}
                onClick={handleCopyDana}
              >
                {copied ? t('donate.copied', 'Disalin') : t('donate.copy', 'Salin')}
              </Button>
            </div>
          </div>

          {/* PayPal Option */}
          <div className="bg-card-muted rounded-xl p-4 border border-border">
             <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-primary flex items-center gap-2">
                <img src="/PayPal.svg.webp" alt="PayPal" className="h-5 object-contain" />
              </span>
            </div>
            <Button 
              variant="primary" 
              className="w-full bg-[#00457C] hover:bg-[#003665] border-[#00457C] justify-center"
              icon={ExternalLink}
              onClick={() => window.open('https://www.paypal.com/ncp/payment/H37JU3FWZYST2', '_blank')}
            >
              {t('donate.paypal', 'Donasi via PayPal')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
