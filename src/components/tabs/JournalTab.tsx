import { useState, useEffect, useRef } from 'react';
import {
  BookOpen, Plus, MapPin, Loader2, X, Camera, ChevronRight, ChevronLeft, User, AlertCircle,
  Calendar, DollarSign, Edit2, Trash2, Navigation, Heart, Tag
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
  title: string | null;
  mood: string | null;
  expense: number | null;
  location_text: string | null;
  latitude: number | null;
  longitude: number | null;
  entry_date: string | null;
  media_url: string | null;
  media_urls: string[] | null;
  media_type: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  profiles: { name: string; profile_photo_url: string | null } | null;
  destinations: { name: string } | null;
}

const MOODS = ['😊', '🤩', '😌', '🤠', '😴', '😤', '🤯', '🙏'];
const CATEGORIES = [
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
  const isDark = colors.card !== 'bg-white';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [viewingEntry, setViewingEntry] = useState<JournalEntry | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Form state
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [mood, setMood] = useState('');
  const [selectedPlace, setSelectedPlace] = useState('');
  const [category, setCategory] = useState('Adventure');
  const [locationText, setLocationText] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [expense, setExpense] = useState('');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [existingMediaUrls, setExistingMediaUrls] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detectingLocation, setDetectingLocation] = useState(false);

  useEffect(() => { fetchEntries(); }, [user]);

  async function fetchEntries() {
    setLoading(true);
    const { data } = await supabase
      .from('journal_entries')
      .select(`*, profiles:user_id (name, profile_photo_url), destinations:place_id (name)`)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) setEntries(data as JournalEntry[]);
    const { data: dests } = await supabase.from('destinations').select('id, name, category, image_url').order('name').limit(100);
    if (dests) setDestinations(dests);
    setLoading(false);
  }

  function resetForm() {
    setTitle(''); setText(''); setMood(''); setSelectedPlace(''); setCategory('Adventure');
    setLocationText(''); setLatitude(null); setLongitude(null);
    setEntryDate(new Date().toISOString().split('T')[0]); setExpense('');
    setMediaFiles([]); setMediaPreviews([]); setExistingMediaUrls([]);
    setError(null); setEditingEntry(null);
  }

  function openNewEntry() { resetForm(); setShowModal(true); }

  function openEditEntry(entry: JournalEntry) {
    setEditingEntry(entry);
    setTitle(entry.title || '');
    setText(entry.text);
    setMood(entry.mood || '');
    setSelectedPlace(entry.place_id || '');
    setCategory(entry.category);
    setLocationText(entry.location_text || '');
    setLatitude(entry.latitude);
    setLongitude(entry.longitude);
    setEntryDate(entry.entry_date || new Date().toISOString().split('T')[0]);
    setExpense(entry.expense ? String(entry.expense) : '');
    setExistingMediaUrls(entry.media_urls || (entry.media_url ? [entry.media_url] : []));
    setMediaFiles([]); setMediaPreviews([]);
    setError(null);
    setShowModal(true);
  }

  function detectLocation() {
    if (!navigator.geolocation) { setError('Geolocation not supported'); return; }
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLatitude(pos.coords.latitude); setLongitude(pos.coords.longitude); setDetectingLocation(false); },
      () => { setError('Could not detect location. Enter manually.'); setDetectingLocation(false); },
      { timeout: 10000 }
    );
  }

  function handleMediaChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const valid = files.filter(f => f.type.startsWith('image/'));
    if (valid.length !== files.length) setError('Only image files are supported');
    if (valid.length === 0) return;
    if (mediaFiles.length + existingMediaUrls.length + valid.length > 10) {
      setError('Maximum 10 photos per entry'); return;
    }
    setError(null);
    const newPreviews = valid.map(f => { const url = URL.createObjectURL(f); return url; });
    setMediaFiles(prev => [...prev, ...valid]);
    setMediaPreviews(prev => [...prev, ...newPreviews]);
  }

  function removeNewPhoto(idx: number) {
    setMediaFiles(prev => prev.filter((_, i) => i !== idx));
    setMediaPreviews(prev => prev.filter((_, i) => i !== idx));
  }

  function removeExistingPhoto(url: string) {
    setExistingMediaUrls(prev => prev.filter(u => u !== url));
  }

  async function uploadFiles(userId: string): Promise<string[]> {
    const uploaded: string[] = [];
    for (const file of mediaFiles) {
      const ext = file.name.split('.').pop();
      const path = `${userId}/journal/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage.from('media').upload(path, file, { cacheControl: '3600', upsert: false });
      if (upErr) throw new Error(`Upload failed: ${upErr.message}`);
      const { data: urlData } = supabase.storage.from('media').getPublicUrl(path);
      uploaded.push(urlData.publicUrl);
    }
    return uploaded;
  }

  async function handleSave() {
    if (!user) return;
    if (!title.trim()) { setError('Please enter a title'); return; }
    if (!text.trim()) { setError('Please write your story'); return; }

    setSaving(true); setError(null);
    try {
      let allMediaUrls = [...existingMediaUrls];
      if (mediaFiles.length > 0) {
        const newUrls = await uploadFiles(user.id);
        allMediaUrls = [...allMediaUrls, ...newUrls];
      }

      const payload = {
        user_id: user.id,
        place_id: selectedPlace || null,
        category,
        text: text.trim(),
        title: title.trim(),
        mood: mood || null,
        expense: expense ? parseFloat(expense) : null,
        location_text: locationText || null,
        latitude, longitude,
        entry_date: entryDate || null,
        media_urls: allMediaUrls.length > 0 ? allMediaUrls : null,
        media_url: allMediaUrls[0] || null,
        media_type: allMediaUrls.length > 0 ? 'image' : null,
        is_public: true,
      };

      if (editingEntry) {
        const { error: updErr } = await supabase.from('journal_entries').update(payload).eq('id', editingEntry.id);
        if (updErr) throw updErr;
      } else {
        const { error: insErr } = await supabase.from('journal_entries').insert(payload);
        if (insErr) throw insErr;
      }

      resetForm(); setShowModal(false); fetchEntries();
    } catch (err: any) {
      setError(err.message || 'Failed to save entry');
    } finally { setSaving(false); }
  }

  async function handleDelete(entryId: string) {
    if (!confirm('Delete this journal entry? This cannot be undone.')) return;
    try {
      const { error } = await supabase.from('journal_entries').delete().eq('id', entryId);
      if (error) throw error;
      setViewingEntry(null); fetchEntries();
    } catch (err: any) {
      setError(err.message || 'Failed to delete');
    }
  }

  function getEntryPhotos(entry: JournalEntry): string[] {
    if (entry.media_urls && entry.media_urls.length > 0) return entry.media_urls;
    if (entry.media_url) return [entry.media_url];
    return [];
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  const inputClass = cn(
    'w-full px-4 py-2.5 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-forest-200',
    isDark ? 'bg-forest-800 border-forest-700 focus:border-forest-500' : 'bg-white border-stone-200 focus:border-forest-500',
    colors.text, 'placeholder:text-stone-400'
  );

  // ============= FULL ENTRY VIEW =============
  if (viewingEntry) {
    const photos = getEntryPhotos(viewingEntry);
    const isOwner = user?.id === viewingEntry.user_id;
    return (
      <div className="p-4 md:p-6 max-w-3xl mx-auto animate-fade-in">
        <button onClick={() => setViewingEntry(null)} className={cn('flex items-center gap-2 mb-4 text-sm', colors.textSecondary)}>
          <ChevronLeft className="w-4 h-4" /> Back to Journal
        </button>

        <div className={cn('rounded-2xl overflow-hidden border', isDark ? 'bg-forest-800 border-forest-700' : 'bg-white border-stone-200')}>
          {/* Photo Carousel */}
          {photos.length > 0 && (
            <div className="relative aspect-video bg-stone-900">
              <img src={photos[carouselIndex]} alt={viewingEntry.title || 'Journal'} className="w-full h-full object-cover" />
              {photos.length > 1 && (
                <>
                  <button onClick={() => setCarouselIndex(i => (i - 1 + photos.length) % photos.length)} className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button onClick={() => setCarouselIndex(i => (i + 1) % photos.length)} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                    {photos.map((_, i) => (
                      <div key={i} className={cn('w-2 h-2 rounded-full transition-colors', i === carouselIndex ? 'bg-white' : 'bg-white/40')} />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          <div className="p-5 space-y-4">
            {/* Title + Mood */}
            <div className="flex items-start justify-between gap-3">
              <h1 className={cn('text-2xl font-display font-bold', colors.text)}>{viewingEntry.title}</h1>
              {viewingEntry.mood && <span className="text-3xl">{viewingEntry.mood}</span>}
            </div>

            {/* Meta */}
            <div className="flex flex-wrap gap-3 text-sm">
              {viewingEntry.entry_date && (
                <span className={cn('flex items-center gap-1', colors.textSecondary)}>
                  <Calendar className="w-4 h-4" /> {formatDate(viewingEntry.entry_date)}
                </span>
              )}
              {(viewingEntry.location_text || viewingEntry.destinations?.name) && (
                <span className={cn('flex items-center gap-1', colors.textSecondary)}>
                  <MapPin className="w-4 h-4" /> {viewingEntry.location_text || viewingEntry.destinations?.name}
                </span>
              )}
              {viewingEntry.expense != null && (
                <span className={cn('flex items-center gap-1', colors.textSecondary)}>
                  <DollarSign className="w-4 h-4" /> NPR {Number(viewingEntry.expense).toLocaleString()}
                </span>
              )}
              <span className={cn('flex items-center gap-1', colors.textSecondary)}>
                <Tag className="w-4 h-4" /> {CATEGORIES.find(c => c.id === viewingEntry.category)?.emoji} {viewingEntry.category}
              </span>
            </div>

            {/* Author */}
            <div className="flex items-center gap-2">
              {viewingEntry.profiles?.profile_photo_url ? (
                <img src={viewingEntry.profiles.profile_photo_url} alt="" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold', isDark ? 'bg-forest-700 text-forest-200' : 'bg-forest-100 text-forest-600')}>
                  {viewingEntry.profiles?.name?.[0]?.toUpperCase() || '?'}
                </div>
              )}
              <span className={cn('text-sm font-medium', colors.text)}>{viewingEntry.profiles?.name || 'Traveler'}</span>
            </div>

            {/* Description */}
            <p className={cn('text-sm whitespace-pre-wrap leading-relaxed', colors.textSecondary)}>{viewingEntry.text}</p>

            {/* Edit/Delete */}
            {isOwner && (
              <div className="flex gap-3 pt-4 border-t border-stone-200 dark:border-forest-700">
                <button onClick={() => { openEditEntry(viewingEntry); setViewingEntry(null); }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-forest-600 text-white hover:bg-forest-700 transition-colors text-sm font-medium">
                  <Edit2 className="w-4 h-4" /> Edit
                </button>
                <button onClick={() => handleDelete(viewingEntry.id)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors text-sm font-medium">
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={cn('text-2xl font-display font-bold flex items-center gap-2', colors.text)}>
            <BookOpen className="w-6 h-6" /> Journal
          </h1>
          <p className={cn('text-sm', colors.textSecondary)}>Document your Nepal adventures</p>
        </div>
        <button onClick={openNewEntry} className="flex items-center gap-2 px-4 py-2 bg-forest-600 text-white rounded-xl font-medium hover:bg-forest-700 transition-colors">
          <Plus className="w-5 h-5" /> New Entry
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className={cn('relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl p-6', isDark ? 'bg-forest-900 border border-forest-700' : 'bg-white')}>
            <button onClick={() => setShowModal(false)} className={cn('absolute top-4 right-4 p-2 rounded-lg', isDark ? 'hover:bg-forest-800' : 'hover:bg-stone-100')}>
              <X className={cn('w-5 h-5', colors.text)} />
            </button>
            <h2 className={cn('text-xl font-display font-bold mb-4', colors.text)}>{editingEntry ? 'Edit Entry' : 'New Journal Entry'}</h2>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className={cn('text-sm font-medium mb-1.5 block', colors.text)}>Title *</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} className={inputClass} placeholder="Give your entry a title" />
              </div>

              {/* Mood */}
              <div>
                <label className={cn('text-sm font-medium mb-1.5 block', colors.text)}>Mood</label>
                <div className="flex gap-2 flex-wrap">
                  {MOODS.map(m => (
                    <button key={m} onClick={() => setMood(m === mood ? '' : m)} className={cn('text-2xl p-2 rounded-xl transition-all', mood === m ? (isDark ? 'bg-forest-700 ring-2 ring-forest-500' : 'bg-forest-100 ring-2 ring-forest-500') : isDark ? 'hover:bg-forest-800' : 'hover:bg-stone-100')}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Place + Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={cn('text-sm font-medium mb-1.5 block', colors.text)}>Place</label>
                  <select value={selectedPlace} onChange={e => setSelectedPlace(e.target.value)} className={inputClass}>
                    <option value="">Optional</option>
                    {destinations.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={cn('text-sm font-medium mb-1.5 block', colors.text)}>Category</label>
                  <select value={category} onChange={e => setCategory(e.target.value)} className={inputClass}>
                    {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Date + Expense */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={cn('text-sm font-medium mb-1.5 block', colors.text)}>Date</label>
                  <input type="date" value={entryDate} onChange={e => setEntryDate(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={cn('text-sm font-medium mb-1.5 block', colors.text)}>Expense (NPR)</label>
                  <input type="number" value={expense} onChange={e => setExpense(e.target.value)} className={inputClass} placeholder="0" min="0" />
                </div>
              </div>

              {/* Location */}
              <div>
                <label className={cn('text-sm font-medium mb-1.5 block', colors.text)}>Location</label>
                <div className="flex gap-2">
                  <input type="text" value={locationText} onChange={e => setLocationText(e.target.value)} className={cn(inputClass, 'flex-1')} placeholder="Enter location manually" />
                  <button onClick={detectLocation} disabled={detectingLocation} className={cn('px-3 rounded-xl border-2 transition-colors flex items-center gap-1 text-sm', isDark ? 'border-forest-700 hover:bg-forest-800' : 'border-stone-200 hover:bg-stone-100', colors.text)}>
                    {detectingLocation ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                    Auto
                  </button>
                </div>
                {latitude != null && longitude != null && (
                  <p className={cn('text-xs mt-1', colors.textMuted)}>GPS: {latitude.toFixed(4)}, {longitude.toFixed(4)}</p>
                )}
              </div>

              {/* Multi-Photo Upload */}
              <div>
                <label className={cn('text-sm font-medium mb-1.5 block', colors.text)}>Photos (up to 10)</label>
                <div className="flex flex-wrap gap-2">
                  {existingMediaUrls.map((url, i) => (
                    <div key={`ex-${i}`} className="relative w-20 h-20 rounded-xl overflow-hidden">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button onClick={() => removeExistingPhoto(url)} className="absolute top-1 right-1 p-0.5 rounded-full bg-black/50 text-white">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {mediaPreviews.map((url, i) => (
                    <div key={`new-${i}`} className="relative w-20 h-20 rounded-xl overflow-hidden">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button onClick={() => removeNewPhoto(i)} className="absolute top-1 right-1 p-0.5 rounded-full bg-black/50 text-white">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {mediaFiles.length + existingMediaUrls.length < 10 && (
                    <button onClick={() => fileInputRef.current?.click()} className={cn('w-20 h-20 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-colors', isDark ? 'border-forest-700 hover:bg-forest-800' : 'border-stone-300 hover:bg-forest-50')}>
                      <Camera className={cn('w-5 h-5', colors.textMuted)} />
                      <span className={cn('text-xs', colors.textMuted)}>Add</span>
                    </button>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleMediaChange} className="hidden" />
              </div>

              {/* Description */}
              <div>
                <label className={cn('text-sm font-medium mb-1.5 block', colors.text)}>Your Story *</label>
                <textarea value={text} onChange={e => setText(e.target.value)} rows={5} className={cn(inputClass, 'resize-none')} placeholder="Share your experience..." />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={() => { setShowModal(false); resetForm(); }} className={cn('flex-1 py-3 rounded-xl font-medium transition-colors', isDark ? 'bg-forest-800 text-stone-300 hover:bg-forest-700' : 'bg-stone-100 text-stone-700 hover:bg-stone-200')}>Cancel</button>
                <button onClick={handleSave} disabled={saving || !title.trim() || !text.trim()} className="flex-1 py-3 rounded-xl font-medium bg-forest-600 text-white hover:bg-forest-700 disabled:opacity-50">
                  {saving ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Saving...</span> : editingEntry ? 'Update' : 'Post Entry'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grid View */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className={cn('rounded-xl h-64 animate-pulse', isDark ? 'bg-forest-800' : 'bg-stone-100')} />)}
        </div>
      ) : entries.length === 0 ? (
        <div className={cn('text-center py-12 rounded-xl border', isDark ? 'bg-forest-800/50 border-forest-700' : 'bg-white border-stone-200')}>
          <BookOpen className={cn('w-12 h-12 mx-auto mb-3 opacity-30', colors.textMuted)} />
          <h3 className={cn('font-semibold mb-1', colors.text)}>No journal entries yet</h3>
          <p className={cn('text-sm mb-4', colors.textSecondary)}>Be the first to share your adventure!</p>
          <button onClick={openNewEntry} className="btn-primary py-2 px-4">Write First Entry</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {entries.map(entry => {
            const photos = getEntryPhotos(entry);
            return (
              <div key={entry.id} onClick={() => { setViewingEntry(entry); setCarouselIndex(0); }} className={cn('rounded-xl overflow-hidden border cursor-pointer transition-all hover:shadow-lg', isDark ? 'bg-forest-800 border-forest-700' : 'bg-white border-stone-200')}>
                {photos[0] ? (
                  <div className="aspect-video relative">
                    <img src={photos[0]} alt={entry.title || 'Journal'} className="w-full h-full object-cover" />
                    {photos.length > 1 && <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/60 text-white text-xs">{photos.length} photos</span>}
                    {entry.mood && <span className="absolute top-2 left-2 text-2xl">{entry.mood}</span>}
                  </div>
                ) : (
                  <div className={cn('aspect-video flex items-center justify-center', isDark ? 'bg-forest-700' : 'bg-forest-50')}>
                    {entry.mood ? <span className="text-4xl">{entry.mood}</span> : <BookOpen className={cn('w-10 h-10 opacity-30', colors.textMuted)} />}
                  </div>
                )}
                <div className="p-3 space-y-1">
                  <h3 className={cn('font-semibold text-sm truncate', colors.text)}>{entry.title || 'Untitled'}</h3>
                  <div className="flex items-center gap-2 text-xs">
                    <span className={colors.textMuted}>{formatDate(entry.entry_date) || formatDate(entry.created_at)}</span>
                    {(entry.location_text || entry.destinations?.name) && <span className={cn('flex items-center gap-0.5 truncate', colors.textMuted)}><MapPin className="w-3 h-3" />{entry.location_text || entry.destinations?.name}</span>}
                  </div>
                  {entry.expense != null && <span className={cn('text-xs flex items-center gap-0.5', colors.textMuted)}><DollarSign className="w-3 h-3" />NPR {Number(entry.expense).toLocaleString()}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
