import { useState, useEffect } from 'react';
import { Users, Search, TrendingUp, MapPin, Calendar, MessageCircle, ChevronRight, Plus, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { useI18n } from '../../lib/i18n';
import { useThemeColors } from '../../lib/ThemeContext';
import { cn } from '../../lib/utils';

const communityGroups = [
  { id: '1', name: 'Solo Female Trekkers Nepal', members: '4.2K', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80', gradient: 'from-pink-500 to-rose-500' },
  { id: '2', name: 'Kathmandu Valley Hikers', members: '2.8K', avatar: 'https://images.unsplash.com/photo-1501785888041-af3ef2d57d8a?w=100&q=80', gradient: 'from-forest-500 to-forest-600' },
  { id: '3', name: 'Nepal Food Explorers', members: '1.5K', avatar: 'https://images.unsplash.com/photo-1504674900247-84e39c1b3a00?w=100&q=80', gradient: 'from-orange-500 to-amber-500' },
  { id: '4', name: 'Photography Nepal', members: '2.1K', avatar: 'https://images.unsplash.com/photo-1506905925346-21bda18d6ff1?w=100&q=80', gradient: 'from-blue-500 to-indigo-500' },
];

export function CommunityTab() {
  const { t } = useI18n();
  const colors = useThemeColors();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'groups' | 'events' | 'discussions'>('events');
  const [events, setEvents] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const { data: eventsData } = await supabase
        .from('user_events')
        .select('*')
        .eq('status', 'open')
        .gte('event_date', new Date().toISOString().split('T')[0])
        .order('event_date', { ascending: true })
        .limit(8);

      if (eventsData) {
        setEvents(eventsData);
      }

      const { data: postsData } = await supabase
        .from('user_posts')
        .select('*')
        .order('views', { ascending: false })
        .limit(8);

      if (postsData) {
        setPosts(postsData);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  const handleJoinEvent = async (eventId: string) => {
    if (!user) return;
    await supabase.from('event_attendees').insert({ event_id: eventId, user_id: user.id });
    setEvents(events.map(e => e.id === eventId ? { ...e, current_attendees: e.current_attendees + 1 } : e));
  };

  return (
    <div className="p-6 md:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={cn('text-2xl md:text-3xl font-display font-bold', colors.text)}>
            {t('nav.community')}
          </h1>
          <p className={cn('text-sm', colors.textSecondary)}>Connect with fellow travelers</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Post
        </button>
      </div>

      {/* Tab Navigation */}
      <div className={cn(
        'flex gap-1 p-1 rounded-xl',
        colors.card === 'bg-white' ? 'bg-stone-100' : 'bg-forest-900/50'
      )}>
        {(['groups', 'events', 'discussions'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all',
              activeTab === tab
                ? colors.card === 'bg-white'
                  ? 'bg-white text-forest-700 shadow-sm'
                  : 'bg-forest-700 text-white'
                : colors.textSecondary
            )}
          >
            {tab === 'groups' && 'Groups'}
            {tab === 'events' && 'Events'}
            {tab === 'discussions' && 'Discussions'}
          </button>
        ))}
      </div>

      {/* Groups Tab */}
      {activeTab === 'groups' && (
        <section className="space-y-4">
          {communityGroups.map((group) => (
            <div key={group.id} className={cn('rounded-xl p-4 border transition-all cursor-pointer hover:shadow-md', colors.card === 'bg-white' ? 'bg-white border-stone-200' : 'bg-forest-800/50 border-forest-700')}>
              <div className="flex items-center gap-4">
                <div className={cn('w-14 h-14 rounded-xl overflow-hidden bg-gradient-to-br', group.gradient)}>
                  <img src={group.avatar} alt={group.name} className="w-full h-full object-cover opacity-90" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={cn('font-semibold', colors.text)}>{group.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Users className={cn('w-4 h-4', colors.textMuted)} />
                    <span className={cn('text-sm', colors.textSecondary)}>{group.members} members</span>
                  </div>
                </div>
                <ChevronRight className={cn('w-5 h-5', colors.textMuted)} />
              </div>
            </div>
          ))}
          <button className={cn('w-full py-4 rounded-xl border-2 border-dashed transition-colors', colors.border, colors.textSecondary, 'hover:border-forest-400 hover:text-forest-600')}>+ Discover More Groups</button>
        </section>
      )}

      {/* Events Tab */}
      {activeTab === 'events' && (
        <section className="space-y-4">
          {loading ? (
            [...Array(4)].map((_, i) => <div key={i} className="h-28 rounded-xl bg-stone-200 animate-pulse" />)
          ) : events.length === 0 ? (
            <div className={cn('text-center py-12 rounded-xl border', colors.card === 'bg-white' ? 'bg-white border-stone-200' : 'bg-forest-800/50 border-forest-700')}>
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Calendar className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className={cn('font-semibold mb-2', colors.text)}>No upcoming events</h3>
              <p className={cn('text-sm max-w-xs mx-auto', colors.textSecondary)}>
                Join community treks, meetups, and cultural events. Check back soon for new adventures!
              </p>
            </div>
          ) : events.map((event) => (
            <div key={event.id} className={cn('rounded-xl p-4 border transition-all cursor-pointer hover:shadow-md', colors.card === 'bg-white' ? 'bg-white border-stone-200' : 'bg-forest-800/50 border-forest-700')}>
              <div className="flex items-start gap-4">
                <div className={cn('w-16 h-16 rounded-xl flex flex-col items-center justify-center', colors.card === 'bg-white' ? 'bg-forest-50' : 'bg-forest-900')}>
                  <Calendar className={cn('w-5 h-5 text-forest-600')} />
                  <span className={cn('text-xs font-medium mt-1', colors.textSecondary)}>{new Date(event.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn('px-2 py-0.5 rounded text-xs font-medium', event.event_type === 'trek' ? 'bg-forest-100 text-forest-700' : event.event_type === 'hike' ? 'bg-blue-100 text-blue-700' : event.event_type === 'safari' ? 'bg-amber-100 text-amber-700' : 'bg-purple-100 text-purple-700')}>{event.event_type}</span>
                    <span className={cn('px-2 py-0.5 rounded text-xs', event.difficulty === 'Easy' ? 'bg-green-100 text-green-700' : event.difficulty === 'Moderate' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700')}>{event.difficulty}</span>
                  </div>
                  <h3 className={cn('font-semibold', colors.text)}>{event.title}</h3>
                  <div className={cn('flex items-center gap-4 mt-1 text-sm', colors.textSecondary)}>
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {event.location}</span>
                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {event.current_attendees}/{event.max_attendees}</span>
                  </div>
                  {event.estimated_cost && <p className={cn('text-sm mt-1 font-medium', colors.textMuted)}>NPR {event.estimated_cost.toLocaleString()}</p>}
                </div>
                <button onClick={() => handleJoinEvent(event.id)} disabled={event.current_attendees >= event.max_attendees} className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0', event.current_attendees >= event.max_attendees ? 'bg-stone-100 text-stone-400 cursor-not-allowed' : 'bg-forest-600 text-white hover:bg-forest-700')}>
                  {event.current_attendees >= event.max_attendees ? 'Full' : 'Join'}
                </button>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Discussions Tab */}
      {activeTab === 'discussions' && (
        <section className="space-y-4">
          <div className="relative">
            <Search className={cn('absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5', colors.textMuted)} />
            <input type="text" placeholder="Search discussions..." className={cn('w-full pl-12 pr-4 py-3 rounded-xl border-2 transition-all', colors.card === 'bg-white' ? 'bg-white border-stone-200' : 'bg-forest-800/50 border-forest-700', colors.text, 'placeholder:text-stone-400 focus:outline-none focus:border-forest-500')} />
          </div>
          <div className="flex items-center gap-2"><TrendingUp className={cn('w-4 h-4', colors.textMuted)} /><span className={cn('text-sm', colors.textSecondary)}>Trending Discussions</span></div>
          {loading ? (
            [...Array(5)].map((_, i) => <div key={i} className="h-20 rounded-xl bg-stone-200 animate-pulse" />)
          ) : posts.map((post) => (
            <div key={post.id} className={cn('rounded-xl p-4 border transition-all cursor-pointer hover:shadow-md', colors.card === 'bg-white' ? 'bg-white border-stone-200' : 'bg-forest-800/50 border-forest-700')}>
              <div className="flex items-center gap-2 mb-2">
                <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold', colors.accentBg, `text-${colors.accent}`)}>{post.user_name[0]}</div>
                <div>
                  <span className={cn('text-sm font-medium', colors.text)}>{post.user_name}</span>
                  <div className="flex items-center gap-2">
                    <span className={cn('text-xs', colors.textMuted)}>{post.category}</span>
                    <span className={cn('text-xs', colors.textMuted)}>• {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>
              </div>
              <h3 className={cn('font-semibold', colors.text)}>{post.title}</h3>
              <div className="flex items-center gap-4 mt-3">
                <span className={cn('flex items-center gap-1 text-xs', colors.textMuted)}><MessageCircle className="w-3.5 h-3.5" /> {post.replies_count} replies</span>
                <span className={cn('flex items-center gap-1 text-xs', colors.textMuted)}><Users className="w-3.5 h-3.5" /> {post.views >= 1000 ? `${(post.views / 1000).toFixed(1)}K` : post.views} views</span>
              </div>
            </div>
          ))}
          {!loading && posts.length === 0 && (
            <div className={cn('text-center py-12 rounded-xl border', colors.card === 'bg-white' ? 'bg-white border-stone-200' : 'bg-forest-800/50 border-forest-700')}>
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <MessageCircle className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className={cn('font-semibold mb-2', colors.text)}>Start the conversation</h3>
              <p className={cn('text-sm max-w-xs mx-auto', colors.textSecondary)}>
                Be the first to share your travel experiences, ask questions, or help fellow travelers!
              </p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
