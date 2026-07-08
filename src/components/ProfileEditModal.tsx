import { useState, useRef } from 'react';
import { X, Camera, Upload, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useThemeColors } from '../lib/ThemeContext';
import { cn } from '../lib/utils';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: {
    name: string;
    bio: string;
    location: string;
    profile_photo_url: string | null;
  };
  userId: string;
  onSave: (updates: { name: string; bio: string; location: string; profile_photo_url: string | null }) => void;
}

export function ProfileEditModal({ isOpen, onClose, profile, userId, onSave }: ProfileEditModalProps) {
  const colors = useThemeColors();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(profile.name);
  const [bio, setBio] = useState(profile.bio || '');
  const [location, setLocation] = useState(profile.location || 'Nepal');
  const [photoUrl, setPhotoUrl] = useState(profile.profile_photo_url);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `profile-${userId}-${Date.now()}.${fileExt}`;
      const filePath = `profiles/${fileName}`;

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setPhotoUrl(urlData.publicUrl);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          name,
          bio,
          location,
          profile_photo_url: photoUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      onSave({ name, bio, location, profile_photo_url: photoUrl });
      onClose();
    } catch (err: any) {
      console.error('Save error:', err);
      setError('Failed to save profile. Please try again.');
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
        'relative w-full max-w-md rounded-2xl p-6 animate-scale-in',
        colors.card === 'bg-white' ? 'bg-white' : 'bg-forest-900 border border-forest-700'
      )}>
        <button
          onClick={onClose}
          className={cn(
            'absolute top-4 right-4 p-2 rounded-lg transition-colors',
            colors.card === 'bg-white' ? 'hover:bg-stone-100' : 'hover:bg-forest-800'
          )}
        >
          <X className={cn('w-5 h-5', colors.text)} />
        </button>

        <h2 className={cn('text-xl font-display font-bold mb-6', colors.text)}>
          Edit Profile
        </h2>

        {/* Profile Photo */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative">
            <div className={cn(
              'w-28 h-28 rounded-full overflow-hidden border-4',
              colors.card === 'bg-white' ? 'border-forest-100' : 'border-forest-700'
            )}>
              {photoUrl ? (
                <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className={cn(
                  'w-full h-full flex items-center justify-center text-4xl font-display font-bold',
                  colors.card === 'bg-white' ? 'bg-forest-50' : 'bg-forest-800'
                )}>
                  {name?.[0]?.toUpperCase() || '?'}
                </div>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className={cn(
                'absolute bottom-0 right-0 p-2.5 rounded-full shadow-lg transition-colors',
                colors.card === 'bg-white'
                  ? 'bg-forest-600 text-white hover:bg-forest-700'
                  : 'bg-forest-700 text-white hover:bg-forest-600'
              )}
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <p className={cn('text-xs mt-2', colors.textMuted)}>
            Max 5MB, JPG/PNG/WEBP
          </p>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          <div>
            <label className={cn('text-sm font-medium mb-1.5 block', colors.text)}>
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={cn(
                'w-full px-4 py-3 rounded-xl border-2 transition-all',
                colors.card === 'bg-white'
                  ? 'bg-white border-stone-200 focus:border-forest-500'
                  : 'bg-forest-800 border-forest-700 focus:border-forest-500',
                colors.text,
                'placeholder:text-stone-400 focus:outline-none'
              )}
              placeholder="Your name"
            />
          </div>

          <div>
            <label className={cn('text-sm font-medium mb-1.5 block', colors.text)}>
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className={cn(
                'w-full px-4 py-3 rounded-xl border-2 transition-all resize-none',
                colors.card === 'bg-white'
                  ? 'bg-white border-stone-200 focus:border-forest-500'
                  : 'bg-forest-800 border-forest-700 focus:border-forest-500',
                colors.text,
                'placeholder:text-stone-400 focus:outline-none'
              )}
              placeholder="Tell us about yourself..."
            />
          </div>

          <div>
            <label className={cn('text-sm font-medium mb-1.5 block', colors.text)}>
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className={cn(
                'w-full px-4 py-3 rounded-xl border-2 transition-all',
                colors.card === 'bg-white'
                  ? 'bg-white border-stone-200 focus:border-forest-500'
                  : 'bg-forest-800 border-forest-700 focus:border-forest-500',
                colors.text,
                'placeholder:text-stone-400 focus:outline-none'
              )}
              placeholder="Kathmandu, Nepal"
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <p className="text-red-500 text-sm mt-4">{error}</p>
        )}

        {/* Actions */}
        <div className="flex gap-3 mt-6">
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
            disabled={saving || uploading}
            className="flex-1 py-3 rounded-xl font-medium transition-colors bg-forest-600 text-white hover:bg-forest-700 disabled:opacity-50"
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </span>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
