import { useState, useEffect } from 'react';
import { X, MapPin, Calendar, Sun, Cloud, CloudRain, RefreshCw, Loader2, Globe, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useThemeColors } from '../lib/ThemeContext';
import { cn } from '../lib/utils';

interface JournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onSaved: () => void;
  editJournal?: any;
}

const moods = [
  { id: 'excited', label: 'Excited', emoji: '🎉' },
  { id: 'peaceful', label: 'Peaceful', emoji: '😌' },
  { id: 'adventurous', label: 'Adventurous', emoji: '🏔️' },
  { id: 'reflective', label: 'Reflective', emoji: '🤔' },
  { id: 'grateful', label: 'Grateful', emoji: '🙏' },
  { id: 'inspired', label: 'Inspired', emoji: '✨' },
];

const weathers = [
  { id: 'sunny', label: 'Sunny', icon: Sun },
  { id: 'cloudy', label: 'Cloudy', icon: Cloud },
  { id: 'rainy', label: 'Rainy', icon: CloudRain },
];

export function JournalModal({ isOpen, onClose, userId, onSaved, editJournal }: JournalModalProps) {
  const colors = useThemeColors();
  const [title, setTitle] = useState(editJournal?.title || '');
  const [content, setContent] = useState(editJournal?.content || '');
  const [mood, setMood] = useState(editJournal?.mood || 'reflective');
  const [weather, setWeather] = useState(editJournal?.weather || 'sunny');
  const [isPublic, setIsPublic] = useState(editJournal?.is_public || false);
  const [destinationId, setDestinationId] = useState(editJournal?.destination_id || '');
  const [destinations, setDestinations] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDestinations() {
      const { data } = await supabase
        .from('destinations')
        .select('id, name')
        .order('name')
        .limit(50);
      if (data) setDestinations(data);
    }
    fetchDestinations();
  }, []);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      setError('Please fill in title and content');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (editJournal?.id) {
        // Update existing journal
        const { error: updateError } = await supabase
          .from('user_journals')
          .update({
            title,
            content,
            mood,
            weather,
            is_public: isPublic,
            destination_id: destinationId || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', editJournal.id);

        if (updateError) throw updateError;
      } else {
        // Create new journal
        const { error: insertError } = await supabase
          .from('user_journals')
          .insert({
            user_id: userId,
            title,
            content,
            mood,
            weather,
            is_public: isPublic,
            destination_id: destinationId || null
          });

        if (insertError) throw insertError;
      }

      onSaved();
      onClose();
    } catch (err: any) {
      console.error('Save error:', err);
      setError('Failed to save journal. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className={cn(
        'relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl',
        colors.card === 'bg-white' ? 'bg-white' : 'bg-forest-900 border border-forest-700'
      )}>
        {/* Header */}
        <div className={cn(
          'sticky top-0 z-10 flex items-center justify-between p-4 border-b',
          colors.card === 'bg-white' ? 'bg-white border-stone-200' : 'bg-forest-900 border-forest-700'
        )}>
          <h2 className={cn('text-xl font-display font-bold', colors.text)}>
            {editJournal ? 'Edit Journal' : 'New Journal Entry'}
          </h2>
          <button
            onClick={onClose}
            className={cn(
              'p-2 rounded-lg transition-colors',
              colors.card === 'bg-white' ? 'hover:bg-stone-100' : 'hover:bg-forest-800'
            )}
          >
            <X className={cn('w-5 h-5', colors.text)} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Destination */}
          <div>
            <label className={cn('text-sm font-medium mb-1.5 block', colors.text)}>
              <MapPin className="w-4 h-4 inline mr-1" /> Destination (optional)
            </label>
            <select
              value={destinationId}
              onChange={(e) => setDestinationId(e.target.value)}
              className={cn(
                'w-full px-4 py-3 rounded-xl border-2 transition-all',
                colors.card === 'bg-white'
                  ? 'bg-white border-stone-200 focus:border-forest-500'
                  : 'bg-forest-800 border-forest-700 focus:border-forest-500',
                colors.text,
                'focus:outline-none'
              )}
            >
              <option value="">Select a destination</option>
              {destinations.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className={cn('text-sm font-medium mb-1.5 block', colors.text)}>
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={cn(
                'w-full px-4 py-3 rounded-xl border-2 transition-all',
                colors.card === 'bg-white'
                  ? 'bg-white border-stone-200 focus:border-forest-500'
                  : 'bg-forest-800 border-forest-700 focus:border-forest-500',
                colors.text,
                'placeholder:text-stone-400 focus:outline-none'
              )}
              placeholder="Today's adventure..."
            />
          </div>

          {/* Content */}
          <div>
            <label className={cn('text-sm font-medium mb-1.5 block', colors.text)}>
              Journal Entry
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              className={cn(
                'w-full px-4 py-3 rounded-xl border-2 transition-all resize-none',
                colors.card === 'bg-white'
                  ? 'bg-white border-stone-200 focus:border-forest-500'
                  : 'bg-forest-800 border-forest-700 focus:border-forest-500',
                colors.text,
                'placeholder:text-stone-400 focus:outline-none'
              )}
              placeholder="Write about your journey, the people you met, the views you saw..."
            />
          </div>

          {/* Mood */}
          <div>
            <label className={cn('text-sm font-medium mb-1.5 block', colors.text)}>
              Mood
            </label>
            <div className="flex flex-wrap gap-2">
              {moods.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMood(m.id)}
                  className={cn(
                    'px-3 py-2 rounded-xl text-sm font-medium transition-all',
                    mood === m.id
                      ? 'bg-forest-600 text-white'
                      : colors.card === 'bg-white'
                        ? 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                        : 'bg-forest-800 text-stone-300 hover:bg-forest-700'
                  )}
                >
                  {m.emoji} {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Weather */}
          <div>
            <label className={cn('text-sm font-medium mb-1.5 block', colors.text)}>
              Weather
            </label>
            <div className="flex gap-2">
              {weathers.map((w) => (
                <button
                  key={w.id}
                  onClick={() => setWeather(w.id)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
                    weather === w.id
                      ? 'bg-forest-600 text-white'
                      : colors.card === 'bg-white'
                        ? 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                        : 'bg-forest-800 text-stone-300 hover:bg-forest-700'
                  )}
                >
                  <w.icon className="w-4 h-4" />
                  {w.label}
                </button>
              ))}
            </div>
          </div>

          {/* Privacy */}
          <div>
            <label className={cn('text-sm font-medium mb-1.5 block', colors.text)}>
              Privacy
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setIsPublic(false)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
                  !isPublic
                    ? 'bg-forest-600 text-white'
                    : colors.card === 'bg-white'
                      ? 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                      : 'bg-forest-800 text-stone-300 hover:bg-forest-700'
                )}
              >
                <Lock className="w-4 h-4" /> Private
              </button>
              <button
                onClick={() => setIsPublic(true)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
                  isPublic
                    ? 'bg-forest-600 text-white'
                    : colors.card === 'bg-white'
                      ? 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                      : 'bg-forest-800 text-stone-300 hover:bg-forest-700'
                )}
              >
                <Globe className="w-4 h-4" /> Public
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
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
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-3 rounded-xl font-medium transition-colors bg-forest-600 text-white hover:bg-forest-700 disabled:opacity-50"
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </span>
              ) : (
                'Save Entry'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
