import { useState, useEffect, useRef } from 'react';
import {
  BookOpen, Plus, MapPin, Send, Heart, MessageCircle, Loader2, X, Camera, ChevronRight, User
} from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { useThemeColors } from '../../lib/ThemeContext';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';

interface Destination {
  id: string;
  name: string;
  category: string;
  image_url: string;
}

interface JournalEntry {
  id: string;
  user_id: string;
  place_id: string | null;
  category: string;
  text: string;
  media_url: string | null;
  is_public: boolean;
  created_at: string;
  profiles: {
    name: string;
    profile_photo_url: string | null;
  } | null;
  destinations: {
    name: string;
  } | null;
  reply_count?: number;
}

interface JournalReply {
  id: string;
  entry_id: string;
  user_id: string;
  text: string;
  created_at: string;
  profiles: {
    name: string;
    profile_photo_url: string | null;
  } | null;
}

const categories = [
  { id: 'Adventure', emoji: '🏔️', label: 'Adventure' },
  { id: 'Wildlife', emoji: '🦁', label: 'Wildlife' },
  { id: 'Culture & Heritage', emoji: '🏛️', label: 'Culture & Heritage' },
  { id: 'Nature', emoji: '🌿', label: 'Nature' },
  { id: 'Pilgrimage', emoji: '🛕', label: 'Pilgrimage' },
  { id: 'Homestay', emoji: '🏡', label: 'Homestay' },
];

export function JournalTab() {
  const { user } = useAuth();
  const colors = useThemeColors();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
  const [replies, setReplies] = useState<Record<string, JournalReply[]>>({});

  // New entry form state
  const [selectedPlace, setSelectedPlace] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Adventure');
  const [entryText, setEntryText] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [replyText, setReplyText] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchData();
  }, [user]);

  async function fetchData() {
    setLoading(true);

    // Fetch public journal entries with author info
    const { data: entriesData } = await supabase
      .from('journal_entries')
      .select(`
        *,
        profiles:user_id (name, profile_photo_url),
        destinations:place_id (name)
      `)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(20);

    if (entriesData) {
      // Get reply counts
      const entriesWithCounts = await Promise.all(
        entriesData.map(async (entry) => {
          const { count } = await supabase
            .from('journal_replies')
            .select('*', { count: 'exact', head: true })
            .eq('entry_id', entry.id);
          return { ...entry, reply_count: count || 0 };
        })
      );
      setEntries(entriesWithCounts);
    }

    // Fetch destinations for place picker
    const { data: destsData } = await supabase
      .from('destinations')
      .select('id, name, category, image_url')
      .order('name')
      .limit(100);

    if (destsData) setDestinations(destsData);

    setLoading(false);
  }

  async function fetchReplies(entryId: string) {
    const { data } = await supabase
      .from('journal_replies')
      .select(`
        *,
        profiles:user_id (name, profile_photo_url)
      `)
      .eq('entry_id', entryId)
      .order('created_at', { ascending: true });

    if (data) {
      setReplies(prev => ({ ...prev, [entryId]: data }));
    }
  }

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('File must be less than 10MB');
      return;
    }

    setMediaFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveEntry = async () => {
    if (!entryText.trim() || !user) return;

    setSaving(true);

    try {
      let mediaUrl: string | null = null;

      // Upload media if provided
      if (mediaFile) {
        const fileExt = mediaFile.name.split('.').pop();
        const fileName = `journal-${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `journal/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(filePath, mediaFile);

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('media')
            .getPublicUrl(filePath);
          mediaUrl = urlData.publicUrl;
        }
      }

      const { error: insertError } = await supabase
        .from('journal_entries')
        .insert({
          user_id: user.id,
          place_id: selectedPlace || null,
          category: selectedCategory,
          text: entryText,
          media_url: mediaUrl,
          is_public: true
        });

      if (insertError) throw insertError;

      // Reset form
      setEntryText('');
      setSelectedPlace('');
      setSelectedCategory('Adventure');
      setMediaFile(null);
      setMediaPreview(null);
      setShowNewEntry(false);

      // Refresh entries
      fetchData();
    } catch (err) {
      console.error('Error saving entry:', err);
      alert('Failed to save entry. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSendReply = async (entryId: string) => {
    const text = replyText[entryId]?.trim();
    if (!text || !user) return;

    try {
      const { error } = await supabase
        .from('journal_replies')
        .insert({
          entry_id: entryId,
          user_id: user.id,
          text
        });

      if (error) throw error;

      setReplyText(prev => ({ ...prev, [entryId]: '' }));
      fetchReplies(entryId);

      // Update reply count
      setEntries(prev => prev.map(e =>
        e.id === entryId ? { ...e, reply_count: (e.reply_count || 0) + 1 } : e
      ));
    } catch (err) {
      console.error('Error sending reply:', err);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="p-4 md:p-6 space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={cn('text-2xl font-display font-bold flex items-center gap-2', colors.text)}>
            <BookOpen className="w-6 h-6" /> Journal
          </h1>
          <p className={cn('text-sm', colors.textSecondary)}>
            Share your travel stories with the community
          </p>
        </div>
        <button
          onClick={() => setShowNewEntry(true)}
          className="flex items-center gap-2 px-4 py-2 bg-forest-600 text-white rounded-xl font-medium hover:bg-forest-700 transition-colors"
        >
          <Plus className="w-5 h-5" /> New Entry
        </button>
      </div>

      {/* New Entry Modal */}
      {showNewEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowNewEntry(false)} />
          <div className={cn(
            'relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl p-6',
            colors.card === 'bg-white' ? 'bg-white' : 'bg-forest-900 border border-forest-700'
          )}>
            <button
              onClick={() => setShowNewEntry(false)}
              className={cn('absolute top-4 right-4 p-2 rounded-lg', colors.card === 'bg-white' ? 'hover:bg-stone-100' : 'hover:bg-forest-800')}
            >
              <X className={cn('w-5 h-5', colors.text)} />
            </button>

            <h2 className={cn('text-xl font-display font-bold mb-4', colors.text)}>
              New Journal Entry
            </h2>

            <div className="space-y-4">
              {/* Place Picker */}
              <div>
                <label className={cn('text-sm font-medium mb-1.5 block', colors.text)}>
                  <MapPin className="w-4 h-4 inline mr-1" /> Place
                </label>
                <select
                  value={selectedPlace}
                  onChange={(e) => setSelectedPlace(e.target.value)}
                  className={cn(
                    'w-full px-4 py-3 rounded-xl border-2 transition-all',
                    colors.card === 'bg-white'
                      ? 'bg-white border-stone-200 focus:border-forest-500'
                      : 'bg-forest-800 border-forest-700 focus:border-forest-500',
                    colors.text,
                    'focus:outline-none'
                  )}
                >
                  <option value="">Select a place (optional)</option>
                  {destinations.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.category})</option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div>
                <label className={cn('text-sm font-medium mb-1.5 block', colors.text)}>
                  Category
                </label>
                <div className="flex flex-wrap gap-2">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={cn(
                        'px-3 py-2 rounded-xl text-sm font-medium transition-all',
                        selectedCategory === cat.id
                          ? 'bg-forest-600 text-white'
                          : colors.card === 'bg-white'
                            ? 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                            : 'bg-forest-800 text-stone-300 hover:bg-forest-700'
                      )}
                    >
                      {cat.emoji} {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Media Upload */}
              <div>
                <label className={cn('text-sm font-medium mb-1.5 block', colors.text)}>
                  Photo / Video
                </label>
                {mediaPreview ? (
                  <div className="relative rounded-xl overflow-hidden">
                    <img src={mediaPreview} alt="Preview" className="w-full h-48 object-cover" />
                    <button
                      onClick={() => { setMediaFile(null); setMediaPreview(null); }}
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
                    <span className={cn('text-sm', colors.textMuted)}>Add photo or video</span>
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleMediaChange}
                  className="hidden"
                />
              </div>

              {/* Text */}
              <div>
                <label className={cn('text-sm font-medium mb-1.5 block', colors.text)}>
                  Your Story
                </label>
                <textarea
                  value={entryText}
                  onChange={(e) => setEntryText(e.target.value)}
                  rows={6}
                  className={cn(
                    'w-full px-4 py-3 rounded-xl border-2 transition-all resize-none',
                    colors.card === 'bg-white'
                      ? 'bg-white border-stone-200 focus:border-forest-500'
                      : 'bg-forest-800 border-forest-700 focus:border-forest-500',
                    colors.text,
                    'placeholder:text-stone-400 focus:outline-none'
                  )}
                  placeholder="Share your experience, tips, stories..."
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowNewEntry(false)}
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
                  onClick={handleSaveEntry}
                  disabled={saving || !entryText.trim()}
                  className="flex-1 py-3 rounded-xl font-medium transition-colors bg-forest-600 text-white hover:bg-forest-700 disabled:opacity-50"
                >
                  {saving ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Posting...
                    </span>
                  ) : (
                    'Post Entry'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Entries Feed */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className={cn('rounded-xl p-4 animate-pulse', colors.card === 'bg-white' ? 'bg-white' : 'bg-forest-800')}>
              <div className="flex items-center gap-3 mb-3">
                <div className={cn('w-10 h-10 rounded-full', colors.card === 'bg-white' ? 'bg-stone-100' : 'bg-forest-700')} />
                <div className="flex-1">
                  <div className={cn('h-4 w-32 rounded mb-1', colors.card === 'bg-white' ? 'bg-stone-100' : 'bg-forest-700')} />
                  <div className={cn('h-3 w-24 rounded', colors.card === 'bg-white' ? 'bg-stone-100' : 'bg-forest-700')} />
                </div>
              </div>
              <div className={cn('h-20 rounded', colors.card === 'bg-white' ? 'bg-stone-100' : 'bg-forest-700')} />
            </div>
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className={cn(
          'text-center py-12 rounded-xl border',
          colors.card === 'bg-white' ? 'bg-white border-stone-200' : 'bg-forest-800/50 border-forest-700'
        )}>
          <BookOpen className={cn('w-12 h-12 mx-auto mb-3 opacity-30', colors.textMuted)} />
          <h3 className={cn('font-semibold mb-1', colors.text)}>No journal entries yet</h3>
          <p className={cn('text-sm mb-4', colors.textSecondary)}>Be the first to share your adventure!</p>
          <button
            onClick={() => setShowNewEntry(true)}
            className="btn-primary py-2 px-4"
          >
            Write First Entry
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className={cn(
                'rounded-xl overflow-hidden border transition-all',
                colors.card === 'bg-white' ? 'bg-white border-stone-200' : 'bg-forest-800/50 border-forest-700'
              )}
            >
              {/* Author Header */}
              <div className="p-4 flex items-center gap-3">
                {entry.profiles?.profile_photo_url ? (
                  <img
                    src={entry.profiles.profile_photo_url}
                    alt={entry.profiles.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold',
                    colors.card === 'bg-white' ? 'bg-forest-100 text-forest-600' : 'bg-forest-700 text-forest-200'
                  )}>
                    {entry.profiles?.name?.[0]?.toUpperCase() || <User className="w-5 h-5" />}
                  </div>
                )}
                <div className="flex-1">
                  <div className={cn('font-semibold', colors.text)}>
                    {entry.profiles?.name || 'Traveler'}
                  </div>
                  <div className={cn('text-xs', colors.textMuted)}>
                    {formatTimeAgo(entry.created_at)}
                    {entry.destinations?.name && (
                      <span className="ml-1">· {entry.destinations.name}</span>
                    )}
                  </div>
                </div>
                <span className="text-sm bg-forest-100 dark:bg-forest-700 px-2 py-1 rounded-lg">
                  {categories.find(c => c.id === entry.category)?.emoji || '📝'} {entry.category}
                </span>
              </div>

              {/* Media */}
              {entry.media_url && (
                <div className="aspect-video">
                  <img
                    src={entry.media_url}
                    alt="Journal media"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Text */}
              <div className="p-4 pt-2">
                <p className={cn('text-sm whitespace-pre-wrap', colors.textSecondary)}>
                  {entry.text}
                </p>
              </div>

              {/* Actions */}
              <div className={cn(
                'px-4 py-2 border-t flex items-center gap-4',
                colors.border
              )}>
                <button
                  onClick={() => {
                    if (expandedEntry === entry.id) {
                      setExpandedEntry(null);
                    } else {
                      setExpandedEntry(entry.id);
                      fetchReplies(entry.id);
                    }
                  }}
                  className={cn(
                    'flex items-center gap-1.5 text-sm transition-colors',
                    colors.textMuted
                  )}
                >
                  <MessageCircle className="w-4 h-4" />
                  {entry.reply_count || 0} replies
                </button>
                <ChevronRight
                  className={cn(
                    'w-4 h-4 transition-transform',
                    colors.textMuted,
                    expandedEntry === entry.id ? 'rotate-90' : ''
                  )}
                />
              </div>

              {/* Replies Section */}
              {expandedEntry === entry.id && (
                <div className={cn('border-t', colors.border)}>
                  {/* Existing replies */}
                  {replies[entry.id]?.map((reply) => (
                    <div key={reply.id} className={cn('p-4 flex gap-3', colors.card === 'bg-white' ? 'bg-stone-50' : 'bg-forest-900')}>
                      {reply.profiles?.profile_photo_url ? (
                        <img
                          src={reply.profiles.profile_photo_url}
                          alt={reply.profiles.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold',
                          colors.card === 'bg-white' ? 'bg-forest-100 text-forest-600' : 'bg-forest-700 text-forest-200'
                        )}>
                          {reply.profiles?.name?.[0]?.toUpperCase() || '?'}
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={cn('text-sm font-medium', colors.text)}>
                            {reply.profiles?.name || 'Traveler'}
                          </span>
                          <span className={cn('text-xs', colors.textMuted)}>
                            {formatTimeAgo(reply.created_at)}
                          </span>
                        </div>
                        <p className={cn('text-sm', colors.textSecondary)}>{reply.text}</p>
                      </div>
                    </div>
                  ))}

                  {/* Reply Input */}
                  <div className={cn('p-3 flex gap-2', colors.card === 'bg-white' ? 'bg-stone-50' : 'bg-forest-900')}>
                    <input
                      type="text"
                      value={replyText[entry.id] || ''}
                      onChange={(e) => setReplyText(prev => ({ ...prev, [entry.id]: e.target.value }))}
                      placeholder="Write a reply..."
                      className={cn(
                        'flex-1 px-4 py-2 rounded-full text-sm border transition-all',
                        colors.card === 'bg-white'
                          ? 'bg-white border-stone-200 focus:border-forest-500'
                          : 'bg-forest-800 border-forest-700 focus:border-forest-500',
                        colors.text,
                        'placeholder:text-stone-400 focus:outline-none'
                      )}
                    />
                    <button
                      onClick={() => handleSendReply(entry.id)}
                      disabled={!replyText[entry.id]?.trim()}
                      className="p-2 rounded-full bg-forest-600 text-white hover:bg-forest-700 disabled:opacity-50 transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
