import { useState, useEffect } from 'react';
import {
  Search, Star, MapPin, Clock, ChevronRight, Heart, SlidersHorizontal, Users, Shield
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useI18n } from '../../lib/i18n';
import { useThemeColors } from '../../lib/ThemeContext';
import { useSaved } from '../../lib/useSaved';
import { cn } from '../../lib/utils';
import { DestinationDetail } from './DestinationDetail';
import { getPlaceImage } from '../../lib/imageUtils';

const categories = ['All', 'Trekking', 'Hiking', 'Lake', 'Wildlife', 'Adventure', 'Cultural', 'Heritage', 'Nature', 'Pilgrimage'];

// Helper component for async place images
function PlaceImage({ place, className }: { place: any; className?: string }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    async function loadImage() {
      const url = await getPlaceImage({
        id: place.id,
        name: place.name,
        category: place.category,
        image_url: place.image_url,
        cached_image_url: place.cached_image_url
      });
      setImageUrl(url);
    }
    if (place) loadImage();
  }, [place]);

  if (!imageUrl) {
    return (
      <div className={`${className} bg-gradient-to-br from-forest-600 to-forest-400 animate-pulse`} />
    );
  }

  return (
    <img
      src={imageUrl}
      alt={place.name}
      className={className}
    />
  );
}

export function DiscoverTab() {
  const { t } = useI18n();
  const colors = useThemeColors();
  const { isSaved, toggleSave } = useSaved();
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [destinations, setDestinations] = useState<any[]>([]);
  const [hiddenGems, setHiddenGems] = useState<any[]>([]);
  const [guides, setGuides] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDestination, setSelectedDestination] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const { data: dests } = await supabase
        .from('destinations')
        .select('*')
        .order('featured', { ascending: false })
        .order('rating', { ascending: false })
        .limit(24);
      if (dests) setDestinations(dests);

      const { data: gems } = await supabase
        .from('hidden_gems')
        .select('*')
        .limit(12);
      if (gems) setHiddenGems(gems);

      const { data: guidesData } = await supabase
        .from('guides')
        .select('*')
        .eq('available', true)
        .limit(6);
      if (guidesData) setGuides(guidesData);

      // Fetch approved vendors (businesses)
      const { data: vendorsData } = await supabase
        .from('vendors')
        .select('*')
        .eq('status', 'approved')
        .limit(6);
      if (vendorsData) setVendors(vendorsData);

      setLoading(false);
    }
    fetchData();
  }, []);

  const filteredDestinations = destinations.filter((d) => {
    const matchesSearch = !search || d.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === 'All' || d.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleToggleSave = async (type: 'destination' | 'hidden_gem', id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleSave(type, id);
  };

  // Show destination detail if selected
  if (selectedDestination) {
    return (
      <DestinationDetail
        destinationId={selectedDestination}
        onBack={() => setSelectedDestination(null)}
      />
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className={cn('text-2xl md:text-3xl font-display font-bold mb-1', colors.text)}>
          {t('discover.title')}
        </h1>
        <p className={cn('text-sm', colors.textSecondary)}>{t('discover.subtitle')}</p>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className={cn('absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5', colors.textMuted)} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search destinations, hidden gems..."
            className={cn(
              'w-full pl-12 pr-4 py-3 rounded-xl border-2 transition-all',
              colors.card === 'bg-white' ? 'bg-white border-stone-200' : 'bg-forest-800/50 border-forest-700',
              colors.text,
              'placeholder:text-stone-400 focus:outline-none focus:border-forest-500'
            )}
          />
        </div>
        <button className={cn(
          'px-4 rounded-xl border-2 flex items-center gap-2 transition-colors',
          colors.card === 'bg-white' ? 'bg-white border-stone-200 hover:border-forest-300' : 'bg-forest-800/50 border-forest-700 hover:border-forest-600'
        )}>
          <SlidersHorizontal className={cn('w-5 h-5', colors.textSecondary)} />
        </button>
      </div>

      {/* Category Chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={cn(
              'flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all',
              activeCategory === category
                ? 'bg-forest-600 text-white'
                : colors.card === 'bg-white'
                  ? 'bg-white border border-stone-200 text-stone-600 hover:border-forest-300'
                  : 'bg-forest-800/50 border border-forest-700 text-forest-200 hover:border-forest-600'
            )}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Popular Destinations */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className={cn('font-display font-bold text-lg', colors.text)}>
            {t('discover.popular')}
          </h2>
          <button className="text-sm text-forest-600 hover:text-forest-700 flex items-center gap-1 font-medium">
            {t('common.viewAll')} <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            [...Array(6)].map((_, i) => (
              <div key={i} className="h-48 rounded-xl bg-stone-200 animate-pulse" />
            ))
          ) : (
            filteredDestinations.map((dest) => (
              <div
                key={dest.id}
                onClick={() => setSelectedDestination(dest.id)}
                className={cn(
                  'rounded-xl overflow-hidden group cursor-pointer',
                  'border transition-all hover:shadow-lg hover:-translate-y-1',
                  colors.card === 'bg-white' ? 'bg-white border-stone-200' : 'bg-forest-800/50 border-forest-700'
                )}
              >
                <div className="h-40 bg-gradient-to-br from-forest-600 to-forest-400 relative">
                  <PlaceImage
                    place={dest}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <button
                    onClick={(e) => handleToggleSave('destination', dest.id, e)}
                    className={cn(
                      'absolute top-3 right-3 p-2 rounded-full transition-all',
                      isSaved('destination', dest.id)
                        ? 'bg-red-500 text-white'
                        : 'bg-white/90 opacity-0 group-hover:opacity-100 hover:bg-white'
                    )}
                  >
                    <Heart className={cn(
                      'w-4 h-4',
                      isSaved('destination', dest.id) ? 'fill-white text-white' : 'text-stone-600'
                    )} />
                  </button>
                  {dest.featured && (
                    <div className="absolute top-3 left-3 px-2 py-1 bg-amber-500 text-white text-xs font-bold rounded">
                      Featured
                    </div>
                  )}
                  {dest.rating && (
                    <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      <span className="text-xs font-bold text-stone-800">{dest.rating}</span>
                      <span className="text-xs text-stone-500">({dest.review_count})</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className={cn('font-semibold mb-1', colors.text)}>{dest.name}</h3>
                  <div className={cn('flex items-center gap-3 text-xs', colors.textMuted)}>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> {dest.region}
                    </span>
                    {dest.category && (
                      <span className={cn(
                        'px-2 py-0.5 rounded text-xs',
                        colors.card === 'bg-white' ? 'bg-forest-100 text-forest-700' : 'bg-forest-700 text-forest-200'
                      )}>
                        {dest.category}
                      </span>
                    )}
                  </div>
                  {dest.difficulty && (
                    <div className={cn('flex items-center gap-2 mt-2 text-xs', colors.textMuted)}>
                      <span className={cn(
                        'px-2 py-0.5 rounded',
                        dest.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                        dest.difficulty === 'Moderate' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      )}>
                        {dest.difficulty}
                      </span>
                      {dest.altitude_m && (
                        <span>{(dest.altitude_m / 1000).toFixed(1)}km altitude</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Hidden Gems */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className={cn('font-display font-bold text-lg', colors.text)}>
            {t('discover.hidden')}
          </h2>
          <button className="text-sm text-forest-600 hover:text-forest-700 flex items-center gap-1 font-medium">
            {t('common.viewAll')} <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {hiddenGems.map((gem) => (
            <div
              key={gem.id}
              className={cn(
                'rounded-xl overflow-hidden group cursor-pointer',
                'border transition-all hover:shadow-md',
                colors.card === 'bg-white' ? 'bg-forest-50 border-forest-100' : 'bg-forest-900/30 border-forest-800'
              )}
            >
              <div className="flex">
                <div className="w-24 h-24 flex-shrink-0 relative">
                  {gem.image_url && (
                    <img src={gem.image_url} alt={gem.name} className="w-full h-full object-cover" />
                  )}
                  <button
                    onClick={(e) => handleToggleSave('hidden_gem', gem.id, e)}
                    className={cn(
                      'absolute top-2 left-2 p-1.5 rounded-full transition-all',
                      isSaved('hidden_gem', gem.id)
                        ? 'bg-red-500 text-white'
                        : 'bg-white/90 opacity-0 group-hover:opacity-100'
                    )}
                  >
                    <Heart className={cn(
                      'w-3 h-3',
                      isSaved('hidden_gem', gem.id) ? 'fill-white text-white' : 'text-stone-600'
                    )} />
                  </button>
                </div>
                <div className="flex-1 p-4 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {gem.pilot_pick && (
                      <span className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded font-medium">
                        Pilot Pick
                      </span>
                    )}
                    {gem.nature_score && (
                      <span className={cn('text-xs font-bold', colors.textSecondary)}>
                        {gem.nature_score} Nature Score
                      </span>
                    )}
                  </div>
                  <h3 className={cn('font-semibold mb-1', colors.text)}>{gem.name}</h3>
                  <p className={cn('text-xs line-clamp-2', colors.textMuted)}>
                    {gem.description?.slice(0, 80)}...
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Find a Guide CTA */}
      <section className={cn(
        'rounded-2xl p-6 bg-gradient-to-r from-forest-600 to-forest-500 text-white'
      )}>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center">
            <Users className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <h3 className="font-display font-bold text-lg mb-1">{t('discover.guides')}</h3>
            <p className="text-sm text-white/80">Connect with local experts who know the trails best</p>
          </div>
          <button className="px-4 py-2 bg-white text-forest-700 rounded-xl font-semibold text-sm hover:bg-forest-50 transition-colors">
            {t('common.getStarted')}
          </button>
        </div>
      </section>

      {/* Featured Guides */}
      {guides.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className={cn('font-display font-bold text-lg', colors.text)}>
              Available Guides
            </h2>
            <button className="text-sm text-forest-600 hover:text-forest-700 flex items-center gap-1 font-medium">
              View all <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {guides.map((guide) => (
              <div
                key={guide.id}
                className={cn(
                  'rounded-xl p-4 border transition-all cursor-pointer',
                  colors.card === 'bg-white' ? 'bg-white border-stone-200 hover:shadow-md' : 'bg-forest-800/50 border-forest-700'
                )}
              >
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src={guide.avatar_url}
                    alt={guide.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className={cn('font-semibold', colors.text)}>{guide.name}</h3>
                      {guide.verified && (
                        <Shield className="w-4 h-4 text-forest-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span className={cn('text-xs', colors.textSecondary)}>
                        {guide.rating} ({guide.review_count})
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={cn('font-bold', colors.text)}>NPR {guide.price_per_day.toLocaleString()}</div>
                    <div className={cn('text-xs', colors.textMuted)}>per day</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {guide.specialties?.slice(0, 3).map((s: string) => (
                    <span
                      key={s}
                      className={cn(
                        'text-xs px-2 py-0.5 rounded',
                        colors.card === 'bg-white' ? 'bg-forest-100 text-forest-700' : 'bg-forest-700 text-forest-200'
                      )}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Local Services & Businesses */}
      {vendors.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className={cn('font-display font-bold text-lg', colors.text)}>
              Local Services
            </h2>
            <span className="text-xs text-forest-600 font-medium bg-forest-100 px-2 py-1 rounded-full">
              NEW
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {vendors.map((vendor) => (
              <div
                key={vendor.id}
                className={cn(
                  'rounded-xl overflow-hidden border transition-all cursor-pointer hover:shadow-md',
                  colors.card === 'bg-white' ? 'bg-white border-stone-200' : 'bg-forest-800/50 border-forest-700'
                )}
              >
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center text-xl">
                      {vendor.business_type === 'guide' ? '🧭' :
                       vendor.business_type === 'homestay' ? '🏡' :
                       vendor.business_type === 'transport' ? '🚌' :
                       vendor.business_type === 'cafe' ? '☕' :
                       vendor.business_type === 'hotel' ? '🏨' :
                       vendor.business_type === 'tour_operator' ? '🎒' :
                       vendor.business_type === 'rental' ? '🛍️' : '🌿'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={cn('font-semibold truncate', colors.text)}>{vendor.business_name}</h3>
                      <p className={cn('text-xs', colors.textMuted)}>
                        {vendor.business_type.replace('_', ' ')} - {vendor.location || vendor.district}
                      </p>
                    </div>
                  </div>
                  <p className={cn('text-sm line-clamp-2 mb-3', colors.textSecondary)}>
                    {vendor.description || 'Local service provider on Paila'}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className={cn('text-xs px-2 py-1 rounded-full', colors.card === 'bg-white' ? 'bg-amber-100 text-amber-700' : 'bg-amber-900/30 text-amber-300')}>
                      Contact for price
                    </span>
                    <button className="text-xs text-forest-600 font-medium hover:underline">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
