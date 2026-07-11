import { useState, useEffect, useRef } from 'react';
import {
  Users, Plus, MapPin, Loader2, X, Camera, Heart, MessageCircle, Share2, AlertCircle,
  Send, Clock, Filter, Image as ImageIcon
} from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { useThemeColors } from '../../lib/ThemeContext';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';

interface CommunityPost {
  id: string;
  user_id: string;
  user_name: string;
  title: string;
  content: string;
  category: string;
  media_urls: string[] | null;
  location_text: string | null;
  likes: number;
  author_avatar: string | null;
  created_at: string;
  profiles: { name: string; profile_photo_url: string | null } | null;
}

interface PostReply {
  id: string;
  post_id: string;
  user_id: string;
  user_name: string;
  content: string;
  author_avatar: string | null;
  created_at: string;
}

const POST_CATEGORIES = [
  { id: 'trail_update', label: 'Trail Update', emoji: '🥾' },
  { id: 'tip', label: 'Travel Tip', emoji: '💡' },
  { id: 'question', label: 'Question', emoji: '❓' },
  { id: 'story', label: 'Story', emoji: '📖' },
  { id: 'photo', label: 'Photo Share', emoji: '📸' },
];

const CATEGORY_LABELS: Record<string, string> = {
  trail_update: 'Trail Update', tip: 'Travel Tip', question: 'Question', story: 'Story', photo: 'Photo Share',
  general: 'General',
};

export function CommunityTab() {
  const { user, profile } = useAuth();
  const colors = useThemeColors();
  const isDark = colors.card !== 'bg-white';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [replies, setReplies] = useState<Record<string, PostReply[]>>({});
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [postingReply, setPostingReply] = useState<string | null>(null);

  // New post form
  const [postContent, setPostContent] = useState('');
  const [postTitle, setPostTitle] = useState('');
  const [postCategory, setPostCategory] = useState('trail_update');
  const [postLocation, setPostLocation] = useState('');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchPosts(); }, []);

  async function fetchPosts() {
    setLoading(true);
    const { data } = await supabase
      .from('user_posts')
      .select(`*, profiles:user_id (name, profile_photo_url)`)
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) {
      setPosts(data as CommunityPost[]);
      // Check which posts the user has liked
      if (user) {
        const { data: likes } = await supabase
          .from('post_likes')
          .select('post_id')
          .eq('user_id', user.id);
        if (likes) setLikedPosts(new Set(likes.map(l => l.post_id)));
      }
    }
    setLoading(false);
  }

  async function fetchReplies(postId: string) {
    const { data } = await supabase
      .from('post_replies')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
    if (data) setReplies(prev => ({ ...prev, [postId]: data as PostReply[] }));
  }

  function toggleComments(postId: string) {
    const newSet = new Set(expandedComments);
    if (newSet.has(postId)) {
      newSet.delete(postId);
    } else {
      newSet.add(postId);
      if (!replies[postId]) fetchReplies(postId);
    }
    setExpandedComments(newSet);
  }

  function handleMediaChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const valid = files.filter(f => f.type.startsWith('image/'));
    if (mediaFiles.length + valid.length > 6) { setError('Maximum 6 photos per post'); return; }
    setError(null);
    const newPreviews = valid.map(f => URL.createObjectURL(f));
    setMediaFiles(prev => [...prev, ...valid]);
    setMediaPreviews(prev => [...prev, ...newPreviews]);
  }

  function removePhoto(idx: number) {
    setMediaFiles(prev => prev.filter((_, i) => i !== idx));
    setMediaPreviews(prev => prev.filter((_, i) => i !== idx));
  }

  async function uploadFiles(userId: string): Promise<string[]> {
    const uploaded: string[] = [];
    for (const file of mediaFiles) {
      const ext = file.name.split('.').pop();
      const path = `${userId}/community/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage.from('media').upload(path, file, { cacheControl: '3600', upsert: false });
      if (upErr) throw new Error(`Upload failed: ${upErr.message}`);
      const { data: urlData } = supabase.storage.from('media').getPublicUrl(path);
      uploaded.push(urlData.publicUrl);
    }
    return uploaded;
  }

  async function handlePost() {
    if (!user) return;
    if (!postContent.trim()) { setError('Please write something'); return; }
    setSaving(true); setError(null);
    try {
      let mediaUrls: string[] = [];
      if (mediaFiles.length > 0) mediaUrls = await uploadFiles(user.id);

      const { error: insErr } = await supabase.from('user_posts').insert({
        user_id: user.id,
        user_name: profile?.name || user.email?.split('@')[0] || 'Traveler',
        title: postTitle.trim() || null,
        content: postContent.trim(),
        category: postCategory,
        media_urls: mediaUrls.length > 0 ? mediaUrls : null,
        location_text: postLocation.trim() || null,
        author_avatar: profile?.profile_photo_url || null,
        likes: 0,
      });
      if (insErr) throw insErr;

      setPostContent(''); setPostTitle(''); setPostLocation('');
      setMediaFiles([]); setMediaPreviews([]);
      setShowModal(false); fetchPosts();
    } catch (err: any) {
      setError(err.message || 'Failed to post');
    } finally { setSaving(false); }
  }

  async function handleLike(postId: string) {
    if (!user) return;
    const isLiked = likedPosts.has(postId);
    if (isLiked) {
      setLikedPosts(prev => { const s = new Set(prev); s.delete(postId); return s; });
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: Math.max(0, p.likes - 1) } : p));
      await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', user.id);
    } else {
      setLikedPosts(prev => new Set(prev).add(postId));
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: p.likes + 1 } : p));
      await supabase.from('post_likes').insert({ post_id: postId, user_id: user.id });
    }
  }

  async function handleReply(postId: string) {
    if (!user) return;
    const text = replyText[postId]?.trim();
    if (!text) return;
    setPostingReply(postId);
    try {
      const { data, error: insErr } = await supabase.from('post_replies').insert({
        post_id: postId,
        user_id: user.id,
        user_name: profile?.name || user.email?.split('@')[0] || 'Traveler',
        content: text,
        author_avatar: profile?.profile_photo_url || null,
      }).select('*').single();
      if (insErr) throw insErr;
      setReplies(prev => ({ ...prev, [postId]: [...(prev[postId] || []), data as PostReply] }));
      setReplyText(prev => ({ ...prev, [postId]: '' }));
    } catch (err: any) {
      setError(err.message || 'Failed to reply');
    } finally { setPostingReply(null); }
  }

  function handleShare(post: CommunityPost) {
    const shareText = `${post.title || 'Community post'} by ${post.user_name} on Paila`;
    if (navigator.share) {
      navigator.share({ title: 'Paila Community', text: shareText, url: window.location.href });
    } else {
      navigator.clipboard?.writeText(shareText);
      setError('Link copied to clipboard');
      setTimeout(() => setError(null), 2000);
    }
  }

  function formatTimeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
  }

  const filteredPosts = posts.filter(p => {
    const matchesCategory = activeCategory === 'all' || p.category === activeCategory;
    const q = search.toLowerCase();
    const matchesSearch = !q || p.title?.toLowerCase().includes(q) || p.content.toLowerCase().includes(q) || p.user_name.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  const inputClass = cn(
    'w-full px-4 py-2.5 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-forest-200',
    isDark ? 'bg-forest-800 border-forest-700 focus:border-forest-500' : 'bg-white border-stone-200 focus:border-forest-500',
    colors.text, 'placeholder:text-stone-400'
  );

  return (
    <div className="p-4 md:p-6 space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={cn('text-2xl font-display font-bold flex items-center gap-2', colors.text)}>
            <Users className="w-6 h-6" /> Community
          </h1>
          <p className={cn('text-sm', colors.textSecondary)}>Share stories, tips, and trail updates</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-forest-600 text-white rounded-xl font-medium hover:bg-forest-700 transition-colors">
          <Plus className="w-5 h-5" /> New Post
        </button>
      </div>

      {/* Search + Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} className={cn(inputClass, 'flex-1')} placeholder="Search posts..." />
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button onClick={() => setActiveCategory('all')} className={cn('px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors', activeCategory === 'all' ? 'bg-forest-600 text-white' : isDark ? 'bg-forest-800 text-stone-300' : 'bg-stone-100 text-stone-700')}>All</button>
          {POST_CATEGORIES.map(c => (
            <button key={c.id} onClick={() => setActiveCategory(c.id)} className={cn('px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors', activeCategory === c.id ? 'bg-forest-600 text-white' : isDark ? 'bg-forest-800 text-stone-300' : 'bg-stone-100 text-stone-700')}>
              {c.emoji} {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* New Post Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className={cn('relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl p-6', isDark ? 'bg-forest-900 border border-forest-700' : 'bg-white')}>
            <button onClick={() => setShowModal(false)} className={cn('absolute top-4 right-4 p-2 rounded-lg', isDark ? 'hover:bg-forest-800' : 'hover:bg-stone-100')}>
              <X className={cn('w-5 h-5', colors.text)} />
            </button>
            <h2 className={cn('text-xl font-display font-bold mb-4', colors.text)}>Create Post</h2>

            <div className="space-y-4">
              {/* Category */}
              <div>
                <label className={cn('text-sm font-medium mb-1.5 block', colors.text)}>Category</label>
                <div className="flex gap-2 flex-wrap">
                  {POST_CATEGORIES.map(c => (
                    <button key={c.id} onClick={() => setPostCategory(c.id)} className={cn('px-3 py-2 rounded-xl text-sm font-medium transition-colors', postCategory === c.id ? 'bg-forest-600 text-white' : isDark ? 'bg-forest-800 text-stone-300 hover:bg-forest-700' : 'bg-stone-100 text-stone-700 hover:bg-stone-200')}>
                      {c.emoji} {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className={cn('text-sm font-medium mb-1.5 block', colors.text)}>Title</label>
                <input type="text" value={postTitle} onChange={e => setPostTitle(e.target.value)} className={inputClass} placeholder="Post title (optional)" />
              </div>

              {/* Content */}
              <div>
                <label className={cn('text-sm font-medium mb-1.5 block', colors.text)}>Content *</label>
                <textarea value={postContent} onChange={e => setPostContent(e.target.value)} rows={4} className={cn(inputClass, 'resize-none')} placeholder="Share your thoughts, tips, or stories..." />
              </div>

              {/* Location */}
              <div>
                <label className={cn('text-sm font-medium mb-1.5 block', colors.text)}>Location</label>
                <input type="text" value={postLocation} onChange={e => setPostLocation(e.target.value)} className={inputClass} placeholder="Tag a location (optional)" />
              </div>

              {/* Photos */}
              <div>
                <label className={cn('text-sm font-medium mb-1.5 block', colors.text)}>Photos (up to 6)</label>
                <div className="flex flex-wrap gap-2">
                  {mediaPreviews.map((url, i) => (
                    <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button onClick={() => removePhoto(i)} className="absolute top-1 right-1 p-0.5 rounded-full bg-black/50 text-white"><X className="w-3 h-3" /></button>
                    </div>
                  ))}
                  {mediaFiles.length < 6 && (
                    <button onClick={() => fileInputRef.current?.click()} className={cn('w-20 h-20 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-colors', isDark ? 'border-forest-700 hover:bg-forest-800' : 'border-stone-300 hover:bg-forest-50')}>
                      <Camera className={cn('w-5 h-5', colors.textMuted)} />
                      <span className={cn('text-xs', colors.textMuted)}>Add</span>
                    </button>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleMediaChange} className="hidden" />
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => { setShowModal(false); setPostContent(''); setPostTitle(''); setPostLocation(''); setMediaFiles([]); setMediaPreviews([]); }} className={cn('flex-1 py-3 rounded-xl font-medium transition-colors', isDark ? 'bg-forest-800 text-stone-300 hover:bg-forest-700' : 'bg-stone-100 text-stone-700 hover:bg-stone-200')}>Cancel</button>
                <button onClick={handlePost} disabled={saving || !postContent.trim()} className="flex-1 py-3 rounded-xl font-medium bg-forest-600 text-white hover:bg-forest-700 disabled:opacity-50">
                  {saving ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Posting...</span> : 'Post'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feed */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className={cn('rounded-xl h-40 animate-pulse', isDark ? 'bg-forest-800' : 'bg-stone-100')} />)}
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className={cn('text-center py-12 rounded-xl border', isDark ? 'bg-forest-800/50 border-forest-700' : 'bg-white border-stone-200')}>
          <Users className={cn('w-12 h-12 mx-auto mb-3 opacity-30', colors.textMuted)} />
          <h3 className={cn('font-semibold mb-1', colors.text)}>No posts yet</h3>
          <p className={cn('text-sm mb-4', colors.textSecondary)}>Be the first to share something!</p>
          <button onClick={() => setShowModal(true)} className="btn-primary py-2 px-4">Create Post</button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map(post => {
            const photos = post.media_urls || [];
            const isLiked = likedPosts.has(post.id);
            const showComments = expandedComments.has(post.id);
            const postReplies = replies[post.id] || [];
            return (
              <div key={post.id} className={cn('rounded-xl overflow-hidden border', isDark ? 'bg-forest-800 border-forest-700' : 'bg-white border-stone-200')}>
                {/* Author */}
                <div className="flex items-center gap-3 p-4 pb-2">
                  {post.author_avatar || post.profiles?.profile_photo_url ? (
                    <img src={post.author_avatar || post.profiles?.profile_photo_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className={cn('w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm', isDark ? 'bg-forest-700 text-forest-200' : 'bg-forest-100 text-forest-600')}>
                      {post.user_name?.[0]?.toUpperCase() || '?'}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className={cn('font-medium text-sm', colors.text)}>{post.user_name}</p>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={colors.textMuted}>{formatTimeAgo(post.created_at)}</span>
                      <span className={cn('px-1.5 py-0.5 rounded text-xs font-medium', isDark ? 'bg-forest-700 text-forest-200' : 'bg-forest-50 text-forest-600')}>
                        {POST_CATEGORIES.find(c => c.id === post.category)?.emoji} {CATEGORY_LABELS[post.category] || post.category}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="px-4 pb-3">
                  {post.title && <h3 className={cn('font-semibold mb-1', colors.text)}>{post.title}</h3>}
                  <p className={cn('text-sm whitespace-pre-wrap', colors.textSecondary)}>{post.content}</p>
                  {post.location_text && (
                    <p className={cn('text-xs mt-2 flex items-center gap-1', colors.textMuted)}><MapPin className="w-3 h-3" />{post.location_text}</p>
                  )}
                </div>

                {/* Photos */}
                {photos.length > 0 && (
                  <div className={cn('grid gap-1', photos.length === 1 ? 'grid-cols-1' : 'grid-cols-2')}>
                    {photos.slice(0, 4).map((url, i) => (
                      <div key={i} className={cn('relative', photos.length === 1 ? 'aspect-video' : 'aspect-square')}>
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        {i === 3 && photos.length > 4 && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-medium">+{photos.length - 4} more</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-4 px-4 py-3 border-t border-stone-100 dark:border-forest-700">
                  <button onClick={() => handleLike(post.id)} className={cn('flex items-center gap-1.5 text-sm transition-colors', isLiked ? 'text-rose-500' : colors.textSecondary)}>
                    <Heart className={cn('w-4 h-4', isLiked && 'fill-current')} /> {post.likes || 0}
                  </button>
                  <button onClick={() => toggleComments(post.id)} className={cn('flex items-center gap-1.5 text-sm transition-colors', colors.textSecondary)}>
                    <MessageCircle className="w-4 h-4" /> {postReplies.length || ''}
                  </button>
                  <button onClick={() => handleShare(post)} className={cn('flex items-center gap-1.5 text-sm transition-colors', colors.textSecondary)}>
                    <Share2 className="w-4 h-4" /> Share
                  </button>
                </div>

                {/* Comments */}
                {showComments && (
                  <div className="px-4 pb-4 space-y-3 border-t border-stone-100 dark:border-forest-700 pt-3">
                    {postReplies.map(r => (
                      <div key={r.id} className="flex gap-2">
                        {r.author_avatar ? (
                          <img src={r.author_avatar} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0', isDark ? 'bg-forest-700 text-forest-200' : 'bg-forest-100 text-forest-600')}>
                            {r.user_name?.[0]?.toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1">
                          <div className={cn('rounded-xl px-3 py-2', isDark ? 'bg-forest-700' : 'bg-stone-100')}>
                            <p className={cn('text-xs font-medium', colors.text)}>{r.user_name}</p>
                            <p className={cn('text-sm', colors.textSecondary)}>{r.content}</p>
                          </div>
                          <p className={cn('text-xs mt-0.5', colors.textMuted)}>{formatTimeAgo(r.created_at)}</p>
                        </div>
                      </div>
                    ))}
                    {user && (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={replyText[post.id] || ''}
                          onChange={e => setReplyText(prev => ({ ...prev, [post.id]: e.target.value }))}
                          onKeyDown={e => { if (e.key === 'Enter' && !postingReply) handleReply(post.id); }}
                          className={cn(inputClass, 'flex-1 text-sm py-2')}
                          placeholder="Write a comment..."
                        />
                        <button onClick={() => handleReply(post.id)} disabled={postingReply === post.id || !replyText[post.id]?.trim()} className="px-3 rounded-xl bg-forest-600 text-white disabled:opacity-50">
                          {postingReply === post.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
