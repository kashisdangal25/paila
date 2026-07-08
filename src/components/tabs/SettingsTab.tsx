import { useState } from 'react';
import {
  Sun, Moon, Leaf, Globe, Bell, Shield, MapPin, CreditCard, HelpCircle, ChevronRight, LogOut, Check, ChevronDown, LayoutDashboard, Briefcase, Store, Loader2
} from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { useI18n, languageNames, languageFlags } from '../../lib/i18n';
import { useThemeColors, useTheme } from '../../lib/ThemeContext';
import { cn } from '../../lib/utils';
import { supabase } from '../../lib/supabase';

type ThemeOption = 'light' | 'dark' | 'forest';

export function SettingsTab({ onLogout, onAdmin }: { onLogout: () => void; onAdmin?: () => void }) {
  const { t, language, setLanguage } = useI18n();
  const { theme, setTheme } = useTheme();
  const colors = useThemeColors();
  const { profile, user, refreshProfile } = useAuth();
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [expandedSetting, setExpandedSetting] = useState<string | null>(null);
  const [becomingVendor, setBecomingVendor] = useState(false);
  const [settings, setSettings] = useState({
    pushNotifications: true,
    emailNotifications: false,
    tripReminders: true,
    locationEnabled: true,
    shareLocation: false,
    analyticsEnabled: true,
  });

  const themeOptions: { id: ThemeOption; label: string; icon: React.ReactNode; gradient: string }[] = [
    { id: 'light', label: 'Light', icon: <Sun className="w-5 h-5" />, gradient: 'from-stone-100 to-white' },
    { id: 'dark', label: 'Dark', icon: <Moon className="w-5 h-5" />, gradient: 'from-stone-800 to-stone-700' },
    { id: 'forest', label: 'Forest', icon: <Leaf className="w-5 h-5" />, gradient: 'from-forest-600 to-forest-500' },
  ];

  const languages = Object.keys(languageNames) as Array<keyof typeof languageNames>;

  const handleBecomeVendor = async () => {
    if (!user) return;
    setBecomingVendor(true);
    try {
      // Update profile to vendor
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ user_type: 'vendor', vendor_status: 'approved' })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Create vendor record if doesn't exist
      const { error: vendorError } = await supabase
        .from('vendors')
        .upsert({
          user_id: user.id,
          business_name: (profile?.name || 'My') + "'s Business",
          business_type: 'other',
          location: 'Nepal',
          description: 'Please complete your business profile',
          email: profile?.email || '',
          status: 'approved',
        }, { onConflict: 'user_id' });

      if (vendorError) throw vendorError;

      // Refresh profile and reload page to show vendor dashboard
      await refreshProfile();

      // Clear any onboarding flags
      localStorage.removeItem('vendor_onboarding_complete');

      // Reload to trigger vendor onboarding
      window.location.reload();
    } catch (err: any) {
      console.error('Error becoming vendor:', err);
      alert('Failed to switch to vendor mode. Please try again.');
    } finally {
      setBecomingVendor(false);
    }
  };

  const isVendor = profile?.user_type === 'vendor';

  return (
    <div className="p-6 md:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className={cn('text-2xl md:text-3xl font-display font-bold', colors.text)}>
          {t('nav.settings')}
        </h1>
        <p className={cn('text-sm', colors.textSecondary)}>Customize your Paila experience</p>
      </div>

      {/* Theme Selection */}
      <section>
        <h2 className={cn('font-semibold mb-3 flex items-center gap-2', colors.text)}>
          <Leaf className="w-4 h-4" /> Appearance
        </h2>
        <div className={cn(
          'grid grid-cols-3 gap-3',
          'p-3 rounded-xl border',
          colors.card === 'bg-white' ? 'bg-white border-stone-200' : 'bg-forest-800/50 border-forest-700'
        )}>
          {themeOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setTheme(opt.id)}
              className={cn(
                'relative p-3 rounded-xl flex flex-col items-center gap-2 transition-all',
                theme === opt.id
                  ? 'ring-2 ring-forest-500 ring-offset-2'
                  : 'hover:ring-1 hover:ring-stone-300'
              )}
            >
              <div className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br',
                opt.gradient,
                opt.id === 'forest' ? 'text-white' : 'text-stone-800'
              )}>
                {opt.icon}
              </div>
              <span className={cn('text-sm font-medium', colors.text)}>{opt.label}</span>
              {theme === opt.id && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-forest-500 flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Language Selection */}
      <section>
        <h2 className={cn('font-semibold mb-3 flex items-center gap-2', colors.text)}>
          <Globe className="w-4 h-4" /> Language
        </h2>
        <button
          onClick={() => setShowLanguagePicker(!showLanguagePicker)}
          className={cn(
            'w-full flex items-center justify-between p-4 rounded-xl border transition-colors',
            colors.card === 'bg-white' ? 'bg-white border-stone-200 hover:border-forest-200' : 'bg-forest-800/50 border-forest-700'
          )}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{languageFlags[language]}</span>
            <span className={cn('font-medium', colors.text)}>{languageNames[language]}</span>
          </div>
          <ChevronRight className={cn('w-5 h-5', colors.textMuted, 'transition-transform', showLanguagePicker && 'rotate-90')} />
        </button>

        {showLanguagePicker && (
          <div className={cn(
            'mt-2 rounded-xl border overflow-hidden',
            colors.card === 'bg-white' ? 'bg-white border-stone-200' : 'bg-forest-800 border-forest-700'
          )}>
            {languages.map((lang) => (
              <button
                key={lang}
                onClick={() => {
                  setLanguage(lang);
                  setShowLanguagePicker(false);
                }}
                className={cn(
                  'w-full flex items-center justify-between px-4 py-3 transition-colors',
                  language === lang
                    ? colors.card === 'bg-white' ? 'bg-forest-50' : 'bg-forest-700'
                    : colors.card === 'bg-white' ? 'hover:bg-stone-50' : 'hover:bg-forest-700/50'
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{languageFlags[lang]}</span>
                  <span className={cn('font-medium', colors.text)}>{languageNames[lang]}</span>
                </div>
                {language === lang && <Check className={cn('w-5 h-5 text-forest-600')} />}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Account Type */}
      <section>
        <h2 className={cn('font-semibold mb-3 flex items-center gap-2', colors.text)}>
          <Store className="w-4 h-4" /> Account Type
        </h2>
        <div className={cn(
          'rounded-xl border overflow-hidden p-4',
          colors.card === 'bg-white' ? 'bg-white border-stone-200' : 'bg-forest-800/50 border-forest-700'
        )}>
          <div className="flex items-center justify-between">
            <div>
              <p className={cn('font-medium', colors.text)}>
                {isVendor ? 'Vendor Account' : 'Traveler Account'}
              </p>
              <p className={cn('text-xs', colors.textMuted)}>
                {isVendor
                  ? 'You can manage your business listings'
                  : 'Exploring Nepal with Paila'}
              </p>
            </div>
            {!isVendor && (
              <button
                onClick={handleBecomeVendor}
                disabled={becomingVendor}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-white font-medium text-sm hover:bg-amber-600 transition-colors disabled:opacity-50"
              >
                {becomingVendor ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Switching...
                  </>
                ) : (
                  <>
                    <Store className="w-4 h-4" />
                    Become a Vendor
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Settings Sections */}
      <section>
        <h2 className={cn('font-semibold mb-3', colors.text)}>Preferences</h2>
        <div className={cn(
          'rounded-xl border overflow-hidden',
          colors.card === 'bg-white' ? 'bg-white border-stone-200' : 'bg-forest-800/50 border-forest-700'
        )}>
          {/* Notifications */}
          <div>
            <button
              onClick={() => setExpandedSetting(expandedSetting === 'notifications' ? null : 'notifications')}
              className={cn(
                'w-full flex items-center justify-between px-4 py-4 transition-colors',
                colors.card === 'bg-white' ? 'hover:bg-stone-50' : 'hover:bg-forest-700/30'
              )}
            >
              <div className="flex items-center gap-3">
                <Bell className={cn('w-5 h-5', colors.textMuted)} />
                <div className="text-left">
                  <div className={cn('font-medium', colors.text)}>Notifications</div>
                  <div className={cn('text-xs', colors.textMuted)}>Manage alerts & updates</div>
                </div>
              </div>
              <ChevronDown className={cn('w-5 h-5 transition-transform', colors.textMuted, expandedSetting === 'notifications' && 'rotate-180')} />
            </button>
            {expandedSetting === 'notifications' && (
              <div className={cn(
                'px-4 pb-4 space-y-3',
                colors.card === 'bg-white' ? 'border-t border-stone-100' : 'border-t border-forest-700'
              )}>
                <ToggleRow label="Push Notifications" checked={settings.pushNotifications} onChange={(v) => setSettings(s => ({ ...s, pushNotifications: v }))} colors={colors} />
                <ToggleRow label="Email Notifications" checked={settings.emailNotifications} onChange={(v) => setSettings(s => ({ ...s, emailNotifications: v }))} colors={colors} />
                <ToggleRow label="Trip Reminders" checked={settings.tripReminders} onChange={(v) => setSettings(s => ({ ...s, tripReminders: v }))} colors={colors} />
              </div>
            )}
          </div>

          {/* Location */}
          <div className={cn(colors.card === 'bg-white' ? 'border-t border-stone-100' : 'border-t border-forest-700')}>
            <button
              onClick={() => setExpandedSetting(expandedSetting === 'location' ? null : 'location')}
              className={cn(
                'w-full flex items-center justify-between px-4 py-4 transition-colors',
                colors.card === 'bg-white' ? 'hover:bg-stone-50' : 'hover:bg-forest-700/30'
              )}
            >
              <div className="flex items-center gap-3">
                <MapPin className={cn('w-5 h-5', colors.textMuted)} />
                <div className="text-left">
                  <div className={cn('font-medium', colors.text)}>Location</div>
                  <div className={cn('text-xs', colors.textMuted)}>GPS & location settings</div>
                </div>
              </div>
              <ChevronDown className={cn('w-5 h-5 transition-transform', colors.textMuted, expandedSetting === 'location' && 'rotate-180')} />
            </button>
            {expandedSetting === 'location' && (
              <div className={cn(
                'px-4 pb-4 space-y-3',
                colors.card === 'bg-white' ? 'border-t border-stone-100' : 'border-t border-forest-700'
              )}>
                <ToggleRow label="Location Services" checked={settings.locationEnabled} onChange={(v) => setSettings(s => ({ ...s, locationEnabled: v }))} colors={colors} />
                <ToggleRow label="Share Location with Guides" checked={settings.shareLocation} onChange={(v) => setSettings(s => ({ ...s, shareLocation: v }))} colors={colors} />
              </div>
            )}
          </div>

          {/* Privacy */}
          <div className={cn(colors.card === 'bg-white' ? 'border-t border-stone-100' : 'border-t border-forest-700')}>
            <button
              onClick={() => setExpandedSetting(expandedSetting === 'privacy' ? null : 'privacy')}
              className={cn(
                'w-full flex items-center justify-between px-4 py-4 transition-colors',
                colors.card === 'bg-white' ? 'hover:bg-stone-50' : 'hover:bg-forest-700/30'
              )}
            >
              <div className="flex items-center gap-3">
                <Shield className={cn('w-5 h-5', colors.textMuted)} />
                <div className="text-left">
                  <div className={cn('font-medium', colors.text)}>Privacy & Safety</div>
                  <div className={cn('text-xs', colors.textMuted)}>Manage your data</div>
                </div>
              </div>
              <ChevronDown className={cn('w-5 h-5 transition-transform', colors.textMuted, expandedSetting === 'privacy' && 'rotate-180')} />
            </button>
            {expandedSetting === 'privacy' && (
              <div className={cn(
                'px-4 pb-4 space-y-3',
                colors.card === 'bg-white' ? 'border-t border-stone-100' : 'border-t border-forest-700'
              )}>
                <ToggleRow label="Analytics & Improvement" checked={settings.analyticsEnabled} onChange={(v) => setSettings(s => ({ ...s, analyticsEnabled: v }))} colors={colors} />
                <p className={cn('text-xs', colors.textMuted)}>Your data is never sold. We use analytics solely to improve your experience.</p>
              </div>
            )}
          </div>

          {/* Payment */}
          <div className={cn(colors.card === 'bg-white' ? 'border-t border-stone-100' : 'border-t border-forest-700')}>
            <button
              onClick={() => setExpandedSetting(expandedSetting === 'payment' ? null : 'payment')}
              className={cn(
                'w-full flex items-center justify-between px-4 py-4 transition-colors',
                colors.card === 'bg-white' ? 'hover:bg-stone-50' : 'hover:bg-forest-700/30'
              )}
            >
              <div className="flex items-center gap-3">
                <CreditCard className={cn('w-5 h-5', colors.textMuted)} />
                <div className="text-left">
                  <div className={cn('font-medium', colors.text)}>Payment Methods</div>
                  <div className={cn('text-xs', colors.textMuted)}>Cards & billing</div>
                </div>
              </div>
              <ChevronDown className={cn('w-5 h-5 transition-transform', colors.textMuted, expandedSetting === 'payment' && 'rotate-180')} />
            </button>
            {expandedSetting === 'payment' && (
              <div className={cn(
                'px-4 pb-4',
                colors.card === 'bg-white' ? 'border-t border-stone-100' : 'border-t border-forest-700'
              )}>
                <p className={cn('text-xs', colors.textMuted)}>Payment integration coming soon. You'll be able to add cards and manage billing here.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Support */}
      <section>
        <h2 className={cn('font-semibold mb-3', colors.text)}>Support</h2>
        <div className={cn(
          'rounded-xl border overflow-hidden',
          colors.card === 'bg-white' ? 'bg-white border-stone-200' : 'bg-forest-800/50 border-forest-700'
        )}>
          {[
            { icon: HelpCircle, label: 'Help Center', desc: 'FAQs & guides' },
          ].map((item) => (
            <button
              key={item.label}
              className={cn(
                'w-full flex items-center justify-between px-4 py-4 transition-colors',
                colors.card === 'bg-white' ? 'hover:bg-stone-50' : 'hover:bg-forest-700/30'
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon className={cn('w-5 h-5', colors.textMuted)} />
                <div className="text-left">
                  <div className={cn('font-medium', colors.text)}>{item.label}</div>
                  <div className={cn('text-xs', colors.textMuted)}>{item.desc}</div>
                </div>
              </div>
              <ChevronRight className={cn('w-5 h-5', colors.textMuted)} />
            </button>
          ))}
        </div>
      </section>

      {/* Admin Access */}
      {onAdmin && (
        <section>
          <button
            onClick={onAdmin}
            className={cn(
              'w-full flex items-center justify-between p-4 rounded-xl border transition-colors',
              colors.card === 'bg-white'
                ? 'bg-forest-50 border-forest-200 hover:bg-forest-100'
                : 'bg-forest-800/50 border-forest-700 hover:bg-forest-700'
            )}
          >
            <div className="flex items-center gap-3">
              <LayoutDashboard className={cn('w-5 h-5', 'text-forest-600')} />
              <div className="text-left">
                <div className={cn('font-medium', colors.text)}>Admin Dashboard</div>
                <div className={cn('text-xs', colors.textMuted)}>Manage destinations, guides & more</div>
              </div>
            </div>
            <ChevronRight className={cn('w-5 h-5', colors.textMuted)} />
          </button>
        </section>
      )}

      {/* Logout */}
      <button
        onClick={onLogout}
        className={cn(
          'w-full flex items-center justify-center gap-2 py-4 rounded-xl font-medium transition-colors',
          colors.card === 'bg-white'
            ? 'bg-red-50 text-red-600 hover:bg-red-100'
            : 'bg-red-900/20 text-red-400 hover:bg-red-900/30'
        )}
      >
        <LogOut className="w-5 h-5" />
        {t('nav.logout')}
      </button>

      {/* Version */}
      <div className={cn('text-center text-xs', colors.textMuted)}>
        Paila v1.0.0 — Made with love in Nepal
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
  colors,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  colors: any;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={cn('text-sm', colors.text)}>{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className={cn(
          'relative w-11 h-6 rounded-full transition-colors',
          checked ? 'bg-forest-500' : 'bg-stone-300 dark:bg-forest-700'
        )}
      >
        <div
          className={cn(
            'absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-6' : 'translate-x-1'
          )}
        />
      </button>
    </div>
  );
}
