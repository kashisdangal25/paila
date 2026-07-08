import { useState } from 'react';
import { Shield, Menu, Home, Compass, Map, Heart, Users, Bell, Settings, User, BookOpen, Journal } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { useI18n } from '../lib/i18n';
import { useTheme, useThemeColors } from '../lib/ThemeContext';
import { cn } from '../lib/utils';
import { Sidebar } from './Sidebar';
import { TodayTab } from './tabs/TodayTab';
import { DiscoverTab } from './tabs/DiscoverTab';
import { MapTab } from './tabs/MapTab';
import { PlannerTab } from './tabs/PlannerTab';
import { StoriesTab } from './tabs/StoriesTab';
import { SavedTab } from './tabs/SavedTab';
import { CommunityTab } from './tabs/CommunityTab';
import { NotificationsTab } from './tabs/NotificationsTab';
import { ProfileTab } from './tabs/ProfileTab';
import { SettingsTab } from './tabs/SettingsTab';
import { JournalTab } from './tabs/JournalTab';
import { AdminDashboard } from './AdminDashboard';
import { supabase } from '../lib/supabase';

interface DashboardProps {
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export default function Dashboard({ showToast }: DashboardProps) {
  const { user, signOut } = useAuth();
  const { t } = useI18n();
  const { theme } = useTheme();
  const colors = useThemeColors();
  const [activeTab, setActiveTab] = useState('today');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSOS, setShowSOS] = useState(false);
  const [adminMode, setAdminMode] = useState(false);

  const handleLogout = async () => {
    await signOut();
    showToast('Signed out. See you on the trail!', 'info');
  };

  const handleAdmin = () => {
    setAdminMode(true);
  };

  const exitAdmin = () => {
    setAdminMode(false);
  };

  const handleSOS = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            await supabase.from('sos_alerts').insert({
              user_id: user?.id,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              message: 'SOS triggered from Paila dashboard',
            });
            showToast('SOS alert sent! Emergency contacts notified.', 'error');
          } catch {
            showToast('Could not send SOS. Please try again.', 'error');
          } finally {
            setShowSOS(false);
          }
        },
        () => {
          showToast('Location permission denied. SOS needs your location.', 'error');
        }
      );
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'today':
        return <TodayTab />;
      case 'discover':
        return <DiscoverTab />;
      case 'map':
        return <MapTab />;
      case 'planner':
        return <PlannerTab />;
      case 'journal':
        return <JournalTab />;
      case 'stories':
        return <StoriesTab />;
      case 'saved':
        return <SavedTab />;
      case 'community':
        return <CommunityTab />;
      case 'notifications':
        return <NotificationsTab />;
      case 'profile':
        return <ProfileTab />;
      case 'settings':
        return <SettingsTab onLogout={handleLogout} onAdmin={handleAdmin} />;
      default:
        return <TodayTab />;
    }
  };

  // Admin Dashboard
  if (adminMode) {
    return <AdminDashboard onExit={exitAdmin} />;
  }

  const mobileNavItems = [
    { id: 'today', icon: Home },
    { id: 'discover', icon: Compass },
    { id: 'map', icon: Map },
    { id: 'saved', icon: Heart },
    { id: 'profile', icon: User },
  ];

  return (
    <div className={cn('flex h-screen', colors.bg)}>
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          onLogout={handleLogout}
        />
      </div>

      {/* Main Content Area */}
      <main
        className={cn(
          'flex-1 overflow-auto transition-all duration-300 relative',
          sidebarCollapsed ? 'md:ml-20' : 'md:ml-64'
        )}
      >
        {/* SOS Button */}
        <button
          onClick={() => setShowSOS(true)}
          className="fixed bottom-20 right-4 md:bottom-4 w-14 h-14 rounded-full bg-danger hover:bg-red-600 text-white shadow-lg flex items-center justify-center z-50 transition-all hover:scale-105"
          title="Emergency SOS"
        >
          <Shield className="w-6 h-6" />
        </button>

        {/* Mobile Header */}
        <div className="md:hidden sticky top-0 z-30">
          <div className={cn(
            'flex items-center justify-between px-4 py-3 border-b',
            colors.bgSecondary,
            colors.border,
            'backdrop-blur-md bg-opacity-90'
          )}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-forest-500 to-forest-700 flex items-center justify-center text-white font-bold text-sm">
                P
              </div>
              <span className={cn('font-display font-bold', colors.text)}>Paila</span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={cn('p-2 rounded-lg', colors.text)}
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className={cn(
          'min-h-full pb-20 md:pb-0',
          colors.bg
        )}>
          {renderContent()}
        </div>

        {/* Footer */}
        <footer className={cn('hidden md:block text-center py-3 text-xs border-t', colors.border, colors.textMuted)}>
          © 2026 Paila — Walk with confidence
        </footer>

        {/* Mobile Bottom Navigation */}
        <nav className={cn(
          'md:hidden fixed bottom-0 left-0 right-0 z-40 border-t',
          colors.bgSecondary,
          colors.border
        )}>
          <div className="grid grid-cols-5 gap-1 px-2 py-2">
            {mobileNavItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  'flex flex-col items-center gap-1 py-2 rounded-xl transition-all',
                  activeTab === item.id
                    ? 'text-forest-600 bg-forest-50 dark:bg-forest-900/30'
                    : colors.textMuted
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{t(`nav.${item.id === 'today' ? 'home' : item.id}`)}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/50 z-50 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className={cn(
              'fixed top-0 right-0 h-full w-64 z-50 p-4 shadow-xl md:hidden',
              colors.bgSecondary
            )}>
              <div className="flex items-center justify-between mb-6">
                <span className={cn('font-display font-bold', colors.text)}>Menu</span>
                <button onClick={() => setMobileMenuOpen(false)} className={colors.text}>
                  ✕
                </button>
              </div>
              <div className="space-y-1">
                {[
                  { id: 'today', icon: Home },
                  { id: 'discover', icon: Compass },
                  { id: 'map', icon: Map },
                  { id: 'planner', icon: Calendar },
                  { id: 'journal', icon: BookOpen },
                  { id: 'stories', icon: BookOpen },
                  { id: 'saved', icon: Heart },
                  { id: 'community', icon: Users },
                  { id: 'notifications', icon: Bell },
                  { id: 'settings', icon: Settings },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                      activeTab === item.id
                        ? 'bg-forest-600 text-white'
                        : colors.textSecondary
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    {t(`nav.${item.id === 'today' ? 'home' : item.id}`)}
                  </button>
                ))}
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 mt-4'
                  )}
                >
                  Log out
                </button>
              </div>
            </div>
          </>
        )}
      </main>

      {/* SOS Confirmation Modal */}
      {showSOS && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
          <div className={cn(
            'w-full max-w-sm rounded-2xl p-6 text-center',
            colors.card
          )}>
            <div className="w-16 h-16 rounded-full bg-red-100 mx-auto flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-danger" />
            </div>
            <h2 className={cn('text-xl font-display font-bold mb-2', colors.text)}>Emergency SOS</h2>
            <p className={cn('text-sm mb-6', colors.textSecondary)}>
              This will alert emergency contacts with your current location. Only use in real emergencies.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSOS(false)}
                className="flex-1 py-3 rounded-xl border font-semibold text-stone-600 hover:bg-stone-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSOS}
                className="flex-1 py-3 rounded-xl bg-danger text-white font-semibold hover:bg-red-600 transition-colors"
              >
                Send SOS
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
