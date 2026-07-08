import {
  Home, Compass, Map, Calendar, BookOpen, Heart, Users, Bell, User, Settings, LogOut, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useI18n } from '../lib/i18n';
import { useThemeColors } from '../lib/ThemeContext';
import { cn } from '../lib/utils';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  onLogout: () => void;
}

const navItems = [
  { id: 'today', icon: Home, labelKey: 'nav.home' },
  { id: 'discover', icon: Compass, labelKey: 'nav.discover' },
  { id: 'map', icon: Map, labelKey: 'nav.map' },
  { id: 'planner', icon: Calendar, labelKey: 'nav.planner' },
  { id: 'stories', icon: BookOpen, labelKey: 'nav.stories' },
  { id: 'saved', icon: Heart, labelKey: 'nav.saved' },
  { id: 'community', icon: Users, labelKey: 'nav.community' },
  { id: 'notifications', icon: Bell, labelKey: 'nav.notifications' },
];

const bottomItems = [
  { id: 'profile', icon: User, labelKey: 'nav.profile' },
  { id: 'settings', icon: Settings, labelKey: 'nav.settings' },
  { id: 'logout', icon: LogOut, labelKey: 'nav.logout' },
];

export function Sidebar({ activeTab, setActiveTab, collapsed, setCollapsed, onLogout }: SidebarProps) {
  const { t } = useI18n();
  const colors = useThemeColors();

  const handleNavClick = (id: string) => {
    if (id === 'logout') {
      onLogout();
    } else {
      setActiveTab(id);
    }
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen z-40 flex flex-col',
        'border-r transition-all duration-300',
        collapsed ? 'w-20' : 'w-64',
        colors.bgSecondary,
        colors.border
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center h-16 px-4 border-b', colors.border)}>
        <div className="flex items-center gap-3">
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg', collapsed ? 'bg-forest-600' : 'bg-gradient-to-br from-forest-500 to-forest-700')}>
            P
          </div>
          {!collapsed && (
            <div>
              <h1 className={cn('font-display font-bold text-lg', colors.text)}>Paila</h1>
              <p className={cn('text-xs', colors.textMuted)}>Walk with confidence</p>
            </div>
          )}
        </div>
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={cn(
          'absolute -right-3 top-20 w-6 h-6 rounded-full border flex items-center justify-center',
          'transition-colors',
          colors.bgSecondary,
          colors.border,
          colors.textSecondary
        )}
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      {/* Main Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavClick(item.id)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all',
              activeTab === item.id
                ? `bg-forest-600 text-white shadow-md`
                : `${colors.textSecondary} hover:bg-forest-50 dark:hover:bg-forest-900/30 hover:text-forest-700 dark:hover:text-forest-300`
            )}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="text-sm font-medium">{t(item.labelKey)}</span>}
          </button>
        ))}
      </nav>

      {/* Bottom Navigation */}
      <div className={cn('py-4 px-3 space-y-1 border-t', colors.border)}>
        {bottomItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavClick(item.id)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all',
              activeTab === item.id
                ? `bg-forest-600 text-white shadow-md`
                : item.id === 'logout'
                  ? `text-stone-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20`
                  : `${colors.textSecondary} hover:bg-forest-50 dark:hover:bg-forest-900/30 hover:text-forest-700 dark:hover:text-forest-300`
            )}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="text-sm font-medium">{t(item.labelKey)}</span>}
          </button>
        ))}
      </div>
    </aside>
  );
}
