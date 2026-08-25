import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import BottomNav from './components/layout/BottomNav';
import Footer from './components/layout/Footer';
import Home from './pages/Home';
import ConvertPage from './pages/ConvertPage';
import OverviewPage from './pages/OverviewPage';
import BatchPage from './pages/BatchPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import DonateModal from './components/ui/DonateModal';
import { useNavigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { recordVisit } from './services/converterApi';
import ErrorBoundary from './components/ui/ErrorBoundary';
import './i18n';

function AppContent() {
  const [isDonateModalOpen, setIsDonateModalOpen] = useState(false);
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

  const handleOpenBatch = () => {
    navigate('/batch');
  };

  const scrollToStats = () => {
    navigate('/overview');
  };

  const handleOpenDonate = () => {
    setIsDonateModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-page text-primary flex flex-col font-sans selection:bg-accent-black selection:text-white">
      {/* Navbar */}
      <Navbar onOpenBatchModal={handleOpenBatch} onOpenDonate={handleOpenDonate} />

      {/* Dynamic Pages */}
      <div key={location.pathname} className="flex-1 animate-in fade-in slide-in-from-top-4 duration-500 fill-mode-forwards">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/overview" element={<OverviewPage />} />
          <Route path="/convert/:type" element={<ConvertPage />} />
          <Route path="/compress/:type" element={<ConvertPage />} />
          <Route path="/batch" element={<BatchPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsOfServicePage />} />
        </Routes>
      </div>

      {/* Footer */}
      <Footer />

      {/* Donate Modal */}
      <DonateModal 
        isOpen={isDonateModalOpen} 
        onClose={() => setIsDonateModalOpen(false)} 
      />

      {/* Floating Bottom Navigation */}
      <BottomNav
        onOpenBatchModal={handleOpenBatch}
        onScrollToStats={scrollToStats}
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <Router>
          <AppContent />
        </Router>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
