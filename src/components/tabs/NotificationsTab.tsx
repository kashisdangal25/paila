import { Bell, MapPin, Star, MessageCircle, Check, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { useI18n } from '../../lib/i18n';
import { useThemeColors } from '../../lib/ThemeContext';
import { cn } from '../../lib/utils';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  created_at: string;
  read: boolean;
}

const icons: Record<string, any> = {
  trip: MapPin,
  social: MessageCircle,
  weather: Bell,
  achievement: Star,
};

export function NotificationsTab() {
  const { t } = useI18n();
  const colors = useThemeColors();
  const { user } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNotifications() {
      setLoading(true);
      // For now, show empty state until notification system is implemented
      // In future, this would fetch from a notifications table
      setItems([]);
      setLoading(false);
    }
    fetchNotifications();
  }, [user]);

  const unreadCount = items.filter(n => !n.read).length;
  const filteredItems = filter === 'all' ? items : items.filter(n => !n.read);

  const markAsRead = (id: string) => {
    setItems(items.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const dismiss = (id: string) => {
    setItems(items.filter(n => n.id !== id));
  };

  const markAllRead = () => {
    setItems(items.map(n => ({ ...n, read: true })));
  };

  return (
    <div className="p-6 md:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={cn('text-2xl md:text-3xl font-display font-bold', colors.text)}>
            {t('nav.notifications')}
          </h1>
          <p className={cn('text-sm', colors.textSecondary)}>{unreadCount} unread</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-sm text-forest-600 hover:text-forest-700 flex items-center gap-1 font-medium"
          >
            <Check className="w-4 h-4" /> Mark all read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className={cn(
        'flex gap-1 p-1 rounded-xl w-fit',
        colors.card === 'bg-white' ? 'bg-stone-100' : 'bg-forest-900/50'
      )}>
        {(['all', 'unread'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all',
              filter === tab
                ? colors.card === 'bg-white'
                  ? 'bg-white text-forest-700 shadow-sm'
                  : 'bg-forest-700 text-white'
                : colors.textSecondary
            )}
          >
            {tab === 'all' ? `All (${items.length})` : `Unread (${unreadCount})`}
          </button>
        ))}
      </div>

      {/* Notification List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-stone-200 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((notification) => {
            const Icon = icons[notification.type] || Bell;
            return (
              <div
                key={notification.id}
                className={cn(
                  'group relative flex items-start gap-4 p-4 rounded-xl border transition-all',
                  notification.read
                    ? colors.card === 'bg-white'
                      ? 'bg-white border-stone-200'
                      : 'bg-forest-800/30 border-forest-700/50'
                    : colors.card === 'bg-white'
                      ? 'bg-forest-50 border-forest-200'
                      : 'bg-forest-800/70 border-forest-600'
                )}
              >
                {!notification.read && (
                  <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-forest-500" />
                )}
                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center',
                  notification.type === 'trip' && 'bg-forest-100 text-forest-600',
                  notification.type === 'social' && 'bg-blue-100 text-blue-600',
                  notification.type === 'weather' && 'bg-amber-100 text-amber-600',
                  notification.type === 'achievement' && 'bg-purple-100 text-purple-600'
                )}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={cn('font-medium', colors.text)}>{notification.title}</h3>
                  <p className={cn('text-sm mt-1', colors.textSecondary)}>{notification.message}</p>
                  <span className={cn('text-xs mt-2 block', colors.textMuted)}>
                    {new Date(notification.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                  {!notification.read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-forest-700 text-stone-400"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => dismiss(notification.id)}
                    className="p-2 rounded-lg hover:bg-red-50 text-stone-400 hover:text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredItems.length === 0 && (
        <div className={cn(
          'text-center py-12 rounded-xl border',
          colors.card === 'bg-white' ? 'bg-white border-stone-200' : 'bg-forest-800/50 border-forest-700'
        )}>
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-forest-100 dark:bg-forest-800 flex items-center justify-center">
            <Bell className="w-8 h-8 text-forest-500" />
          </div>
          <h3 className={cn('font-semibold mb-1', colors.text)}>All caught up!</h3>
          <p className={cn('text-sm', colors.textSecondary)}>
            {filter === 'unread'
              ? 'You have no unread notifications. Great job staying on top of things!'
              : 'Your adventure awaits. We will notify you when something exciting happens.'}
          </p>
        </div>
      )}
    </div>
  );
}
