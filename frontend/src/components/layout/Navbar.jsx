import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeftRight, Sparkles, ChevronDown, Video, Image as ImageIcon, FileText, FileCode2, Music, Star, Moon, Sun, Globe, Heart, Menu, X } from 'lucide-react';
import Button from '../ui/Button';
import { fetchTools, fetchCompressors } from '../../services/converterApi';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

export default function Navbar({ onOpenBatchModal, onOpenDonate }) {
  const location = useLocation();
  const [categories, setCategories] = useState([]);
  const [compressorCategories, setCompressorCategories] = useState([]);
  const [activeMenu, setActiveMenu] = useState(null); // 'converters', 'compressors', or null
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const timeoutRef = useRef(null);
  const { theme, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const nextLang = i18n.language.startsWith('en') ? 'id' : 'en';
    i18n.changeLanguage(nextLang);
  };

  useEffect(() => {
    async function loadData() {
      try {
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
        console.error('Failed to load categories for navbar:', err);
      }
    }
    loadData();
  }, []);

  const handleMouseEnter = (menu) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveMenu(menu);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setActiveMenu(null);
    }, 150);
  };

  const getIcon = (iconName) => {
    switch (iconName) {
      case 'video': return <Video size={16} strokeWidth={2} />;
      case 'image': return <ImageIcon size={16} strokeWidth={2} />;
      case 'file-text': return <FileText size={16} strokeWidth={2} />;
      default: return <FileCode2 size={16} strokeWidth={2} />;
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/75 dark:bg-[#18181b]/75 backdrop-blur-xl border-b border-border transition-smooth select-none">
      <div className="max-w-[1140px] mx-auto px-4 sm:px-6 h-[64px] flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-[28px] h-[28px] flex items-center justify-center">
            <img src="/logo_opentools.png" alt="OpenTools Logo" className="w-full h-full object-contain brightness-0 dark:invert" />
          </div>
          <div className="flex flex-col">
            <span className="text-[15px] font-semibold text-primary tracking-tight leading-[18px]">
              {t('navbar.title', 'OPENTOOLS')}
            </span>
          </div>
        </Link>

        {/* Center / Right Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          
          {/* Desktop Nav Items */}
          <div className="hidden md:flex items-center">
            {/* Converters Trigger */}
            <div 
              className="relative h-[64px] flex items-center"
              onMouseEnter={() => handleMouseEnter('converters')}
              onMouseLeave={handleMouseLeave}
            >
              <button 
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[14px] font-medium transition-smooth ${
                  activeMenu === 'converters' ? 'text-primary' : 'text-primary'
                } hover:bg-card-muted`}
              >
                {t('navbar.all_converters', 'All Converters')}
                <ChevronDown size={14} className={`transition-transform duration-200 ${activeMenu === 'converters' ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Compressors Trigger */}
            <div 
              className="relative h-[64px] flex items-center"
              onMouseEnter={() => handleMouseEnter('compressors')}
              onMouseLeave={handleMouseLeave}
            >
              <button 
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[14px] font-medium transition-smooth ${
                  activeMenu === 'compressors' ? 'text-primary' : 'text-primary'
                } hover:bg-card-muted`}
              >
                {t('navbar.all_compressors', 'All Compressors')}
                <ChevronDown size={14} className={`transition-transform duration-200 ${activeMenu === 'compressors' ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {/* Unified Mega Menu Dropdown */}
          <div 
            className={`hidden md:block fixed top-[64px] left-1/2 -translate-x-1/2 w-[90vw] md:w-[700px] lg:w-[860px] bg-card border border-border rounded-b-xl shadow-2xl overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] transform ${
              (activeMenu === 'converters' || activeMenu === 'compressors') 
                ? 'opacity-100 translate-y-0 visible pointer-events-auto' 
                : 'opacity-0 -translate-y-8 invisible pointer-events-none'
            }`}
            style={{
              boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08)'
            }}
            onMouseEnter={() => {
              if (timeoutRef.current) clearTimeout(timeoutRef.current);
            }}
            onMouseLeave={handleMouseLeave}
          >
            {/* Converters Content */}
            {activeMenu === 'converters' && categories.length > 0 && (
              <div className="flex flex-wrap md:flex-nowrap w-full transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
                {categories.map((cat, idx) => (
                  <div 
                    key={cat.id} 
                    className={`flex-1 min-w-[200px] p-5 ${idx !== categories.length - 1 ? 'border-b md:border-b-0 md:border-r border-border' : ''}`}
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <div className="text-primary bg-card-muted p-1 rounded">
                        {getIcon(cat.icon)}
                      </div>
                      <h3 className="text-[14px] font-semibold text-primary">
                        {cat.label}
                      </h3>
                    </div>
                    <div className="flex flex-col space-y-1">
                      {cat.tools.slice(0, 10).map((tool) => (
                        <Link
                          key={tool.id}
                          to={`/convert/${tool.id}`}
                          onClick={() => setActiveMenu(null)}
                          className={`text-[13px] text-secondary hover:text-primary hover:bg-card-muted px-2 py-1.5 rounded-sm transition-colors flex items-center justify-between group border ${tool.popular ? 'border-yellow-500 hover:border-yellow-600' : 'border-transparent'}`}
                        >
                          <span className="truncate">{tool.label}</span>
                          {tool.popular && (
                            <Star size={14} strokeWidth={2} className="text-yellow-400 fill-yellow-400 shrink-0 ml-2" />
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Compressors Content */}
            {activeMenu === 'compressors' && compressorCategories.length > 0 && (
              <div className="flex flex-wrap md:flex-nowrap w-full transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
                {compressorCategories.map((cat, idx) => (
                  <div 
                    key={cat.id} 
                    className={`flex-1 min-w-[200px] p-5 ${idx !== compressorCategories.length - 1 ? 'border-b md:border-b-0 md:border-r border-border' : ''}`}
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <div className="text-primary bg-card-muted p-1 rounded">
                        {getIcon(cat.icon)}
                      </div>
                      <h3 className="text-[14px] font-semibold text-primary">
                        {cat.label}
                      </h3>
                    </div>
                    <div className="flex flex-col space-y-1">
                      {cat.tools.slice(0, 10).map((tool) => (
                        <Link
                          key={tool.id}
                          to={`/compress/${tool.id}`}
                          onClick={() => setActiveMenu(null)}
                          className={`text-[13px] text-secondary hover:text-primary hover:bg-card-muted px-2 py-1.5 rounded-sm transition-colors flex items-center justify-between group border ${tool.popular ? 'border-yellow-500 hover:border-yellow-600' : 'border-transparent'}`}
                        >
                          <span className="truncate">{tool.label}</span>
                          {tool.popular && (
                            <Star size={14} strokeWidth={2} className="text-yellow-400 fill-yellow-400 shrink-0 ml-2" />
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 mx-1 md:mx-2 border-l border-border pl-1 md:pl-2">
            <button
              onClick={toggleLanguage}
              className="p-1.5 rounded-md text-secondary hover:text-primary hover:bg-card-muted transition-colors flex items-center gap-1.5"
              title="Change Language"
            >
              <Globe size={16} />
              <span className="text-[12px] font-medium uppercase">{i18n.language?.substring(0, 2) || 'en'}</span>
            </button>
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-md text-secondary hover:text-primary hover:bg-card-muted transition-colors"
              title="Toggle Dark Mode"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1.5 md:hidden rounded-md text-secondary hover:text-primary hover:bg-card-muted transition-colors"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          <Button
            variant="secondary"
            size="sm"
            pill
            icon={Heart}
            onClick={onOpenDonate}
            className="hidden sm:inline-flex text-danger hover:text-danger hover:bg-danger/10 border-danger/20"
          >
            {t('navbar.donate', 'Donate')}
          </Button>
        </div>
      </div>
      
      {/* Mobile Menu Dropdown */}
      <div className={`md:hidden absolute top-[64px] left-0 w-full bg-card border-b border-border shadow-lg p-4 flex flex-col gap-4 z-50 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] transform origin-top ${
        isMobileMenuOpen ? 'opacity-100 scale-y-100 visible pointer-events-auto' : 'opacity-0 scale-y-95 invisible pointer-events-none -translate-y-8'
      }`}>
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold text-secondary uppercase tracking-wider">{t('navbar.all_converters', 'All Converters')}</span>
          <div className="grid grid-cols-2 gap-2">
            {categories.flatMap(c => c.tools).slice(0, 6).map(tool => (
              <Link key={tool.id} to={`/convert/${tool.id}`} onClick={() => setIsMobileMenuOpen(false)} className="text-[13px] text-primary p-2 bg-card-muted rounded-md truncate border border-border flex items-center gap-2">
                <span className="truncate">{tool.label}</span>
                {tool.popular && <Star size={12} className="text-yellow-500 fill-yellow-500 shrink-0" />}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2 mt-2">
          <span className="text-xs font-bold text-secondary uppercase tracking-wider">{t('navbar.all_compressors', 'All Compressors')}</span>
          <div className="grid grid-cols-2 gap-2">
            {compressorCategories.flatMap(c => c.tools).slice(0, 4).map(tool => (
              <Link key={tool.id} to={`/compress/${tool.id}`} onClick={() => setIsMobileMenuOpen(false)} className="text-[13px] text-primary p-2 bg-card-muted rounded-md truncate border border-border flex items-center gap-2">
                <span className="truncate">{tool.label}</span>
                {tool.popular && <Star size={12} className="text-yellow-500 fill-yellow-500 shrink-0" />}
              </Link>
            ))}
          </div>
        </div>
        <Button variant="secondary" className="w-full mt-2 justify-center" onClick={() => { setIsMobileMenuOpen(false); onOpenDonate(); }}>
          <Heart size={16} className="text-danger mr-1" /> {t('navbar.donate', 'Donate')}
        </Button>
      </div>
    </header>
  );
}
