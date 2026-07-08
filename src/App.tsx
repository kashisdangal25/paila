import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { ThemeProvider } from './lib/ThemeContext';
import { I18nProvider } from './lib/i18n';
import LandingPage from './components/LandingPage';
import Dashboard from './components/NewDashboard';
import VendorDashboard from './components/VendorDashboard';
import VendorOnboarding from './components/VendorOnboarding';
import AuthModal from './components/AuthModal';
import { ToastContainer } from './components/Toast';

function AppContent() {
  const { user, loading, userType, profile, isDemo, demoLogin } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [toasts, setToasts] = useState<Array<{ id: number; message: string; type: 'success' | 'error' | 'info' }>>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const openAuthModal = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  const handleDemoLogin = (type: 'traveler' | 'vendor') => {
    demoLogin(type);
    setShowAuthModal(false);
    if (type === 'traveler') {
      showToast('Welcome to Paila, Suman!', 'success');
    } else {
      showToast('Welcome to Paila, Nima!', 'success');
    }
  };

  // Check if vendor needs onboarding (skip for demo vendor since they have a pre-built profile)
  useEffect(() => {
    if (user && userType === 'vendor' && !isDemo) {
      const onboardingComplete = localStorage.getItem('vendor_onboarding_complete');
      if (!onboardingComplete) {
        setShowOnboarding(true);
      }
    }
  }, [user, userType, isDemo]);

  const handleOnboardingComplete = () => {
    localStorage.setItem('vendor_onboarding_complete', 'true');
    setShowOnboarding(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-forest-700 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-forest-500 border-t-white rounded-full animate-spin mb-4 mx-auto"></div>
          <p className="text-forest-200 text-sm">Loading Paila...</p>
        </div>
      </div>
    );
  }

  // Show onboarding for new vendors (not demo)
  if (showOnboarding && user && userType === 'vendor' && !isDemo) {
    return (
      <VendorOnboarding
        onComplete={handleOnboardingComplete}
        onSkip={handleOnboardingComplete}
      />
    );
  }

  const isLoggedIn = user || (isDemo && profile);

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-forest-900 transition-colors">
      {isLoggedIn ? (
        userType === 'vendor' ? (
          <VendorDashboard />
        ) : (
          <Dashboard showToast={showToast} />
        )
      ) : (
        <LandingPage
          openAuthModal={openAuthModal}
          showToast={showToast}
        />
      )}

      <AuthModal
        isOpen={showAuthModal}
        mode={authMode}
        onClose={() => setShowAuthModal(false)}
        showToast={showToast}
        onDemoLogin={handleDemoLogin}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}

export default App;
