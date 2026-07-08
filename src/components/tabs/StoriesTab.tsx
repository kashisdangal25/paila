import { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Play, Clock, Plus, ChevronRight, Eye, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useI18n } from '../../lib/i18n';
import { useThemeColors } from '../../lib/ThemeContext';
import { cn } from '../../lib/utils';

interface Story {
  id: string;
  user_name: string;
  user_avatar?: string;
  title: string;
  content: string;
  story_type: string;
  views: number;
  likes: number;
  destination_id?: string;
  destinations?: { name: string };
  created_at: string;
  featured: boolean;
}

export function StoriesTab() {
  const { t } = useI18n();
  const colors = useThemeColors();
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStories() {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_stories')
        .select(`*, destinations (name)`)
        .order('featured', { ascending: false })
        .order('views', { ascending: false })
        .limit(12);

      if (data) {
        setStories(data);
      }
      setLoading(false);
    }
    fetchStories();
  }, []);

  const filteredStories = activeCategory === 'all'
    ? stories
    : stories.filter(s => s.story_type === activeCategory);

  const recentStories = stories.slice(0, 5);
  const featuredStories = stories.filter(s => s.featured).slice(0, 3);

  const formatViews = (views: number) => views >= 1000 ? `${(views / 1000).toFixed(1)}K` : views;

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className={cn('text-2xl md:text-3xl font-display font-bold', colors.text)}>Stories</h1>
        <button className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Share Story
        </button>
      </div>

      {/* Story Circles */}
      <section>
        <h2 className={cn('font-semibold mb-4', colors.text)}>Recent Travelers</h2>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          <button className={cn('flex-shrink-0 w-20 flex flex-col items-center gap-2 transition-all hover:scale-105')}>
            <div className={cn('w-16 h-16 rounded-full border-2 border-dashed border-forest-400 flex items-center justify-center bg-forest-50 dark:bg-forest-900')}>
              <Plus className="w-6 h-6 text-forest-600" />
            </div>
            <span className={cn('text-xs font-medium', colors.textSecondary)}>Add Story</span>
          </button>

          {recentStories.map((story) => (
            <button
              key={story.id}
              onClick={() => setSelectedStory(story)}
              className={cn('flex-shrink-0 w-20 flex flex-col items-center gap-2 transition-all hover:scale-105', selectedStory?.id === story.id && 'scale-105')}
            >
              <div className={cn('w-16 h-16 rounded-full p-0.5', selectedStory?.id === story.id ? 'bg-gradient-to-tr from-forest-600 to-forest-400' : 'bg-gradient-to-tr from-stone-300 to-stone-200')}>
                <div className={cn('w-full h-full rounded-full overflow-hidden', colors.bgSecondary)}>
                  {story.user_avatar ? (
                    <img src={story.user_avatar} alt={story.user_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className={cn('w-full h-full flex items-center justify-center text-xl font-bold', colors.accentBg, `text-${colors.accent}`)}>{story.user_name[0]}</div>
                  )}
                </div>
              </div>
              <div className="text-center">
                <span className={cn('text-xs font-medium block truncate w-16', colors.text)}>{story.user_name.split(' ')[0]}</span>
                <span className={cn('text-[10px]', colors.textMuted)}>{formatViews(story.views)} views</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Category Filter */}
      <div className="flex gap-2">
        {[
          { id: 'all', label: 'All', icon: Sparkles },
          { id: 'photo', label: 'Photos', icon: null },
          { id: 'video', label: 'Videos', icon: Play },
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2',
              activeCategory === cat.id
                ? 'bg-forest-600 text-white'
                : colors.card === 'bg-white'
                  ? 'bg-white border border-stone-200 text-stone-600 hover:border-forest-300'
                  : 'bg-forest-800/50 border border-forest-700 text-forest-200 hover:border-forest-600'
            )}
          >
            {cat.icon && <cat.icon className="w-4 h-4" />}
            {cat.label}
          </button>
        ))}
      </div>

      {/* Featured Stories */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className={cn('font-display font-bold text-lg', colors.text)}>Featured Stories</h2>
          <button className="text-sm text-forest-600 hover:text-forest-700 flex items-center gap-1 font-medium">View all <ChevronRight className="w-4 h-4" /></button>
        </div>

        {loading ? (
          <div className="space-y-4">{[...Array(3)].map((_, i) => (<div key={i} className="h-32 rounded-xl bg-stone-200 animate-pulse" />))}</div>
        ) : (featuredStories.length === 0 && filteredStories.length === 0) ? (
          <div className={cn('text-center py-12 rounded-xl border', colors.card === 'bg-white' ? 'bg-white border-stone-200' : 'bg-forest-800/50 border-forest-700')}>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Play className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className={cn('font-semibold mb-2', colors.text)}>Share your adventure</h3>
            <p className={cn('text-sm max-w-xs mx-auto', colors.textSecondary)}>
              Be the first to share your Nepal travel story. Inspire others with your journey!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {(featuredStories.length > 0 ? featuredStories : filteredStories.slice(0, 3)).map((story) => (
              <article
                key={story.id}
                onClick={() => setSelectedStory(story)}
                className={cn(
                  'rounded-xl overflow-hidden border cursor-pointer transition-all hover:shadow-md',
                  colors.card === 'bg-white' ? 'bg-white border-stone-200' : 'bg-forest-800/50 border-forest-700',
                  selectedStory?.id === story.id && 'ring-2 ring-forest-500'
                )}
              >
                <div className="flex items-start gap-4 p-4">
                  <div className={cn('w-20 h-20 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden', story.story_type === 'video' ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-gradient-to-br from-forest-500 to-forest-400')}>
                    {story.story_type === 'video' ? <Play className="w-8 h-8 text-white" /> : <span className="text-2xl">📷</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn('text-xs font-medium', colors.textMuted)}>{story.user_name}</span>
                      <span className={cn('text-xs', colors.textMuted)}>•</span>
                      <span className={cn('flex items-center gap-1 text-xs', colors.textMuted)}>
                        <Clock className="w-3 h-3" /> {story.created_at ? new Date(story.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Today'}
                      </span>
                    </div>
                    <h3 className={cn('font-semibold mb-1', colors.text)}>{story.title}</h3>
                    <p className={cn('text-sm line-clamp-2', colors.textSecondary)}>{story.content}</p>
                    <div className="flex items-center gap-4 mt-3">
                      <button className={cn('flex items-center gap-1.5 text-sm', colors.textMuted, 'hover:text-red-500 transition-colors')}>
                        <Heart className="w-4 h-4" /> {story.likes}
                      </button>
                      <span className={cn('flex items-center gap-1.5 text-sm', colors.textMuted)}>
                        <Eye className="w-4 h-4" /> {formatViews(story.views)}
                      </span>
                      <button className={cn('flex items-center gap-1.5 text-sm', colors.textMuted, 'hover:text-forest-500 transition-colors')}>
                        <MessageCircle className="w-4 h-4" />
                      </button>
                      <button className={cn('flex items-center gap-1.5 text-sm ml-auto', colors.textMuted, 'hover:text-forest-500 transition-colors')}>
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Categories */}
      <section>
        <h2 className={cn('font-display font-bold text-lg mb-4', colors.text)}>Explore by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { name: 'Trekking', icon: '🥾', count: 12 },
            { name: 'Culture', icon: '🏯', count: 8 },
            { name: 'Food', icon: '🍜', count: 6 },
            { name: 'Wildlife', icon: '🐅', count: 4 },
          ].map((cat) => (
            <button key={cat.name} className={cn('rounded-xl p-4 text-center transition-all', colors.card === 'bg-white' ? 'bg-white border border-stone-200 hover:bg-forest-50 hover:border-forest-200' : 'bg-forest-800/50 border border-forest-700 hover:bg-forest-800')}>
              <span className="text-2xl mb-2 block">{cat.icon}</span>
              <span className={cn('text-sm font-medium', colors.text)}>{cat.name}</span>
              <span className={cn('text-xs block', colors.textMuted)}>{cat.count} stories</span>
            </button>
          ))}
        </div>
      </section>

      {/* Story Modal */}
      {selectedStory && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setSelectedStory(null)}>
          <div className={cn('w-full max-w-lg rounded-2xl overflow-hidden', colors.card === 'bg-white' ? 'bg-white' : 'bg-forest-900')} onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-stone-100 dark:border-forest-700 flex items-center gap-3">
              <img src={selectedStory.user_avatar || `https://ui-avatars.com/api/?name=${selectedStory.user_name}&background=16a34a&color=fff`} alt={selectedStory.user_name} className="w-10 h-10 rounded-full" />
              <div>
                <h3 className={cn('font-semibold', colors.text)}>{selectedStory.user_name}</h3>
                <p className={cn('text-xs', colors.textMuted)}>{selectedStory.destinations?.name || 'Travel Story'}</p>
              </div>
              <button onClick={() => setSelectedStory(null)} className={cn('ml-auto p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-forest-700', colors.text)}>✕</button>
            </div>
            <div className="p-6">
              <h2 className={cn('text-xl font-display font-bold mb-2', colors.text)}>{selectedStory.title}</h2>
              <p className={cn('text-base leading-relaxed', colors.textSecondary)}>{selectedStory.content}</p>
            </div>
            <div className="p-4 border-t border-stone-100 dark:border-forest-700 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button className="flex items-center gap-1 text-red-500"><Heart className="w-5 h-5 fill-red-500" /> {selectedStory.likes}</button>
                <span className={cn('flex items-center gap-1', colors.textMuted)}><Eye className="w-4 h-4" /> {formatViews(selectedStory.views)}</span>
              </div>
              <button className={cn('p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-forest-700', colors.text)}><Share2 className="w-5 h-5" /></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}