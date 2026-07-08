import { useState, useEffect } from 'react';
import {
  MapPin, Mountain, Clock, Car, Wallet, Signal, Calendar, Shield, Camera, Sun, Sunset,
  Phone, Cross, Building2, MountainSnow, Heart, Share2, ChevronLeft, ChevronRight,
  Star, Users, Sparkles, Leaf, Utensils, Music, AlertTriangle, Check, ExternalLink,
  Navigation, Thermometer, Wind, Droplets, Sunrise, User, MessageCircle, MapPinned,
  Flag, X
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { useThemeColors } from '../../lib/ThemeContext';
import { cn } from '../../lib/utils';

interface DestinationDetailProps {
  destinationId: string;
  onBack: () => void;
}

interface Destination {
  id: string;
  name: string;
  description: string;
  image_url: string;
  category: string;
  region: string;
  elevation_m: number | null;
  difficulty: string;
  duration_days: string;
  transport: string;
  budget_min: number;
  budget_max: number;
  network: string;
  best_season: string;
  safety_info: string;
  sunrise_spot: string;
  sunset_spot: string;
  photography_tips: string;
  nearest_hospital: string;
  nearest_hospital_km: number;
  nearest_police: string;
  nearest_police_km: number;
  nearest_health_post: string;
  nearest_health_post_km: number;
  local_rescue: string;
  local_foods: string[];
  cultural_tips: string;
  wildlife: string[];
  festivals_nearby: string;
  things_to_respect: string;
  score_adventure: number;
  score_crowd: number;
  score_cleanliness: number;
  score_photography: number;
  score_family: number;
  score_budget: number;
  score_safety: number;
  packing_list: string[];
  latitude: number;
  longitude: number;
}

interface Review {
  id: string;
  user_id: string;
  rating: number;
  title: string;
  content: string;
  visit_date: string;
  created_at: string;
  profiles: { name: string } | null;
}

interface Weather {
  temp: number;
  feels_like: number;
  condition: string;
  humidity: number;
  wind: number;
  sunrise: string;
  sunset: string;
}

const packingChecklistDefaults = [
  { id: 'water', label: 'Water Bottle', icon: Droplets },
  { id: 'jacket', label: 'Warm Jacket', icon: Wind },
  { id: 'shoes', label: 'Trekking Shoes', icon: Navigation },
  { id: 'powerbank', label: 'Power Bank', icon: Signal },
  { id: 'medicine', label: 'First Aid Kit', icon: Shield },
  { id: 'snacks', label: 'Energy Snacks', icon: Utensils },
  { id: 'cash', label: 'Cash (NPR)', icon: Wallet },
  { id: 'raincoat', label: 'Raincoat', icon: Droplets },
  { id: 'flashlight', label: 'Flashlight', icon: Sun },
  { id: 'camera', label: 'Camera', icon: Camera },
];

export function DestinationDetail({ destinationId, onBack }: DestinationDetailProps) {
  const colors = useThemeColors();
  const { user } = useAuth();
  const [destination, setDestination] = useState<Destination | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState<string>('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);

  useEffect(() => {
    fetchDestination();
    fetchWeather();
  }, [destinationId, user]);

  async function fetchDestination() {
    setLoading(true);
    try {
      const { data: dest } = await supabase
        .from('destinations')
        .select('*')
        .eq('id', destinationId)
        .single();

      if (dest) {
        setDestination(dest);

        // Check if saved
        if (user) {
          const { data: saved } = await supabase
            .from('user_saved')
            .select('id')
            .eq('user_id', user.id)
            .eq('destination_id', destinationId)
            .maybeSingle();
          setIsSaved(!!saved);
        }
      }

      // Fetch reviews
      const { data: reviewsData } = await supabase
        .from('destination_reviews')
        .select('*, profiles (name)')
        .eq('destination_id', destinationId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (reviewsData) setReviews(reviewsData as Review[]);
    } catch (err) {
      console.error('Error fetching destination:', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchWeather() {
    // Use mock weather for now - in production, use OpenWeather API
    const conditions = ['Sunny', 'Partly Cloudy', 'Cloudy', 'Clear'];
    const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];

    setWeather({
      temp: Math.floor(Math.random() * 15) + 10,
      feels_like: Math.floor(Math.random() * 15) + 8,
      condition: randomCondition,
      humidity: Math.floor(Math.random() * 30) + 40,
      wind: Math.floor(Math.random() * 15) + 5,
      sunrise: '5:45 AM',
      sunset: '6:32 PM',
    });
  }

  async function toggleSave() {
    if (!user || !destination) return;

    if (isSaved) {
      await supabase
        .from('user_saved')
        .delete()
        .eq('user_id', user.id)
        .eq('destination_id', destinationId);
    } else {
      await supabase
        .from('user_saved')
        .insert({ user_id: user.id, destination_id: destinationId });
    }
    setIsSaved(!isSaved);
  }

  async function submitReport() {
    if (!user || !destination || !reportType) return;

    try {
      await supabase.from('destination_reports').insert({
        user_id: user.id,
        destination_id: destinationId,
        report_type: reportType,
        description: reportDescription,
        status: 'pending'
      });
      setReportSubmitted(true);
      setTimeout(() => {
        setShowReportModal(false);
        setReportSubmitted(false);
        setReportType('');
        setReportDescription('');
      }, 2000);
    } catch (err) {
      console.error('Error submitting report:', err);
    }
  }

  const pailaScore = destination ? Math.round(
    (destination.score_adventure + destination.score_crowd + destination.score_cleanliness +
     destination.score_photography + destination.score_family + destination.score_budget + destination.score_safety) / 7
  ) : 0;

  const toggleCheckItem = (id: string) => {
    const newSet = new Set(checkedItems);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setCheckedItems(newSet);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4 animate-fade-in">
        <div className="h-64 rounded-2xl bg-stone-200 animate-pulse" />
        <div className="h-24 rounded-xl bg-stone-200 animate-pulse" />
        <div className="h-48 rounded-xl bg-stone-200 animate-pulse" />
      </div>
    );
  }

  if (!destination) {
    return (
      <div className="p-6 text-center">
        <p className={colors.textSecondary}>Destination not found</p>
        <button onClick={onBack} className="btn-primary mt-4">Go Back</button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Hero Image */}
      <div className="relative h-72 rounded-b-3xl overflow-hidden group">
        <img
          src={destination.image_url || 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&q=80'}
          alt={destination.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Back Button */}
        <button
          onClick={onBack}
          className="absolute top-4 left-4 p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>

        {/* Actions */}
        <div className="absolute top-4 right-4 flex gap-2">
          <button
            onClick={toggleSave}
            className={cn(
              'p-2.5 rounded-full transition-all',
              isSaved ? 'bg-red-500 text-white' : 'bg-white/20 backdrop-blur-sm hover:bg-white/30'
            )}
          >
            <Heart className={cn('w-5 h-5', isSaved && 'fill-current')} />
          </button>
          <button className="p-2.5 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30">
            <Share2 className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Title */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn(
              'px-2 py-0.5 rounded text-xs font-medium',
              destination.difficulty === 'Easy' ? 'bg-green-500/90 text-white' :
              destination.difficulty === 'Moderate' ? 'bg-amber-500/90 text-white' :
              'bg-red-500/90 text-white'
            )}>
              {destination.difficulty}
            </span>
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-white/20 backdrop-blur-sm text-white">
              {destination.category}
            </span>
          </div>
          <h1 className="text-2xl font-display font-bold text-white">{destination.name}</h1>
          <p className="text-white/80 text-sm flex items-center gap-1 mt-1">
            <MapPin className="w-4 h-4" /> {destination.region}
          </p>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="flex overflow-x-auto gap-4 px-4 py-3 -mt-4 mx-4 bg-white rounded-xl shadow-lg">
        {destination.elevation_m && (
          <div className="flex items-center gap-2 px-3 py-2">
            <Mountain className="w-4 h-4 text-forest-600" />
            <div>
              <p className="text-xs text-stone-500">Elevation</p>
              <p className="text-sm font-semibold">{destination.elevation_m.toLocaleString()}m</p>
            </div>
          </div>
        )}
        {destination.duration_days && (
          <div className="flex items-center gap-2 px-3 py-2">
            <Clock className="w-4 h-4 text-forest-600" />
            <div>
              <p className="text-xs text-stone-500">Duration</p>
              <p className="text-sm font-semibold">{destination.duration_days}</p>
            </div>
          </div>
        )}
        {destination.budget_min && destination.budget_max && (
          <div className="flex items-center gap-2 px-3 py-2">
            <Wallet className="w-4 h-4 text-forest-600" />
            <div>
              <p className="text-xs text-stone-500">Budget</p>
              <p className="text-sm font-semibold">NPR {destination.budget_min.toLocaleString()}-{destination.budget_max.toLocaleString()}</p>
            </div>
          </div>
        )}
        {destination.network && (
          <div className="flex items-center gap-2 px-3 py-2">
            <Signal className="w-4 h-4 text-forest-600" />
            <div>
              <p className="text-xs text-stone-500">Network</p>
              <p className="text-sm font-semibold">{destination.network}</p>
            </div>
          </div>
        )}
      </div>

      {/* Section Tabs */}
      <div className="sticky top-0 z-10 bg-stone-50 dark:bg-forest-900 border-b px-4 py-2 mt-4">
        <div className="flex overflow-x-auto gap-2">
          {['overview', 'weather', 'emergency', 'packing', 'reviews'].map((section) => (
            <button
              key={section}
              onClick={() => setActiveSection(section)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all',
                activeSection === section
                  ? 'bg-forest-600 text-white'
                  : 'bg-stone-100 dark:bg-forest-800 text-stone-600 dark:text-stone-300'
              )}
            >
              {section.charAt(0).toUpperCase() + section.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Overview Section */}
        {activeSection === 'overview' && (
          <>
            {/* Description */}
            <div className={cn('rounded-xl p-4 border', colors.card === 'bg-white' ? 'bg-white border-stone-200' : 'bg-forest-800/50 border-forest-700')}>
              <h2 className={cn('font-display font-bold text-lg mb-3', colors.text)}>About</h2>
              <p className={cn('text-sm leading-relaxed', colors.textSecondary)}>
                {destination.description}
              </p>
            </div>

            {/* Paila Score */}
            <div className={cn('rounded-xl p-4 border', colors.card === 'bg-white' ? 'bg-white border-stone-200' : 'bg-forest-800/50 border-forest-700')}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={cn('font-display font-bold text-lg', colors.text)}>
                  <Sparkles className="w-5 h-5 inline mr-2 text-amber-500" />
                  Paila Score
                </h2>
                <div className="flex items-center gap-1">
                  <span className="text-3xl font-display font-bold text-forest-600">{pailaScore || 4.2}</span>
                  <span className="text-stone-500">/5</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Adventure', score: destination.score_adventure || 4 },
                  { label: 'Crowd Level', score: destination.score_crowd || 4 },
                  { label: 'Cleanliness', score: destination.score_cleanliness || 4 },
                  { label: 'Photography', score: destination.score_photography || 4 },
                  { label: 'Family Friendly', score: destination.score_family || 4 },
                  { label: 'Budget', score: destination.score_budget || 4 },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className={cn('text-xs', colors.textMuted)}>{item.label}</span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={cn(
                            'w-3 h-3',
                            star <= item.score
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-stone-300'
                          )}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Best Season & Transport */}
            <div className="grid grid-cols-2 gap-4">
              {destination.best_season && (
                <div className={cn('rounded-xl p-4 border', colors.card === 'bg-white' ? 'bg-gradient-to-br from-sky-50 to-blue-50 border-sky-200' : 'bg-forest-800/50 border-forest-700')}>
                  <Calendar className="w-5 h-5 text-sky-600 mb-2" />
                  <p className={cn('text-xs text-stone-500 mb-1')}>Best Season</p>
                  <p className={cn('font-semibold', colors.text)}>{destination.best_season}</p>
                </div>
              )}
              {destination.transport && (
                <div className={cn('rounded-xl p-4 border', colors.card === 'bg-white' ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200' : 'bg-forest-800/50 border-forest-700')}>
                  <Car className="w-5 h-5 text-amber-600 mb-2" />
                  <p className={cn('text-xs text-stone-500 mb-1')}>Transport</p>
                  <p className={cn('font-semibold text-sm', colors.text)}>{destination.transport}</p>
                </div>
              )}
            </div>

            {/* Photography Spots */}
            {(destination.sunrise_spot || destination.sunset_spot) && (
              <div className={cn('rounded-xl p-4 border', colors.card === 'bg-white' ? 'bg-gradient-to-r from-orange-50 via-amber-50 to-pink-50 border-amber-200' : 'bg-forest-800/50 border-forest-700')}>
                <h2 className={cn('font-display font-bold text-lg mb-3 flex items-center gap-2', colors.text)}>
                  <Camera className="w-5 h-5 text-amber-600" />
                  Photography Spots
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  {destination.sunrise_spot && (
                    <div className="flex items-start gap-2">
                      <Sunrise className="w-5 h-5 text-orange-500 mt-0.5" />
                      <div>
                        <p className={cn('text-xs text-stone-500')}>Sunrise</p>
                        <p className={cn('text-sm font-medium', colors.text)}>{destination.sunrise_spot}</p>
                      </div>
                    </div>
                  )}
                  {destination.sunset_spot && (
                    <div className="flex items-start gap-2">
                      <Sunset className="w-5 h-5 text-pink-500 mt-0.5" />
                      <div>
                        <p className={cn('text-xs text-stone-500')}>Sunset</p>
                        <p className={cn('text-sm font-medium', colors.text)}>{destination.sunset_spot}</p>
                      </div>
                    </div>
                  )}
                </div>
                {destination.photography_tips && (
                  <p className={cn('text-sm mt-3 p-2 rounded-lg', colors.textMuted, 'bg-white/50 dark:bg-forest-900/50')}>
                    {destination.photography_tips}
                  </p>
                )}
              </div>
            )}

            {/* Local Foods */}
            {destination.local_foods && destination.local_foods.length > 0 && (
              <div className={cn('rounded-xl p-4 border', colors.card === 'bg-white' ? 'bg-white border-stone-200' : 'bg-forest-800/50 border-forest-700')}>
                <h2 className={cn('font-display font-bold text-lg mb-3 flex items-center gap-2', colors.text)}>
                  <Utensils className="w-5 h-5 text-orange-500" />
                  Must Try Foods
                </h2>
                <div className="flex flex-wrap gap-2">
                  {destination.local_foods.map((food, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 rounded-full bg-orange-100 text-orange-700 text-sm font-medium"
                    >
                      {food}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Wildlife */}
            {destination.wildlife && destination.wildlife.length > 0 && (
              <div className={cn('rounded-xl p-4 border', colors.card === 'bg-white' ? 'bg-white border-stone-200' : 'bg-forest-800/50 border-forest-700')}>
                <h2 className={cn('font-display font-bold text-lg mb-3 flex items-center gap-2', colors.text)}>
                  <Leaf className="w-5 h-5 text-green-500" />
                  Wildlife & Nature
                </h2>
                <div className="flex flex-wrap gap-2">
                  {destination.wildlife.map((animal, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-sm"
                    >
                      {animal}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Cultural Tips */}
            {(destination.cultural_tips || destination.things_to_respect || destination.festivals_nearby) && (
              <div className={cn('rounded-xl p-4 border', colors.card === 'bg-white' ? 'bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200' : 'bg-forest-800/50 border-forest-700')}>
                <h2 className={cn('font-display font-bold text-lg mb-3 flex items-center gap-2', colors.text)}>
                  <Music className="w-5 h-5 text-purple-500" />
                  Culture & Traditions
                </h2>

                {destination.cultural_tips && (
                  <p className={cn('text-sm mb-3', colors.textSecondary)}>{destination.cultural_tips}</p>
                )}

                {destination.festivals_nearby && (
                  <div className="mb-3">
                    <p className={cn('text-xs text-stone-500 mb-1')}>Nearby Festivals</p>
                    <p className={cn('text-sm font-medium', colors.text)}>{destination.festivals_nearby}</p>
                  </div>
                )}

                {destination.things_to_respect && (
                  <div className={cn('p-3 rounded-lg', 'bg-white/50 dark:bg-forest-900/50')}>
                    <p className={cn('text-xs font-medium mb-1', colors.text)}>Things to Respect</p>
                    <p className={cn('text-sm text-stone-600', colors.textSecondary)}>{destination.things_to_respect}</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Weather Section */}
        {activeSection === 'weather' && weather && (
          <div className="space-y-4">
            <div className={cn(
              'rounded-2xl p-6 text-white bg-gradient-to-br',
              weather.condition.includes('Sunny') ? 'from-amber-400 to-orange-500' :
              weather.condition.includes('Cloud') ? 'from-slate-400 to-slate-600' :
              'from-blue-400 to-blue-600'
            )}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-white/80 text-sm">Current Weather</p>
                  <p className="text-4xl font-display font-bold">{weather.temp}°C</p>
                  <p className="text-white/80 text-sm mt-1">Feels like {weather.feels_like}°C</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-medium">{weather.condition}</p>
                  <p className="text-sm text-white/80">{destination.name}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/20">
                <div>
                  <p className="text-white/60 text-xs mb-1">Humidity</p>
                  <p className="font-semibold">{weather.humidity}%</p>
                </div>
                <div>
                  <p className="text-white/60 text-xs mb-1">Wind</p>
                  <p className="font-semibold">{weather.wind} km/h</p>
                </div>
                <div>
                  <p className="text-white/60 text-xs mb-1">Sunrise</p>
                  <p className="font-semibold">{weather.sunrise}</p>
                </div>
                <div>
                  <p className="text-white/60 text-xs mb-1">Sunset</p>
                  <p className="font-semibold">{weather.sunset}</p>
                </div>
              </div>
            </div>

            {/* Weather Disclaimer */}
            <div className={cn('rounded-xl p-4 border', 'bg-amber-50 border-amber-200')}>
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className={cn('font-medium text-sm', 'text-amber-800')}>Mountain Weather</p>
                  <p className={cn('text-xs', 'text-amber-700')}>
                    Weather in mountains can change quickly. Always carry rain gear and check local forecasts before trekking.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Emergency Section */}
        {activeSection === 'emergency' && (
          <div className="space-y-4">
            <div className={cn('rounded-xl p-4 border', 'bg-red-50 border-red-200')}>
              <h2 className={cn('font-display font-bold text-lg mb-4 flex items-center gap-2', 'text-red-800')}>
                <Phone className="w-5 h-5" />
                Emergency Contacts
              </h2>

              <div className="space-y-3">
                {destination.nearest_hospital && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-white/50">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                      <Cross className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <p className={cn('font-medium text-sm', 'text-red-800')}>{destination.nearest_hospital}</p>
                      <p className={cn('text-xs', 'text-red-600')}>
                        Hospital • {destination.nearest_hospital_km || '?'} km away
                      </p>
                    </div>
                  </div>
                )}

                {destination.nearest_police && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-white/50">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className={cn('font-medium text-sm', 'text-blue-800')}>{destination.nearest_police}</p>
                      <p className={cn('text-xs', 'text-blue-600')}>
                        Police Station • {destination.nearest_police_km || '?'} km away
                      </p>
                    </div>
                  </div>
                )}

                {destination.nearest_health_post && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-white/50">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className={cn('font-medium text-sm', 'text-green-800')}>{destination.nearest_health_post}</p>
                      <p className={cn('text-xs', 'text-green-600')}>
                        Health Post • {destination.nearest_health_post_km || '?'} km away
                      </p>
                    </div>
                  </div>
                )}

                {destination.local_rescue && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-white/50">
                    <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                      <MountainSnow className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className={cn('font-medium text-sm', 'text-orange-800')}>{destination.local_rescue}</p>
                      <p className={cn('text-xs', 'text-orange-600')}>Local Rescue Team</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Safety Tips */}
              {destination.safety_info && (
                <div className="mt-4 p-3 rounded-lg bg-white/50">
                  <p className={cn('font-medium text-sm mb-1', 'text-red-800')}>Safety Tips</p>
                  <p className={cn('text-xs', 'text-red-700')}>{destination.safety_info}</p>
                </div>
              )}
            </div>

            {/* General Emergency Numbers */}
            <div className={cn('rounded-xl p-4 border', colors.card === 'bg-white' ? 'bg-white border-stone-200' : 'bg-forest-800/50 border-forest-700')}>
              <h3 className={cn('font-semibold text-sm mb-3', colors.text)}>Nepal Emergency Hotlines</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 rounded-lg bg-red-100">
                  <p className="text-xl font-bold text-red-600">100</p>
                  <p className="text-xs text-red-500">Police</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-blue-100">
                  <p className="text-xl font-bold text-blue-600">102</p>
                  <p className="text-xs text-blue-500">Ambulance</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-orange-100">
                  <p className="text-xl font-bold text-orange-600">101</p>
                  <p className="text-xs text-orange-500">Fire</p>
                </div>
              </div>
              <div className="mt-3 text-center p-3 rounded-lg bg-forest-100">
                <p className="text-xl font-bold text-forest-600">HRA: 01-4444025</p>
                <p className="text-xs text-forest-500">Himalayan Rescue Association</p>
              </div>
            </div>
          </div>
        )}

        {/* Packing Checklist Section */}
        {activeSection === 'packing' && (
          <div className="space-y-4">
            <div className={cn('rounded-xl p-4 border', colors.card === 'bg-white' ? 'bg-white border-stone-200' : 'bg-forest-800/50 border-forest-700')}>
              <h2 className={cn('font-display font-bold text-lg mb-4 flex items-center gap-2', colors.text)}>
                <MapPinned className="w-5 h-5 text-forest-600" />
                Packing Checklist
              </h2>

              <div className="space-y-2">
                {[...packingChecklistDefaults, ...(destination.packing_list || []).map((item, i) => ({
                  id: `custom-${i}`,
                  label: item,
                  icon: Check
                }))].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => toggleCheckItem(item.id)}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-lg transition-all',
                      checkedItems.has(item.id)
                        ? 'bg-forest-100 border-2 border-forest-500'
                        : 'bg-stone-50 dark:bg-forest-900/50 border-2 border-transparent hover:border-stone-200'
                    )}
                  >
                    <div className={cn(
                      'w-6 h-6 rounded flex items-center justify-center transition-all',
                      checkedItems.has(item.id) ? 'bg-forest-600' : 'bg-stone-200 dark:bg-forest-700'
                    )}>
                      {checkedItems.has(item.id) && <Check className="w-4 h-4 text-white" />}
                    </div>
                    <item.icon className={cn('w-4 h-4', checkedItems.has(item.id) ? 'text-forest-600' : colors.textMuted)} />
                    <span className={cn(
                      'font-medium text-sm',
                      checkedItems.has(item.id) ? 'text-forest-700' : colors.text
                    )}>
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-stone-200 dark:border-forest-700">
                <div className="flex items-center justify-between">
                  <span className={cn('text-sm', colors.textMuted)}>
                    {checkedItems.size} of {packingChecklistDefaults.length + (destination.packing_list?.length || 0)} items
                  </span>
                  <button
                    onClick={() => setCheckedItems(new Set())}
                    className="text-sm text-forest-600 font-medium"
                  >
                    Reset
                  </button>
                </div>
                <div className="mt-2 h-2 bg-stone-200 dark:bg-forest-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-forest-500 transition-all"
                    style={{
                      width: `${(checkedItems.size / (packingChecklistDefaults.length + (destination.packing_list?.length || 0))) * 100}%`
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reviews Section */}
        {activeSection === 'reviews' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className={cn('font-display font-bold text-lg', colors.text)}>Traveler Reviews</h2>
                <p className={cn('text-sm', colors.textMuted)}>{reviews.length} reviews</p>
              </div>
              <button
                onClick={() => setShowReviewModal(true)}
                className="btn-primary text-sm py-2"
              >
                Write Review
              </button>
            </div>

            {reviews.length === 0 ? (
              <div className={cn(
                'text-center py-8 rounded-xl border',
                colors.card === 'bg-white' ? 'bg-white border-stone-200' : 'bg-forest-800/50 border-forest-700'
              )}>
                <MessageCircle className={cn('w-10 h-10 mx-auto mb-2 opacity-30', colors.textMuted)} />
                <p className={cn('text-sm mb-2', colors.textSecondary)}>No reviews yet</p>
                <p className={cn('text-xs', colors.textMuted)}>Be the first to review this destination</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className={cn(
                      'p-4 rounded-xl border',
                      colors.card === 'bg-white' ? 'bg-white border-stone-200' : 'bg-forest-800/50 border-forest-700'
                    )}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center font-bold',
                        colors.accentBg
                      )}>
                        {(review.profiles?.name || 'A')[0].toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className={cn('font-medium text-sm', colors.text)}>
                          {review.profiles?.name || 'Anonymous'}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="flex gap-0.5">
                            {[...Array(review.rating)].map((_, i) => (
                              <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                            ))}
                          </div>
                          <span className={cn('text-xs', colors.textMuted)}>
                            {new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    </div>
                    {review.title && (
                      <p className={cn('font-medium text-sm mb-1', colors.text)}>{review.title}</p>
                    )}
                    {review.content && (
                      <p className={cn('text-sm', colors.textSecondary)}>{review.content}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Action Bar */}
      <div className="sticky bottom-20 mx-4 p-3 bg-white dark:bg-forest-800 rounded-2xl shadow-lg border border-stone-200 dark:border-forest-700">
        <div className="flex items-center justify-between">
          <div>
            <p className={cn('font-semibold', colors.text)}>
              {destination.budget_min && destination.budget_max
                ? `NPR ${destination.budget_min.toLocaleString()} - ${destination.budget_max.toLocaleString()}`
                : 'Budget varies'}
            </p>
            <p className={cn('text-xs', colors.textMuted)}>Estimated cost</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowReportModal(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-stone-200 dark:border-forest-600 hover:border-amber-400 text-amber-600"
            >
              <Flag className="w-4 h-4" />
              Report
            </button>
            <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-stone-200 dark:border-forest-600 hover:border-forest-500">
              <ExternalLink className="w-4 h-4" />
              Maps
            </button>
            <button className="btn-primary text-sm py-2">
              Plan Trip
            </button>
          </div>
        </div>
      </div>

      {/* Report Issue Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className={cn(
            'w-full max-w-md rounded-2xl overflow-hidden',
            colors.card === 'bg-white' ? 'bg-white' : 'bg-forest-900'
          )}>
            <div className="p-4 border-b border-stone-200 dark:border-forest-700 flex items-center justify-between">
              <h2 className={cn('font-semibold flex items-center gap-2', colors.text)}>
                <Flag className="w-5 h-5 text-amber-500" />
                Report an Issue
              </h2>
              <button
                onClick={() => setShowReportModal(false)}
                className={cn('p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-forest-700', colors.text)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {reportSubmitted ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                    <Check className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className={cn('font-semibold mb-1', colors.text)}>Thank you!</h3>
                  <p className={cn('text-sm', colors.textSecondary)}>
                    Your report helps us keep Paila accurate for everyone.
                  </p>
                </div>
              ) : (
                <>
                  <p className={cn('text-sm', colors.textSecondary)}>
                    Help us improve information about {destination.name}.
                  </p>

                  <div>
                    <label className={cn('text-sm font-medium mb-2 block', colors.text)}>Issue Type</label>
                    <div className="space-y-2">
                      {[
                        { id: 'wrong_info', label: 'Incorrect information' },
                        { id: 'closed', label: 'Trail or road closed' },
                        { id: 'blocked', label: 'Access blocked or restricted' },
                        { id: 'dangerous', label: 'Dangerous conditions' },
                        { id: 'contact', label: 'Wrong contact details' },
                        { id: 'other', label: 'Other issue' },
                      ].map((type) => (
                        <button
                          key={type.id}
                          onClick={() => setReportType(type.id)}
                          className={cn(
                            'w-full text-left px-4 py-3 rounded-lg text-sm transition-all',
                            reportType === type.id
                              ? 'bg-amber-100 dark:bg-amber-900/30 border-2 border-amber-500 text-amber-800 dark:text-amber-200'
                              : colors.card === 'bg-white'
                                ? 'bg-stone-50 border-2 border-transparent hover:border-stone-200'
                                : 'bg-forest-800 border-2 border-transparent hover:border-forest-600'
                          )}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className={cn('text-sm font-medium mb-2 block', colors.text)}>
                      Details (optional)
                    </label>
                    <textarea
                      value={reportDescription}
                      onChange={(e) => setReportDescription(e.target.value)}
                      placeholder="Provide more details about the issue..."
                      rows={3}
                      className={cn(
                        'w-full px-4 py-3 rounded-lg text-sm resize-none',
                        colors.card === 'bg-white'
                          ? 'bg-stone-50 border-2 border-stone-200 focus:border-forest-500'
                          : 'bg-forest-800 border-2 border-forest-700 focus:border-forest-500',
                        colors.text,
                        'placeholder:text-stone-400 focus:outline-none'
                      )}
                    />
                  </div>

                  <button
                    onClick={submitReport}
                    disabled={!reportType}
                    className={cn(
                      'w-full py-3 rounded-xl font-semibold transition-all',
                      reportType
                        ? 'bg-amber-500 text-white hover:bg-amber-600'
                        : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                    )}
                  >
                    Submit Report
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
