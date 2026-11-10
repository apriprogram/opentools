import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeftRight, Sparkles, ChevronDown, Video, Image as ImageIcon, FileText, FileCode2, Music, Star, Moon, Sun, Globe, Menu, X, QrCode, LogIn, LayoutDashboard } from 'lucide-react';
import { fetchTools, fetchCompressors } from '../../services/converterApi';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { getStoredSession } from '../../services/authApi';
import { useTranslation } from 'react-i18next';

export default function Navbar({ onOpenBatchModal }) {
  const location = useLocation();
  const [categories, setCategories] = useState([]);
  const [compressorCategories, setCompressorCategories] = useState([]);
  const [activeMenu, setActiveMenu] = useState(null); // 'converters', 'compressors', or null
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const timeoutRef = useRef(null);
  const { theme, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const { user, loading: authLoading } = useAuth();

  // Tombol akun: tamu menuju halaman masuk, pengguna yang sudah masuk menuju panelnya.
  // Di halaman masuk atau daftar, parameter tujuan (?next, ?paket) ikut dibawa agar alurnya tidak terputus.
  const onAuthPage = location.pathname === '/masuk' || location.pathname === '/daftar';
  const accountPath = !user
    ? `/masuk${onAuthPage ? location.search : ''}`
    : user.role === 'superadmin' ? '/admin' : '/dashboard/qr';
  // Selama sesi masih diperiksa, token tersimpan berarti label yang akan muncul adalah "Dashboard".
  // Ruang tombol dipesan dengan lebar itu supaya header tidak bergeser saat sesi selesai diperiksa.
  const expectUser = Boolean(user) || (authLoading && Boolean(getStoredSession()?.token));
  const accountLabel = expectUser ? t('navbar.dashboard', 'Dashboard') : t('navbar.login', 'Masuk');
  const AccountIcon = expectUser ? LayoutDashboard : LogIn;

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
      <div className="w-full px-4 sm:px-6 md:px-8 h-[64px] flex items-center justify-between">
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
          
          {/* Desktop Nav Items. Muncul mulai lg: di bawah itu baris header tidak muat, jadi dipakai menu hamburger. */}
          <div className="hidden lg:flex items-center">
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

            {/* Twibbon Link */}
            <div className="relative h-[64px] flex items-center">
              <Link 
                to="/campaigns"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[14px] font-medium transition-smooth ${
                  location.pathname.startsWith('/campaigns') || location.pathname.startsWith('/c/') || location.pathname.startsWith('/twibbon')
                    ? 'text-primary bg-card-muted'
                    : 'text-primary hover:bg-card-muted'
                }`}
              >
                Twibbon
              </Link>
            </div>

            {/* QR Generator Link */}
            <div className="relative h-[64px] flex items-center">
              <Link
                to="/qr"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[14px] font-medium transition-smooth ${
                  location.pathname.startsWith('/qr') ? 'text-primary bg-card-muted' : 'text-primary hover:bg-card-muted'
                }`}
              >
                QR Generator
              </Link>
            </div>
          </div>

          {/* Unified Mega Menu Dropdown */}
          <div 
            className={`hidden lg:block fixed top-[64px] left-1/2 -translate-x-1/2 w-[90vw] lg:w-[860px] bg-card border border-border rounded-b-xl shadow-2xl overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] transform ${
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
              className="p-1.5 lg:hidden rounded-md text-secondary hover:text-primary hover:bg-card-muted transition-colors"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          {/* Tombol akun. Disembunyikan sampai sesi selesai diperiksa agar labelnya tidak berkedip. */}
          <Link
            to={accountPath}
            onClick={() => setIsMobileMenuOpen(false)}
            className={`hidden sm:inline-flex h-[32px] shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-accent-black px-[14px] text-[12px] font-medium leading-[16px] text-white transition-smooth hover:bg-accent-black-hover active:scale-[0.98] dark:bg-white dark:text-black dark:hover:bg-zinc-200 ${authLoading ? 'invisible' : ''}`}
          >
            <AccountIcon size={14} strokeWidth={1.75} />
            {accountLabel}
          </Link>
        </div>
      </div>
      
      {/* Mobile Menu Dropdown */}
      <div className={`lg:hidden absolute top-[64px] left-0 w-full bg-card border-b border-border shadow-lg p-4 flex flex-col gap-3 z-50 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] transform origin-top ${
        isMobileMenuOpen ? 'opacity-100 scale-y-100 visible pointer-events-auto' : 'opacity-0 scale-y-95 invisible pointer-events-none -translate-y-8'
      }`}>
        <Link 
          to="/converters" 
          onClick={() => setIsMobileMenuOpen(false)}
          className="text-[14px] text-primary p-3 bg-card-muted hover:bg-card border border-border rounded-md font-medium flex items-center gap-2 transition-colors"
        >
          <ArrowLeftRight size={18} className="text-primary" /> {t('navbar.all_converters', 'All Converters')}
        </Link>
        
        <Link 
          to="/compressors" 
          onClick={() => setIsMobileMenuOpen(false)}
          className="text-[14px] text-primary p-3 bg-card-muted hover:bg-card border border-border rounded-md font-medium flex items-center gap-2 transition-colors"
        >
          <Sparkles size={18} className="text-primary" /> {t('navbar.all_compressors', 'All Compressors')}
        </Link>

        <Link 
          to="/campaigns" 
          onClick={() => setIsMobileMenuOpen(false)}
          className="text-[14px] text-primary p-3 bg-card-muted hover:bg-card border border-border rounded-md font-medium flex items-center gap-2 transition-colors"
        >
          <ImageIcon size={18} className="text-primary" /> Twibbon Campaigns
        </Link>

        <Link 
          to="/linktree" 
          onClick={() => setIsMobileMenuOpen(false)}
          className="text-[14px] text-primary p-3 bg-card-muted hover:bg-card border border-border rounded-md font-medium flex items-center gap-2 transition-colors"
        >
          <Globe size={18} className="text-primary" /> Linktree Builder
        </Link>

        <Link
          to="/qr"
          onClick={() => setIsMobileMenuOpen(false)}
          className="text-[14px] text-primary p-3 bg-card-muted hover:bg-card border border-border rounded-md font-medium flex items-center gap-2 transition-colors"
        >
          <QrCode size={18} className="text-primary" /> QR Generator
        </Link>

        <Link
          to={accountPath}
          onClick={() => setIsMobileMenuOpen(false)}
          className={`mt-2 flex h-[44px] w-full items-center justify-center gap-2 rounded-md bg-accent-black text-[14px] font-medium text-white transition-smooth hover:bg-accent-black-hover dark:bg-white dark:text-black dark:hover:bg-zinc-200 ${authLoading ? 'invisible' : ''}`}
        >
          <AccountIcon size={16} strokeWidth={1.75} /> {accountLabel}
        </Link>
      </div>
    </header>
  );
}
