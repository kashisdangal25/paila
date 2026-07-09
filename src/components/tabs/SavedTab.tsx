import { useState, useEffect } from 'react';
import { Heart, MapPin, Star, Search, ChevronRight, Trash2, FolderPlus, Compass, User, Home } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useI18n } from '../../lib/i18n';
import { useThemeColors } from '../../lib/ThemeContext';
import { useSaved, SavedItem } from '../../lib/useSaved';
import { cn } from '../../lib/utils';

interface Collection {
  id: string;
  name: string;
  count: number;
  color: string;
}

export function SavedTab() {
  const { t } = useI18n();
  const colors = useThemeColors();
  const { savedItems, loading, removeSaved } = useSaved();
  const [search, setSearch] = useState('');
  const [activeCollection, setActiveCollection] = useState<string>('all');

  // Group saved items by collection
  const collections: Collection[] = [
    { id: 'all', name: 'All Saved', count: savedItems.length, color: 'from-forest-500 to-forest-600' },
    { id: 'destinations', name: 'Destinations', count: savedItems.filter(s => s.type === 'destination').length, color: 'from-blue-500 to-blue-600' },
    { id: 'hidden_gems', name: 'Hidden Gems', count: savedItems.filter(s => s.type === 'hidden_gem').length, color: 'from-purple-500 to-purple-600' },
    { id: 'guides', name: 'Guides', count: savedItems.filter(s => s.type === 'guide').length, color: 'from-orange-500 to-orange-600' },
    { id: 'stays', name: 'Stays', count: savedItems.filter(s => s.type === 'stay').length, color: 'from-teal-500 to-teal-600' },
  ].filter(c => c.id === 'all' || c.count > 0);

  const filteredItems = savedItems.filter(item => {
    const matchesSearch = !search || item.data.name.toLowerCase().includes(search.toLowerCase());
    const matchesCollection = activeCollection === 'all' || item.type === activeCollection;
    return matchesSearch && matchesCollection;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'destination': return MapPin;
      case 'hidden_gem': return Compass;
      case 'guide': return User;
      case 'stay': return Home;
      default: return Heart;
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className={cn('text-2xl md:text-3xl font-display font-bold', colors.text)}>
          {t('nav.saved')}
        </h1>
        <p className={cn('text-sm', colors.textSecondary)}>Your bucket list of places to explore</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className={cn('absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5', colors.textMuted)} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search saved places..."
          className={cn(
            'w-full pl-12 pr-4 py-3 rounded-xl border-2 transition-all',
            colors.card === 'bg-white' ? 'bg-white border-stone-200' : 'bg-forest-800/50 border-forest-700',
            colors.text,
            'placeholder:text-stone-400 focus:outline-none focus:border-forest-500'
          )}
        />
      </div>

      {/* Collections */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className={cn('font-semibold', colors.text)}>Collections</h2>
          <button className="text-sm text-forest-600 hover:text-forest-700 flex items-center gap-1 font-medium">
            <FolderPlus className="w-4 h-4" /> New Collection
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {collections.map((collection) => (
            <button
              key={collection.id}
              onClick={() => setActiveCollection(collection.id)}
              className={cn(
                'flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2',
                activeCollection === collection.id
                  ? 'bg-forest-600 text-white'
                  : colors.card === 'bg-white'
                    ? 'bg-white border border-stone-200 text-stone-600 hover:border-forest-300'
                    : 'bg-forest-800/50 border border-forest-700 text-forest-200 hover:border-forest-600'
              )}
            >
              {collection.id === 'all' && <Heart className="w-4 h-4" />}
              {collection.id === 'destinations' && <MapPin className="w-4 h-4" />}
              {collection.id === 'hidden_gems' && <Compass className="w-4 h-4" />}
              {collection.id === 'guides' && <User className="w-4 h-4" />}
              {collection.id === 'stays' && <Home className="w-4 h-4" />}
              {collection.name}
              <span className={cn(
                'px-2 py-0.5 rounded-full text-xs',
                activeCollection === collection.id
                  ? 'bg-white/20 text-white'
                  : 'bg-stone-100 text-stone-500'
              )}>
                {collection.count}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Saved Items */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className={cn('font-semibold', colors.text)}>
            {activeCollection === 'all' ? 'All Saved' : collections.find(c => c.id === activeCollection)?.name}
          </h2>
          <span className={cn('text-sm', colors.textMuted)}>{filteredItems.length} items</span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-stone-200 animate-pulse" />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className={cn(
            'text-center py-12 rounded-xl border',
            colors.card === 'bg-white' ? 'bg-white border-stone-200' : 'bg-forest-800/50 border-forest-700'
          )}>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-forest-100 dark:bg-forest-800 flex items-center justify-center">
              <Heart className={cn('w-8 h-8 text-forest-500')} />
            </div>
            <h3 className={cn('font-semibold mb-2', colors.text)}>
              {activeCollection === 'all'
                ? 'Your next adventure starts here'
                : 'No items in this collection'}
            </h3>
            <p className={cn('text-sm max-w-xs mx-auto', colors.textSecondary)}>
              {activeCollection === 'all'
                ? 'Save destinations, hidden gems, guides, and stays to plan your perfect Nepal journey.'
                : 'Explore and save items to this collection.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <SavedItemCard
                key={item.user_saved_id}
                item={item}
                colors={colors}
                onRemove={() => removeSaved(item.user_saved_id)}
                Icon={getIcon(item.type)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function SavedItemCard({
  item,
  colors,
  onRemove,
  Icon,
}: {
  item: SavedItem;
  colors: any;
  onRemove: () => void;
  Icon: any;
}) {
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div
      className={cn(
        'flex items-center gap-4 p-4 rounded-xl border transition-all group cursor-pointer',
        colors.card === 'bg-white' ? 'bg-white border-stone-200 hover:shadow-md' : 'bg-forest-800/50 border-forest-700'
      )}
    >
      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
        {item.data.image_url ? (
          <img src={item.data.image_url} alt={item.data.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        ) : (
          <div className={cn('w-full h-full flex items-center justify-center', colors.accentBg)}>
            <Icon className={cn('w-6 h-6', `text-${colors.accent}`)} />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className={cn('font-semibold', colors.text)}>{item.data.name}</h3>
          <span className={cn(
            'px-2 py-0.5 rounded text-xs font-medium',
            colors.card === 'bg-white' ? 'bg-forest-100 text-forest-700' : 'bg-forest-700 text-forest-200'
          )}>
            {item.type === 'destination' ? 'Destination' :
             item.type === 'hidden_gem' ? 'Hidden Gem' :
             item.type === 'guide' ? 'Guide' : 'Stay'}
          </span>
        </div>
        <div className={cn('flex items-center gap-2 mt-1 text-xs', colors.textMuted)}>
          {item.data.region && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> {item.data.region}
            </span>
          )}
          {item.data.rating && (
            <span className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> {item.data.rating}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {showConfirm ? (
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 transition-colors"
            >
              Remove
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowConfirm(false);
              }}
              className="px-3 py-1.5 bg-stone-100 text-stone-600 rounded-lg text-xs font-medium hover:bg-stone-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowConfirm(true);
              }}
              className="p-2 rounded-lg hover:bg-red-50 text-stone-400 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <ChevronRight className={cn('w-5 h-5', colors.textMuted)} />
          </>
        )}
      </div>
    </div>
  );
}
