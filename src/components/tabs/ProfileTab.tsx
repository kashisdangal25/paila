import { useState, useEffect } from 'react';
import {
  Calendar, Star, Heart, MapPin, Camera, Edit2, ChevronRight, Award, TrendingUp, Globe, Settings, BookOpen, Plus
} from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { useI18n } from '../../lib/i18n';
import { useThemeColors, useTheme } from '../../lib/ThemeContext';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';
import { ProfileEditModal } from '../ProfileEditModal';
import { JournalModal } from '../JournalModal';

interface UserStats {
  trips_completed: number;
  places_visited: number;
  provinces_visited: number;
  photos_shared: number;
  current_level: number;
  current_xp: number;
}

interface Achievement {
  id: string;
  key: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

interface Journal {
  id: string;
  title: string;
  content: string;
  mood: string;
  weather: string;
  is_public: boolean;
  created_at: string;
  destination_id: string | null;
  destinations: { name: string } | null;
}

interface Profile {
  name: string;
  bio: string | null;
  location: string | null;
  profile_photo_url: string | null;
}

const allAchievements: Achievement[] = [
  { id: '1', key: 'first_steps', title: 'First Steps', description: 'Complete your first hike', icon: '🥾', unlocked: false },
  { id: '2', key: 'explorer', title: 'Explorer', description: 'Visit 5 different provinces', icon: '🗺️', unlocked: false },
  { id: '3', key: 'peak_climber', title: 'Peak Climber', description: 'Reach 4000m elevation', icon: '⛰️', unlocked: false },
  { id: '4', key: 'cultural_seeker', title: 'Cultural Seeker', description: 'Visit 10 temples/sites', icon: '🏯', unlocked: false },
  { id: '5', key: 'weekend_warrior', title: 'Weekend Warrior', description: 'Complete 10 weekend trips', icon: '🌟', unlocked: false },
  { id: '6', key: 'storyteller', title: 'Storyteller', description: 'Share 5 travel stories', icon: '📸', unlocked: false },
  { id: '7', key: 'community_helper', title: 'Community Helper', description: 'Leave 10 helpful reviews', icon: '💬', unlocked: false },
  { id: '8', key: 'guide_favorite', title: 'Guide Favorite', description: 'Book 3 guides', icon: '🤝', unlocked: false },
];

const moodEmojis: Record<string, string> = {
  excited: '🎉',
  peaceful: '😌',
  adventurous: '🏔️',
  reflective: '🤔',
  grateful: '🙏',
  inspired: '✨',
};

export function ProfileTab() {
  const { user } = useAuth();
  const { t } = useI18n();
  const colors = useThemeColors();
  const [profile, setProfile] = useState<Profile>({
    name: 'Traveler',
    bio: null,
    location: 'Nepal',
    profile_photo_url: null,
  });
  const [stats, setStats] = useState<UserStats>({
    trips_completed: 0,
    places_visited: 0,
    provinces_visited: 0,
    photos_shared: 0,
    current_level: 1,
    current_xp: 0,
  });
  const [achievements, setAchievements] = useState<Achievement[]>(allAchievements);
  const [recentTrips, setRecentTrips] = useState<any[]>([]);
  const [journals, setJournals] = useState<Journal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [editingJournal, setEditingJournal] = useState<Journal | null>(null);

  useEffect(() => {
    fetchProfile();
  }, [user]);

  async function fetchProfile() {
    if (!user) return;

    setLoading(true);
    try {
      // Get user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileData) {
        setProfile({
          name: profileData.name || user.email?.split('@')[0] || 'Traveler',
          bio: profileData.bio,
          location: profileData.location || 'Nepal',
          profile_photo_url: profileData.profile_photo_url,
        });
      } else if (user.email) {
        setProfile(prev => ({ ...prev, name: user.email!.split('@')[0] }));
        // Create profile if doesn't exist
        await supabase
          .from('profiles')
          .insert({
            id: user.id,
            name: user.email.split('@')[0],
            email: user.email,
            location: 'Nepal'
          });
      }

      // Get user stats
      const { data: userStats } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (userStats) {
        setStats({
          trips_completed: userStats.trips_completed || 0,
          places_visited: userStats.places_visited || 0,
          provinces_visited: userStats.provinces_visited || 0,
          photos_shared: userStats.photos_shared || 0,
          current_level: userStats.current_level || 1,
          current_xp: userStats.current_xp || 0,
        });
      } else {
        // Initialize user stats for new users
        const initialStats = {
          trips_completed: 0,
          places_visited: 0,
          provinces_visited: 0,
          photos_shared: 0,
          current_level: 1,
          current_xp: 0,
        };
        await supabase
          .from('user_stats')
          .insert({ user_id: user.id, ...initialStats });
        setStats(initialStats);
      }

      // Get user achievements
      const { data: userAchievements } = await supabase
        .from('user_achievements')
        .select('achievement_key')
        .eq('user_id', user.id);

      const unlockedKeys = new Set(userAchievements?.map(a => a.achievement_key) || []);
      setAchievements(allAchievements.map(a => ({
        ...a,
        unlocked: unlockedKeys.has(a.key) || a.key === 'first_steps',
      })));

      // Get recent trips
      const { data: trips } = await supabase
        .from('trips')
        .select(`
          *,
          destinations (name, image_url)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);

      if (trips) setRecentTrips(trips);

      // Get journals
      await fetchJournals();
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchJournals() {
    if (!user) return;

    const { data: journalsData } = await supabase
      .from('user_journals')
      .select(`*, destinations (name)`)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (journalsData) setJournals(journalsData as Journal[]);
  }

  const handleProfileSave = (updates: Profile) => {
    setProfile(updates);
  };

  const handleJournalSaved = () => {
    fetchJournals();
    setEditingJournal(null);
  };

  const handleEditJournal = (journal: Journal) => {
    setEditingJournal(journal);
    setShowJournalModal(true);
  };

  const handleDeleteJournal = async (journalId: string) => {
    if (!confirm('Are you sure you want to delete this journal entry?')) return;

    await supabase
      .from('user_journals')
      .delete()
      .eq('id', journalId);

    fetchJournals();
  };

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const xpForNextLevel = stats.current_level * 100;
  const progressPercent = (stats.current_xp % xpForNextLevel) / xpForNextLevel * 100;

  return (
    <div className="p-6 md:p-8 space-y-6 animate-fade-in">
      {/* Profile Header */}
      <div className="relative">
        <div className="h-32 rounded-2xl bg-gradient-to-r from-forest-600 via-forest-500 to-forest-400" />
        <div className="absolute -bottom-12 left-6 flex items-end gap-4">
          <button
            onClick={() => setShowEditModal(true)}
            className={cn(
              'w-24 h-24 rounded-full border-4 overflow-hidden transition-transform hover:scale-105',
              colors.card === 'bg-white' ? 'bg-white border-white' : 'bg-forest-800 border-forest-800'
            )}
          >
            {profile.profile_photo_url ? (
              <img
                src={profile.profile_photo_url}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className={cn(
                'w-full h-full flex items-center justify-center text-3xl font-display font-bold text-forest-600'
              )}>
                {profile.name[0].toUpperCase()}
              </div>
            )}
          </button>
          <button
            onClick={() => setShowEditModal(true)}
            className={cn(
              'p-2 rounded-full shadow-lg transition-colors mb-2',
              colors.card === 'bg-white' ? 'bg-white hover:bg-stone-50' : 'bg-forest-800 hover:bg-forest-700'
            )}
          >
            <Camera className={cn('w-4 h-4', colors.text)} />
          </button>
        </div>
      </div>

      {/* Name & Bio */}
      <div className="pt-10">
        <div className="flex items-center justify-between mb-2">
          <h1 className={cn('text-2xl font-display font-bold', colors.text)}>{profile.name}</h1>
          <button
            onClick={() => setShowEditModal(true)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors',
              colors.accentBg,
              `text-${colors.accent}`
            )}
          >
            <Edit2 className="w-4 h-4" /> Edit
          </button>
        </div>
        {profile.bio && (
          <p className={cn('text-sm mb-2', colors.textSecondary)}>{profile.bio}</p>
        )}
        <p className={cn('text-sm', colors.textMuted)}>
          Explorer Level {stats.current_level} • {profile.location}
        </p>
      </div>

      {/* Stats */}
      <div className={cn(
        'grid grid-cols-4 gap-3 p-4 rounded-xl border',
        colors.card === 'bg-white' ? 'bg-white border-stone-200' : 'bg-forest-800/50 border-forest-700'
      )}>
        {[
          { value: stats.trips_completed, label: 'Trips', icon: Calendar },
          { value: stats.provinces_visited, label: 'Provinces', icon: MapPin },
          { value: stats.places_visited, label: 'Places', icon: Star },
          { value: journals.length, label: 'Journals', icon: BookOpen },
        ].map((stat) => (
          <div key={stat.label} className="text-center">
            <stat.icon className={cn('w-5 h-5 mx-auto mb-1', colors.textMuted)} />
            <div className={cn('text-xl font-display font-bold', colors.text)}>{stat.value}</div>
            <div className={cn('text-xs', colors.textMuted)}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Progress Card */}
      <div className={cn(
        'rounded-xl p-4 border',
        colors.card === 'bg-white' ? 'bg-gradient-to-r from-forest-50 to-blue-50 border-forest-100' : 'bg-forest-900/30 border-forest-700'
      )}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-forest-600" />
            <span className={cn('font-semibold', colors.text)}>Explorer Progress</span>
          </div>
          <span className={cn('text-sm font-medium', colors.textSecondary)}>Level {stats.current_level}</span>
        </div>
        <div className="w-full h-2 bg-stone-200 dark:bg-forest-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-forest-500 to-forest-600 rounded-full transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className={cn('text-xs mt-2', colors.textMuted)}>
          {xpForNextLevel - stats.current_xp} XP to Level {stats.current_level + 1}
        </p>
      </div>

      {/* Journal Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className={cn('font-display font-bold text-lg flex items-center gap-2', colors.text)}>
            <BookOpen className="w-5 h-5" /> Travel Journal
          </h2>
          <button
            onClick={() => {
              setEditingJournal(null);
              setShowJournalModal(true);
            }}
            className="text-sm text-forest-600 hover:text-forest-700 flex items-center gap-1 font-medium"
          >
            <Plus className="w-4 h-4" /> New Entry
          </button>
        </div>

        {journals.length === 0 ? (
          <div className={cn(
            'text-center py-8 rounded-xl border',
            colors.card === 'bg-white' ? 'bg-white border-stone-200' : 'bg-forest-800/50 border-forest-700'
          )}>
            <BookOpen className={cn('w-10 h-10 mx-auto mb-2 opacity-30', colors.textMuted)} />
            <p className={cn('text-sm mb-3', colors.textSecondary)}>Start your travel journal</p>
            <button
              onClick={() => {
                setEditingJournal(null);
                setShowJournalModal(true);
              }}
              className="btn-primary py-2 px-4"
            >
              Write First Entry
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {journals.map((journal) => (
              <div
                key={journal.id}
                className={cn(
                  'p-4 rounded-xl border transition-colors cursor-pointer',
                  colors.card === 'bg-white' ? 'bg-white border-stone-200 hover:border-forest-200' : 'bg-forest-800/50 border-forest-700'
                )}
                onClick={() => handleEditJournal(journal)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className={cn('font-medium', colors.text)}>{journal.title}</h3>
                    {journal.destinations?.name && (
                      <p className={cn('text-xs flex items-center gap-1', colors.textMuted)}>
                        <MapPin className="w-3 h-3" /> {journal.destinations.name}
                      </p>
                    )}
                  </div>
                  <span className="text-lg">{moodEmojis[journal.mood] || '📝'}</span>
                </div>
                <p className={cn('text-sm line-clamp-2', colors.textSecondary)}>
                  {journal.content}
                </p>
                <div className="flex items-center justify-between mt-3">
                  <span className={cn('text-xs', colors.textMuted)}>
                    {new Date(journal.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteJournal(journal.id);
                      }}
                      className={cn('text-xs', colors.textMuted, 'hover:text-red-500')}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Achievements */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className={cn('font-display font-bold text-lg flex items-center gap-2', colors.text)}>
            <Award className="w-5 h-5" /> Achievements
          </h2>
          <span className={cn('text-sm', colors.textMuted)}>{unlockedCount}/{achievements.length}</span>
        </div>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
          {achievements.map((achievement) => (
            <button
              key={achievement.id}
              className={cn(
                'aspect-square rounded-xl flex flex-col items-center justify-center p-2 transition-all',
                achievement.unlocked
                  ? colors.card === 'bg-white'
                    ? 'bg-forest-50 border border-forest-200 hover:bg-forest-100'
                    : 'bg-forest-800/50 border border-forest-700 hover:bg-forest-800'
                  : 'opacity-40 cursor-not-allowed'
              )}
              title={achievement.description}
            >
              <span className="text-2xl md:text-3xl mb-1">{achievement.icon}</span>
              <span className={cn('text-[9px] md:text-[10px] font-medium text-center truncate w-full', colors.textSecondary)}>
                {achievement.title}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Recent Trips */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className={cn('font-display font-bold text-lg', colors.text)}>Recent Trips</h2>
          <button className="text-sm text-forest-600 hover:text-forest-700 flex items-center gap-1 font-medium">
            View all <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        {recentTrips.length === 0 ? (
          <div className={cn(
            'text-center py-8 rounded-xl border',
            colors.card === 'bg-white' ? 'bg-white border-stone-200' : 'bg-forest-800/50 border-forest-700'
          )}>
            <Calendar className={cn('w-10 h-10 mx-auto mb-2 opacity-30', colors.textMuted)} />
            <p className={cn('text-sm', colors.textSecondary)}>No trips yet. Start planning!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentTrips.map((trip, i) => (
              <div
                key={i}
                className={cn(
                  'flex items-center gap-4 p-3 rounded-xl border transition-colors cursor-pointer',
                  colors.card === 'bg-white' ? 'bg-white border-stone-200 hover:border-forest-200' : 'bg-forest-800/50 border-forest-700'
                )}
              >
                <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-forest-600 to-forest-400 overflow-hidden">
                  {trip.destinations?.image_url ? (
                    <img src={trip.destinations.image_url} alt="" className="w-full h-full object-cover" />
                  ) : null}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={cn('font-medium', colors.text)}>{trip.name || trip.destinations?.name || 'Trip'}</h3>
                  <p className={cn('text-xs', colors.textMuted)}>
                    {trip.start_date
                      ? new Date(trip.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : 'Completed'}
                  </p>
                </div>
                {trip.rating && (
                  <div className="flex gap-0.5 text-amber-500">
                    {[...Array(trip.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-500" />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: Heart, label: 'Wishlist', color: 'text-red-500' },
          { icon: Globe, label: 'My Map', color: 'text-blue-500' },
        ].map((action) => (
          <button
            key={action.label}
            className={cn(
              'flex items-center gap-3 p-4 rounded-xl border transition-colors',
              colors.card === 'bg-white' ? 'bg-white border-stone-200 hover:border-forest-200' : 'bg-forest-800/50 border-forest-700'
            )}
          >
            <action.icon className={cn('w-5 h-5', action.color)} />
            <span className={cn('font-medium', colors.text)}>{action.label}</span>
          </button>
        ))}
      </div>

      {/* Modals */}
      <ProfileEditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        profile={profile}
        userId={user?.id || ''}
        onSave={handleProfileSave}
      />

      <JournalModal
        isOpen={showJournalModal}
        onClose={() => {
          setShowJournalModal(false);
          setEditingJournal(null);
        }}
        userId={user?.id || ''}
        onSaved={handleJournalSaved}
        editJournal={editingJournal}
      />
    </div>
  );
}
