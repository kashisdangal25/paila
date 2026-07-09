import { useState, useEffect, useRef } from 'react';
import { Users, Search, TrendingUp, MapPin, Calendar, MessageCircle, ChevronRight, Plus, Clock, X, Send, Heart, Share2, Camera, Image, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { useI18n } from '../../lib/i18n';
import { useThemeColors } from '../../lib/ThemeContext';
import { cn } from '../../lib/utils';

const communityGroups = [
  { id: '1', name: 'Solo Female Trekkers Nepal', members: '4.2K', avatar: 'https://images.pexels.com/photos/1271619/pexels-photo-1271619.jpeg?auto=compress&cs=tinysrgb&w=100', gradient: 'from-pink-500 to-rose-500' },
  { id: '2', name: 'Kathmandu Valley Hikers', members: '2.8K', avatar: 'https://images.pexels.com/photos/3593922/pexels-photo-3593922.jpeg?auto=compress&cs=tinysrgb&w=100', gradient: 'from-forest-500 to-forest-600' },
  { id: '3', name: 'Sunrise Chasers Nepal', members: '1.5K', avatar: 'https://images.pexels.com/photos/4194617/pexels-photo-4194617.jpeg?auto=compress&cs=tinysrgb&w=100', gradient: 'from-orange-500 to-amber-500' },
  { id: '4', name: 'Photography Nepal', members: '2.1K', avatar: 'https://images.pexels.com/photos/161853/nepal-kathmandu-boudhanath-buddhism-161853.jpeg?auto=compress&cs=tinysrgb&w=100', gradient: 'from-blue-500 to-indigo-500' },
];

const postCategories = [
  { id: 'trail_update', label: 'Trail Update', icon: '🥾' },
  { id: 'tip', label: 'Tip', icon: '💡' },
  { id: 'question', label: 'Question', icon: '❓' },
  { id: 'story', label: 'Story', icon: '📖' },
  { id: 'photo', label: 'Photo', icon: '📸' },
];

export function CommunityTab() {
  const { t } = useI18n();
  const colors = useThemeColors();
  const { user, profile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'groups' | 'events' | 'discussions'>('events');
  const [events, setEvents] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New post modal state
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPostCategory, setNewPostCategory] = useState('trail_update');
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostLocation, setNewPostLocation] = useState('');
  const [newPostImage, setNewPostImage] = useState<string | null>(null);
  const [newPostImageFile, setNewPostImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  // Like state
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  // Reply modal state
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

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
    try {
      const { error } = await supabase.from('event_attendees').insert({ event_id: eventId, user_id: user.id });
      if (error) throw error;
      setEvents(events.map(e => e.id === eventId ? { ...e, current_attendees: e.current_attendees + 1 } : e));
    } catch (err) {
      console.error('Failed to join event:', err);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('Image must be less than 10MB');
      return;
    }

    setNewPostImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setNewPostImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() || !user) return;

    setSaving(true);
    try {
      let imageUrl: string | null = null;

      // Upload image if provided
      if (newPostImageFile) {
        const fileExt = newPostImageFile.name.split('.').pop();
        const fileName = `community-${Date.now()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(filePath, newPostImageFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('media')
          .getPublicUrl(filePath);
        imageUrl = urlData.publicUrl;
      }

      const { error: insertError } = await supabase
        .from('user_posts')
        .insert({
          user_id: user.id,
          user_name: profile?.name || 'Traveler',
          title: newPostTitle || newPostCategory.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          content: newPostContent,
          category: newPostCategory,
          views: 0,
          replies_count: 0
        });

      if (insertError) throw insertError;

      // Reset form
      setShowNewPost(false);
      setNewPostTitle('');
      setNewPostContent('');
      setNewPostLocation('');
      setNewPostImage(null);
      setNewPostImageFile(null);

      // Refresh posts
      fetchData();
    } catch (err) {
      console.error('Error creating post:', err);
      alert('Failed to create post. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleLikePost = (postId: string) => {
    setLikedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const handleSharePost = (postId: string) => {
    if (navigator.share) {
      navigator.share({
        title: 'Check out this post on Paila',
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const handleReply = async (postId: string) => {
    if (!replyText.trim() || !user) return;

    try {
      const { error } = await supabase
        .from('post_replies')
        .insert({
          post_id: postId,
          user_id: user.id,
          user_name: profile?.name || 'Traveler',
          content: replyText
        });

      if (error) throw error;

      setReplyText('');
      setReplyingTo(null);
      fetchData();
    } catch (err) {
      console.error('Error replying:', err);
    }
  };

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
      .order('created_at', { ascending: false })
      .limit(12);

    if (postsData) {
      setPosts(postsData);
    }
    setLoading(false);
  }

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
        <button
          onClick={() => setShowNewPost(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> New Post
        </button>
      </div>

      {/* New Post Modal */}
      {showNewPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowNewPost(false)} />
          <div className={cn(
            'relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl p-6',
            colors.card === 'bg-white' ? 'bg-white' : 'bg-forest-900 border border-forest-700'
          )}>
            <button
              onClick={() => setShowNewPost(false)}
              className={cn('absolute top-4 right-4 p-2 rounded-lg', colors.card === 'bg-white' ? 'hover:bg-stone-100' : 'hover:bg-forest-800')}
            >
              <X className={cn('w-5 h-5', colors.text)} />
            </button>

            <h2 className={cn('text-xl font-display font-bold mb-4', colors.text)}>
              Create New Post
            </h2>

            <div className="space-y-4">
              {/* Category Selection */}
              <div>
                <label className={cn('text-sm font-medium mb-2 block', colors.text)}>
                  Category
                </label>
                <div className="flex flex-wrap gap-2">
                  {postCategories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setNewPostCategory(cat.id)}
                      className={cn(
                        'px-3 py-2 rounded-xl text-sm font-medium transition-all',
                        newPostCategory === cat.id
                          ? 'bg-forest-600 text-white'
                          : colors.card === 'bg-white'
                            ? 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                            : 'bg-forest-800 text-stone-300 hover:bg-forest-700'
                      )}
                    >
                      {cat.icon} {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className={cn('text-sm font-medium mb-1.5 block', colors.text)}>
                  Title (optional)
                </label>
                <input
                  type="text"
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                  placeholder="Give your post a title..."
                  className={cn(
                    'w-full px-4 py-3 rounded-xl border-2 transition-all',
                    colors.card === 'bg-white'
                      ? 'bg-white border-stone-200 focus:border-forest-500'
                      : 'bg-forest-800 border-forest-700 focus:border-forest-500',
                    colors.text,
                    'focus:outline-none'
                  )}
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className={cn('text-sm font-medium mb-1.5 block', colors.text)}>
                  Photo (optional)
                </label>
                {newPostImage ? (
                  <div className="relative rounded-xl overflow-hidden aspect-video">
                    <img src={newPostImage} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      onClick={() => { setNewPostImage(null); setNewPostImageFile(null); }}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      'w-full h-32 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors',
                      colors.card === 'bg-white'
                        ? 'border-stone-300 hover:border-forest-400 hover:bg-forest-50'
                        : 'border-forest-700 hover:border-forest-600 hover:bg-forest-800'
                    )}
                  >
                    <Camera className={cn('w-8 h-8', colors.textMuted)} />
                    <span className={cn('text-sm', colors.textMuted)}>Add a photo</span>
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              {/* Content */}
              <div>
                <label className={cn('text-sm font-medium mb-1.5 block', colors.text)}>
                  Your Post *
                </label>
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  rows={4}
                  className={cn(
                    'w-full px-4 py-3 rounded-xl border-2 transition-all resize-none',
                    colors.card === 'bg-white'
                      ? 'bg-white border-stone-200 focus:border-forest-500'
                      : 'bg-forest-800 border-forest-700 focus:border-forest-500',
                    colors.text,
                    'focus:outline-none'
                  )}
                  placeholder="Share your thoughts, ask a question, or tell a story..."
                />
              </div>

              {/* Location Tag */}
              <div>
                <label className={cn('text-sm font-medium mb-1.5 block', colors.text)}>
                  <MapPin className="w-4 h-4 inline mr-1" /> Location (optional)
                </label>
                <input
                  type="text"
                  value={newPostLocation}
                  onChange={(e) => setNewPostLocation(e.target.value)}
                  placeholder="Where is this about?"
                  className={cn(
                    'w-full px-4 py-3 rounded-xl border-2 transition-all',
                    colors.card === 'bg-white'
                      ? 'bg-white border-stone-200 focus:border-forest-500'
                      : 'bg-forest-800 border-forest-700 focus:border-forest-500',
                    colors.text,
                    'focus:outline-none'
                  )}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowNewPost(false)}
                  className={cn(
                    'flex-1 py-3 rounded-xl font-medium transition-colors',
                    colors.card === 'bg-white'
                      ? 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                      : 'bg-forest-800 text-stone-300 hover:bg-forest-700'
                  )}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePost}
                  disabled={saving || !newPostContent.trim()}
                  className="flex-1 py-3 rounded-xl font-medium transition-colors bg-forest-600 text-white hover:bg-forest-700 disabled:opacity-50"
                >
                  {saving ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Posting...
                    </span>
                  ) : (
                    'Post'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                  <img src={group.avatar} alt={group.name} className="w-full h-full object-cover opacity-90" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
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

          {loading ? (
            [...Array(5)].map((_, i) => <div key={i} className="h-32 rounded-xl bg-stone-200 animate-pulse" />)
          ) : posts.length === 0 ? (
            <div className={cn('text-center py-12 rounded-xl border', colors.card === 'bg-white' ? 'bg-white border-stone-200' : 'bg-forest-800/50 border-forest-700')}>
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <MessageCircle className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className={cn('font-semibold mb-2', colors.text)}>Start the conversation</h3>
              <p className={cn('text-sm max-w-xs mx-auto mb-4', colors.textSecondary)}>
                Be the first to share your travel experiences, ask questions, or help fellow travelers!
              </p>
              <button
                onClick={() => setShowNewPost(true)}
                className="btn-primary"
              >
                Create First Post
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className={cn('rounded-xl p-4 border transition-all', colors.card === 'bg-white' ? 'bg-white border-stone-200' : 'bg-forest-800/50 border-forest-700')}
                >
                  {/* Author */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-forest-100 text-forest-600')}>
                      {post.user_name?.[0]?.toUpperCase() || 'T'}
                    </div>
                    <div className="flex-1">
                      <span className={cn('text-sm font-medium', colors.text)}>{post.user_name || 'Traveler'}</span>
                      <div className="flex items-center gap-2">
                        <span className={cn('text-xs px-2 py-0.5 rounded-full', colors.card === 'bg-white' ? 'bg-forest-100 text-forest-700' : 'bg-forest-700 text-forest-200')}>
                          {postCategories.find(c => c.id === post.category)?.icon || '📝'} {post.category?.replace('_', ' ') || 'general'}
                        </span>
                        <span className={cn('text-xs', colors.textMuted)}>
                          {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className={cn('font-semibold mb-1', colors.text)}>{post.title}</h3>
                  <p className={cn('text-sm mb-3', colors.textSecondary)}>{post.content}</p>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-stone-200 dark:border-forest-700">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleLikePost(post.id)}
                        className={cn(
                          'flex items-center gap-1.5 text-xs transition-all',
                          likedPosts.has(post.id)
                            ? 'text-red-500'
                            : colors.textMuted
                        )}
                      >
                        <Heart className={cn('w-4 h-4', likedPosts.has(post.id) && 'fill-red-500')} />
                        {likedPosts.has(post.id) ? 'Liked' : 'Like'}
                      </button>
                      <button
                        onClick={() => setReplyingTo(replyingTo === post.id ? null : post.id)}
                        className={cn('flex items-center gap-1.5 text-xs', colors.textMuted)}
                      >
                        <MessageCircle className="w-4 h-4" />
                        {post.replies_count || 0} Replies
                      </button>
                      <button
                        onClick={() => handleSharePost(post.id)}
                        className={cn('flex items-center gap-1.5 text-xs', colors.textMuted)}
                      >
                        <Share2 className="w-4 h-4" />
                        Share
                      </button>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-stone-400">
                      <Users className="w-3.5 h-3.5" />
                      {post.views >= 1000 ? `${(post.views / 1000).toFixed(1)}K` : post.views} views
                    </div>
                  </div>

                  {/* Reply Input */}
                  {replyingTo === post.id && (
                    <div className="mt-3 pt-3 border-t border-stone-200 dark:border-forest-700 flex gap-2">
                      <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write a reply..."
                        className={cn(
                          'flex-1 px-3 py-2 rounded-lg text-sm border transition-all',
                          colors.card === 'bg-white'
                            ? 'bg-white border-stone-200 focus:border-forest-500'
                            : 'bg-forest-700 border-forest-600 focus:border-forest-500',
                          colors.text,
                          'focus:outline-none'
                        )}
                      />
                      <button
                        onClick={() => handleReply(post.id)}
                        disabled={!replyText.trim()}
                        className="p-2 rounded-lg bg-forest-600 text-white hover:bg-forest-700 disabled:opacity-50 transition-colors"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
