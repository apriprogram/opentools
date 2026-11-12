import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import BottomNav from './components/layout/BottomNav';
import Footer from './components/layout/Footer';
import Home from './pages/Home';
import ConvertersPage from './pages/ConvertersPage';
import CompressorsPage from './pages/CompressorsPage';
import ConvertPage from './pages/ConvertPage';
import CampaignsListPage from './pages/CampaignsListPage';
import TwibbonViewPage from './pages/TwibbonViewPage';
import OverviewPage from './pages/OverviewPage';
import BatchPage from './pages/BatchPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import LinktreeLandingPage from './pages/LinktreeLandingPage';
import LinktreePublicPage from './pages/LinktreePublicPage';
import UserLinktreePage from './pages/panel/UserLinktreePage';
import UserTwibbonPage from './pages/panel/UserTwibbonPage';
import TwibbonEditorPage from './pages/panel/TwibbonEditorPage';
import LinktreeEditorPage from './pages/panel/LinktreeEditorPage';
import QrGeneratorPage from './pages/QrGeneratorPage';
import QrPricingPage from './pages/QrPricingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import UserQrPage from './pages/panel/UserQrPage';
import AdminPanelPage from './pages/panel/AdminPanelPage';
import AdminLinktreePage from './pages/panel/AdminLinktreePage';
import AdminSettingsPage from './pages/panel/AdminSettingsPage';
import AdminUsersPage from './pages/panel/AdminUsersPage';
import AdminStatsPage from './pages/panel/AdminStatsPage';
import AdminTwibbonPage from './pages/panel/AdminTwibbonPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { recordVisit } from './services/converterApi';
import ErrorBoundary from './components/ui/ErrorBoundary';
import { ToastProvider } from './components/ui/Toast';
import VersionWatcher from './components/ui/VersionWatcher';
import './i18n';

// Halaman panel hanya bisa dibuka oleh peran yang sesuai. Peran lain diarahkan ke panelnya.
// Super admin juga boleh membuka dashboard pengguna (QR, Linktree, Twibbon miliknya sendiri);
// sebaliknya, akun user tidak bisa membuka halaman admin.
function RequireRole({ role, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="p-10 text-center text-[13px] text-tertiary">Memuat...</div>;
  if (!user) return <Navigate to={`/masuk?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  const allowed = user.role === role || user.role === 'superadmin';
  if (!allowed) return <Navigate to="/dashboard/qr" replace />
  return children;
}

// Menu panel user kini satu: QR Generator. Tautan lama /dashboard dan /dashboard/pesan dialihkan ke sana.
function RedirectPesan() {
  const { search } = useLocation();
  return <Navigate to={`/dashboard/qr${search}`} replace />;
}

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const trackVisit = async () => {
      if (!sessionStorage.getItem('visited')) {
        try {
          const res = await fetch('https://ipapi.co/json/');
          const data = await res.json();
          const country = data.country_name || 'Unknown';
          await recordVisit(country);
          sessionStorage.setItem('visited', 'true');
        } catch (err) {
          console.error('Failed to track visit:', err);
        }
      }
    };
    trackVisit();
  }, []);

  // Halaman panel (dashboard user dan admin) memakai tata letak sendiri, tanpa navbar dan menu bawah.
  // Halaman publik Linktree (/l/:slug) juga tampil tanpa navbar, seperti halaman tersendiri.
  const isPanel =
    location.pathname.startsWith('/admin') || location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/l/');

  // Dashboard pengguna dan panel admin memakai latar bersuasana seperti halaman publik.
  const isDashboard = location.pathname.startsWith('/admin') || location.pathname.startsWith('/dashboard');

  const handleOpenBatch = () => {
    navigate('/batch');
  };

  const scrollToStats = () => {
    navigate('/overview');
  };

  return (
    <div className={`min-h-screen text-primary flex flex-col font-sans selection:bg-accent-black selection:text-white ${isDashboard ? 'panel-ambient' : isPanel ? 'bg-page' : 'site-ambient'}`}>
      {/* Navbar */}
      {/* Tab yang masih memakai versi lama dimuat ulang setelah ada deploy */}
      <VersionWatcher />
      {!isPanel && <Navbar onOpenBatchModal={handleOpenBatch} />}

      {/* Dynamic Pages */}
      <div key={location.pathname} className="flex-1 animate-in fade-in slide-in-from-top-4 duration-500 fill-mode-forwards">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/converters" element={<ConvertersPage />} />
          <Route path="/compressors" element={<CompressorsPage />} />
          <Route path="/twibbon/create" element={<Navigate to="/dashboard/twibbon/baru" replace />} />
          <Route path="/campaigns" element={<CampaignsListPage />} />
          <Route path="/c/:slug" element={<TwibbonViewPage />} />
          <Route path="/overview" element={<OverviewPage />} />
          <Route path="/convert/:type" element={<ConvertPage />} />
          <Route path="/compress/:type" element={<ConvertPage />} />
          <Route path="/batch" element={<BatchPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsOfServicePage />} />
          <Route path="/linktree" element={<LinktreeLandingPage />} />
          <Route path="/l/:slug" element={<LinktreePublicPage />} />
          <Route path="/qr" element={<QrGeneratorPage />} />
          <Route path="/qr/harga" element={<QrPricingPage />} />
          <Route path="/masuk" element={<LoginPage />} />
          <Route path="/daftar" element={<RegisterPage />} />
          <Route path="/dashboard" element={<Navigate to="/dashboard/qr" replace />} />
          <Route path="/dashboard/qr" element={<RequireRole role="user"><UserQrPage /></RequireRole>} />
          <Route path="/dashboard/pesan" element={<RedirectPesan />} />
          <Route path="/dashboard/twibbon" element={<RequireRole role="user"><UserTwibbonPage /></RequireRole>} />
          <Route path="/dashboard/twibbon/baru" element={<RequireRole role="user"><TwibbonEditorPage /></RequireRole>} />
          <Route path="/dashboard/twibbon/:id" element={<RequireRole role="user"><TwibbonEditorPage /></RequireRole>} />
          <Route path="/dashboard/linktree" element={<RequireRole role="user"><UserLinktreePage /></RequireRole>} />
          <Route path="/dashboard/linktree/:id" element={<RequireRole role="user"><LinktreeEditorPage /></RequireRole>} />
          <Route path="/admin" element={<RequireRole role="superadmin"><AdminPanelPage /></RequireRole>} />
          <Route path="/admin/linktree" element={<RequireRole role="superadmin"><AdminLinktreePage /></RequireRole>} />
          <Route path="/admin/twibbon" element={<RequireRole role="superadmin"><AdminTwibbonPage /></RequireRole>} />
          <Route path="/admin/statistik" element={<RequireRole role="superadmin"><AdminStatsPage /></RequireRole>} />
          <Route path="/admin/users" element={<RequireRole role="superadmin"><AdminUsersPage /></RequireRole>} />
          <Route path="/admin/pengaturan" element={<RequireRole role="superadmin"><AdminSettingsPage /></RequireRole>} />
          <Route path="/admin/qr" element={<Navigate to="/admin" replace />} />
        </Routes>
      </div>

      {/* Footer */}
      {!isPanel && <Footer />}

      {/* Floating Bottom Navigation */}
      {!isPanel && (
        <BottomNav
          onOpenBatchModal={handleOpenBatch}
          onScrollToStats={scrollToStats}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <Router>
          <ToastProvider>
            <AuthProvider>
              <AppContent />
            </AuthProvider>
          </ToastProvider>
        </Router>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
