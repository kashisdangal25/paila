import { useState, useEffect } from 'react';
import {
  Search, MapPin, Cloud, Sun, CloudRain, Wind, Thermometer,
  Star, Heart, ChevronRight, Calendar, Shield, Compass, TrendingUp, Users, Sparkles
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { useI18n } from '../../lib/i18n';
import { useTheme, useThemeColors } from '../../lib/ThemeContext';
import { useSaved } from '../../lib/useSaved';
import { cn } from '../../lib/utils';

interface UpcomingTrip {
  id: string;
  name: string;
  destination: string;
  start_date: string;
  days_remaining: number;
  cover_image?: string;
}

interface Festival {
  name: string;
  date: string;
  location: string;
  description: string;
}

const currentUser = { coords: { latitude: 27.7, longitude: 85.35 } };

export function TodayTab() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { theme } = useTheme();
  const colors = useThemeColors();
  const { savedItems } = useSaved();

  const [userName, setUserName] = useState('Traveler');
  const [location, setLocation] = useState('Kathmandu');
  const [greeting, setGreeting] = useState('Good morning');
  const [weather, setWeather] = useState({ temp: 22, condition: 'Partly cloudy', icon: 'sun' });
  const [hiddenGems, setHiddenGems] = useState<any[]>([]);
  const [upcomingTrip, setUpcomingTrip] = useState<UpcomingTrip | null>(null);
  const [festivals, setFestivals] = useState<Festival[]>([]);
  const [recommendedGuides, setRecommendedGuides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Time-based greeting
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting(t('today.time.morning'));
    else if (hour < 17) setGreeting(t('today.time.afternoon'));
    else setGreeting(t('today.time.evening'));
  }, [t]);

  // Fetch all data
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Get profile
        if (user?.id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', user.id)
            .maybeSingle();
          if (profile?.name) {
            setUserName(profile.name.split(' ')[0]);
          } else if (user.email) {
            setUserName(user.email.split('@')[0]);
          }

          // Get upcoming trips
          const { data: trips } = await supabase
            .from('trips')
            .select(`
              id,
              name,
              start_date,
              destinations (name, image_url)
            `)
            .eq('user_id', user.id)
            .eq('status', 'planned')
            .gte('start_date', new Date().toISOString())
            .order('start_date', { ascending: true })
            .limit(1);

          if (trips && trips[0]) {
            const trip = trips[0];
            const tripDate = new Date(trip.start_date);
            const today = new Date();
            const daysRemaining = Math.ceil((tripDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            setUpcomingTrip({
              id: trip.id,
              name: trip.name,
              destination: trip.destinations?.name || 'Trip',
              start_date: trip.start_date,
              days_remaining: daysRemaining,
              cover_image: trip.destinations?.image_url,
            });
          }
        }

        // Get hidden gems
        const { data: gems } = await supabase
          .from('hidden_gems')
          .select('*')
          .limit(4);
        if (gems) setHiddenGems(gems);

        // Get recommended guides
        const { data: guides } = await supabase
          .from('guides')
          .select('*')
          .eq('available', true)
          .eq('verified', true)
          .order('rating', { ascending: false })
          .limit(3);
        if (guides) setRecommendedGuides(guides);

        // Set festivals
        const upcomingFestivals = [
          { name: 'Indra Jatra', date: 'Sept 17-20', location: 'Kathmandu', description: '8-day chariot festival in Kathmandu Durbar Square' },
          { name: 'Dashain', date: 'Oct 15-26', location: 'Nationwide', description: 'Nepal\'s biggest festival - family gatherings' },
          { name: 'Tihar', date: 'Nov 10-14', location: 'Nationwide', description: 'Festival of lights with dogs and goddess Laxmi' },
        ];
        setFestivals(upcomingFestivals);

        // Try to get location
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const lat = pos.coords.latitude;
              if (lat > 27 && lat < 28) setLocation('Kathmandu');
              else if (lat > 28 && lat < 29) setLocation('Pokhara');
              else if (lat > 26 && lat < 27) setLocation('Chitwan');
            },
            () => {}
          );
        }

        // Set weather based on month
        const month = new Date().getMonth();
        if (month >= 2 && month <= 4) {
          setWeather({ temp: 25, condition: 'Spring warmth', icon: 'sun' });
        } else if (month >= 5 && month <= 8) {
          setWeather({ temp: 28, condition: 'Monsoon season', icon: 'rain' });
        } else {
          setWeather({ temp: 18, condition: 'Clear mountain views', icon: 'sun' });
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user]);

  const weatherThemes = {
    sun: { bg: 'from-amber-400 to-orange-500', advice: 'Perfect for hiking today!' },
    cloud: { bg: 'from-slate-400 to-slate-500', advice: 'Good weather for exploring' },
    rain: { bg: 'from-blue-400 to-blue-600', advice: 'Pack rain gear for your adventure' },
  };

  const currentWeather = weatherThemes[weather.icon as keyof typeof weatherThemes] || weatherThemes.sun;

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in">
      {/* Greeting Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className={cn('text-2xl md:text-3xl font-display font-bold mb-1', colors.text)}>
            {t('today.greeting', { time: greeting, name: userName })}
          </h1>
          <p className={cn('flex items-center gap-1.5 text-sm', colors.textSecondary)}>
            <MapPin className="w-4 h-4 text-forest-500" />
            {t('today.location', { city: location })}
          </p>
        </div>
        <div className={cn(
          'px-3 py-1.5 rounded-full text-xs font-medium',
          colors.accentBg,
          `text-${colors.accent}`
        )}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className={cn('absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5', colors.textMuted)} />
        <input
          type="text"
          placeholder={t('today.search')}
          className={cn(
            'w-full pl-12 pr-4 py-3.5 rounded-xl border-2 transition-all',
            colors.card === 'bg-white' ? 'bg-white border-stone-200' : 'bg-forest-800/50 border-forest-700',
            colors.text,
            'placeholder:text-stone-400 focus:outline-none focus:border-forest-500'
          )}
        />
      </div>

      {/* Weather Card */}
      <div className={cn(
        'rounded-2xl p-5 text-white bg-gradient-to-br',
        currentWeather.bg
      )}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Cloud className="w-5 h-5" />
            <span className="text-sm font-medium opacity-90">{t('today.weather')}</span>
          </div>
          <span className="text-sm opacity-75">{location}</span>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <div className="text-5xl font-display font-bold">{weather.temp}°</div>
            <div className="text-sm opacity-80 mt-1">{weather.condition}</div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1"><Wind className="w-4 h-4" /> 12 km/h</span>
              <span className="flex items-center gap-1"><Thermometer className="w-4 h-4" /> 65%</span>
            </div>
            <p className="mt-2 text-sm opacity-90">{currentWeather.advice}</p>
          </div>
        </div>
      </div>

      {/* Upcoming Trip or Continue Journey */}
      {upcomingTrip ? (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className={cn('font-display font-bold text-lg', colors.text)}>
              Your Upcoming Trip
            </h2>
          </div>
          <div className={cn(
            'rounded-xl overflow-hidden border cursor-pointer transition-all hover:shadow-lg',
            colors.card === 'bg-white' ? 'bg-white border-stone-200' : 'bg-forest-800/50 border-forest-700'
          )}>
            <div className="h-32 relative">
              {upcomingTrip.cover_image ? (
                <img
                  src={upcomingTrip.cover_image}
                  alt={upcomingTrip.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-forest-600 to-forest-400" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-3 left-3 text-white">
                <h3 className="font-semibold">{upcomingTrip.name}</h3>
                <p className="text-sm opacity-80">{upcomingTrip.destination}</p>
              </div>
              <div className="absolute top-3 right-3 px-3 py-1.5 bg-white/90 rounded-lg text-forest-700 font-semibold text-sm">
                {upcomingTrip.days_remaining} days away
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-4">
                <Calendar className={cn('w-5 h-5', colors.textMuted)} />
                <span className={cn('text-sm', colors.textSecondary)}>
                  {new Date(upcomingTrip.start_date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
                <ChevronRight className={cn('w-5 h-5 ml-auto', colors.textMuted)} />
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className={cn('font-display font-bold text-lg', colors.text)}>
              {t('today.continueJourney')}
            </h2>
          </div>
          <div className={cn(
            'rounded-xl p-4 border flex items-center gap-4 cursor-pointer transition-all hover:shadow-md',
            colors.card === 'bg-white' ? 'bg-white border-stone-200' : 'bg-forest-800/50 border-forest-700'
          )}>
            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-forest-600 to-forest-400 flex items-center justify-center flex-shrink-0">
              <Compass className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className={cn('text-xs font-medium mb-1', colors.textMuted)}>
                <Sparkles className="w-3 h-3 inline mr-1" /> Start Planning
              </div>
              <h3 className={cn('font-semibold', colors.text)}>Plan your next adventure</h3>
              <p className={cn('text-sm', colors.textMuted)}>
                Use AI to create the perfect itinerary
              </p>
            </div>
            <ChevronRight className={cn('w-5 h-5', colors.textMuted)} />
          </div>
        </section>
      )}

      {/* Hidden Places Nearby */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className={cn('font-display font-bold text-lg', colors.text)}>
            {t('today.hiddenNearby')}
          </h2>
          <button className="text-sm text-forest-600 hover:text-forest-700 flex items-center gap-1 font-medium">
            {t('common.viewAll')} <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {hiddenGems.slice(0, 4).map((gem) => (
            <div
              key={gem.id}
              className={cn(
                'rounded-xl overflow-hidden cursor-pointer group',
                'border transition-all hover:shadow-lg hover:-translate-y-1',
                colors.card === 'bg-white' ? 'bg-white border-stone-200' : 'bg-forest-800/50 border-forest-700'
              )}
            >
              <div className="h-28 relative">
                {gem.image_url && (
                  <img src={gem.image_url} alt={gem.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute top-2 right-2 bg-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Heart className="w-3 h-3 text-stone-600" />
                </div>
                {gem.nature_score && (
                  <div className="absolute bottom-2 left-2 bg-forest-600/90 backdrop-blur-sm text-white text-xs font-bold px-2 py-0.5 rounded">
                    {gem.nature_score}
                  </div>
                )}
              </div>
              <div className="p-3">
                <h3 className={cn('font-medium text-sm truncate', colors.text)}>{gem.name}</h3>
                <p className={cn('text-xs', colors.textMuted)}>{gem.region}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Saved Places */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className={cn('font-display font-bold text-lg', colors.text)}>
              {t('today.savedPlaces')}
            </h2>
            <button className="text-sm text-forest-600 hover:text-forest-700 font-medium">
              {t('common.viewAll')}
            </button>
          </div>
          {savedItems.length > 0 ? (
            <div className="space-y-2">
              {savedItems.slice(0, 3).map((place) => (
                <div
                  key={place.user_saved_id}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-xl border transition-colors cursor-pointer',
                    colors.card === 'bg-white' ? 'bg-white border-stone-200 hover:bg-stone-50' : 'bg-forest-800/50 border-forest-700 hover:bg-forest-800'
                  )}
                >
                  <div className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center',
                    colors.accentBg
                  )}>
                    <Heart className={cn('w-5 h-5', `text-${colors.accent}`)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={cn('font-medium text-sm', colors.text)}>{place.data.name}</div>
                    <div className={cn('text-xs', colors.textMuted)}>
                      {place.data.region || place.type}
                    </div>
                  </div>
                  {place.data.rating && (
                    <div className="flex items-center gap-1 text-xs">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                      <span className={colors.text}>{place.data.rating}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className={cn(
              'p-6 rounded-xl border text-center',
              colors.card === 'bg-white' ? 'bg-white border-stone-200' : 'bg-forest-800/50 border-forest-700'
            )}>
              <Heart className={cn('w-8 h-8 mx-auto mb-2 opacity-30', colors.textMuted)} />
              <p className={cn('text-sm', colors.textSecondary)}>No saved places yet</p>
            </div>
          )}
        </section>

        {/* Festivals & Safety */}
        <div className="space-y-6">
          {/* Festivals */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className={cn('font-display font-bold text-lg', colors.text)}>
                {t('today.festivals')}
              </h2>
            </div>
            <div className={cn(
              'rounded-xl p-4 border',
              colors.card === 'bg-white' ? 'bg-amber-50 border-amber-200' : 'bg-amber-900/20 border-amber-700/30'
            )}>
              {festivals.slice(0, 2).map((festival, i) => (
                <div key={festival.name} className={cn('flex items-center gap-3', i > 0 && 'mt-3 pt-3 border-t border-amber-200 dark:border-amber-700/30')}>
                  <div className="w-12 h-12 rounded-lg bg-amber-100 dark:bg-amber-800 flex items-center justify-center text-2xl">
                    {i === 0 ? '🎭' : '🏮'}
                  </div>
                  <div>
                    <h3 className={cn('font-semibold text-sm', colors.text)}>{festival.name}</h3>
                    <p className={cn('text-xs', colors.textSecondary)}>{festival.date} • {festival.location}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Safety Tips */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className={cn('font-display font-bold text-lg', colors.text)}>
                {t('today.safety')}
              </h2>
            </div>
            <div className={cn(
              'rounded-xl p-4 border',
              colors.card === 'bg-white' ? 'bg-forest-50 border-forest-200' : 'bg-forest-900/30 border-forest-700/50'
            )}>
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-forest-600 mt-0.5" />
                <div>
                  <h3 className={cn('font-semibold text-sm mb-1', colors.text)}>
                    {new Date().getMonth() >= 5 && new Date().getMonth() <= 8
                      ? 'Monsoon Season Advisory'
                      : 'Trail Safety Tips'}
                  </h3>
                  <p className={cn('text-xs', colors.textSecondary)}>
                    {new Date().getMonth() >= 5 && new Date().getMonth() <= 8
                      ? 'Trail conditions may change. Always check local weather and inform someone of your plans.'
                      : 'Best hiking season! Carry enough water, wear proper footwear, and respect altitude.'}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Recommended Guides */}
      {recommendedGuides.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className={cn('font-display font-bold text-lg', colors.text)}>
              Top-Rated Guides
            </h2>
            <button className="text-sm text-forest-600 hover:text-forest-700 flex items-center gap-1 font-medium">
              View all <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {recommendedGuides.map((guide) => (
              <div
                key={guide.id}
                className={cn(
                  'flex-shrink-0 w-48 rounded-xl p-4 border transition-all cursor-pointer',
                  colors.card === 'bg-white' ? 'bg-white border-stone-200 hover:shadow-md' : 'bg-forest-800/50 border-forest-700'
                )}
              >
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src={guide.avatar_url}
                    alt={guide.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className={cn('font-semibold text-sm truncate', colors.text)}>{guide.name}</h3>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                      <span className={cn('text-xs', colors.textSecondary)}>{guide.rating}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mb-3">
                  {guide.specialties?.slice(0, 2).map((s: string) => (
                    <span key={s} className={cn(
                      'text-[10px] px-1.5 py-0.5 rounded',
                      colors.card === 'bg-white' ? 'bg-forest-100 text-forest-700' : 'bg-forest-700 text-forest-200'
                    )}>
                      {s}
                    </span>
                  ))}
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-stone-100 dark:border-forest-700">
                  <span className={cn('font-semibold', colors.text)}>NPR {guide.price_per_day.toLocaleString()}</span>
                  <span className={cn('text-xs', colors.textMuted)}>per day</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
