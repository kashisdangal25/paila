import { useState, useRef, useEffect } from 'react';
import { X, Camera, Loader2, User, Phone, Shield, Heart, MapPin, Globe2, Languages, AlertTriangle, Activity, Droplet, Mountain, Plus, Trash2, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth, UserProfile, TrustedContact } from '../lib/AuthContext';
import { useThemeColors } from '../lib/ThemeContext';
import { cn } from '../lib/utils';

type Tab = 'personal' | 'contact' | 'safety' | 'travel';

const COUNTRIES = [
  'Nepal', 'India', 'China', 'United States', 'United Kingdom', 'Australia',
  'Canada', 'Germany', 'France', 'Japan', 'South Korea', 'Thailand',
  'Singapore', 'Malaysia', 'United Arab Emirates', 'Other',
];

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ne', label: 'नेपाली (Nepali)' },
  { code: 'hi', label: 'हिन्दी (Hindi)' },
  { code: 'zh', label: '中文 (Chinese)' },
  { code: 'ja', label: '日本語 (Japanese)' },
  { code: 'ko', label: '한국어 (Korean)' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'es', label: 'Español' },
];

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown'];
const EXPERIENCE_LEVELS = [
  { value: 'beginner', label: 'Beginner — Day hikes, no technical trails' },
  { value: 'intermediate', label: 'Intermediate — Multi-day treks, moderate altitude' },
  { value: 'advanced', label: 'Advanced — High altitude, technical terrain' },
  { value: 'expert', label: 'Expert — Expedition-level, extreme altitude' },
];

const RELATIONSHIPS = ['Parent', 'Sibling', 'Spouse/Partner', 'Child', 'Relative', 'Friend', 'Colleague', 'Guide', 'Other'];

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
}

export function ProfileEditModal({ isOpen, onClose, onSave }: ProfileEditModalProps) {
  const { user, profile, updateProfile, refreshProfile } = useAuth();
  const colors = useThemeColors();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<Tab>('personal');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [trustedContacts, setTrustedContacts] = useState<TrustedContact[]>([]);
  const [newContact, setNewContact] = useState({ name: '', phone: '', email: '', relationship: '' });
  const [addingContact, setAddingContact] = useState(false);

  const [form, setForm] = useState<Partial<UserProfile>>({});

  useEffect(() => {
    if (isOpen && profile) {
      setForm({ ...profile });
      fetchTrustedContacts();
    }
  }, [isOpen, profile]);

  const fetchTrustedContacts = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('trusted_contacts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });
    if (data) setTrustedContacts(data as TrustedContact[]);
  };

  if (!isOpen) return null;

  const isDark = colors.card !== 'bg-white';

  const update = (field: keyof UserProfile, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('Image must be less than 5MB'); return; }
    if (!file.type.startsWith('image/')) { setError('Please select an image file'); return; }

    setUploading(true);
    setError(null);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user?.id}/profile-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      update('profile_photo_url', urlData.publicUrl);
    } catch (err: any) {
      setError('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const { error: updateError } = await updateProfile(form);
      if (updateError) throw updateError;
      await refreshProfile();
      setSuccess('Profile saved successfully');
      onSave?.();
      setTimeout(() => { setSuccess(null); onClose(); }, 800);
    } catch (err: any) {
      setError('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddContact = async () => {
    if (!user) return;
    if (!newContact.name.trim() || !newContact.phone.trim()) {
      setError('Contact name and phone are required');
      return;
    }
    setAddingContact(true);
    setError(null);
    try {
      const { data, error: insertError } = await supabase
        .from('trusted_contacts')
        .insert({
          user_id: user.id,
          name: newContact.name.trim(),
          phone: newContact.phone.trim(),
          email: newContact.email.trim() || null,
          relationship: newContact.relationship || null,
        })
        .select('*')
        .single();
      if (insertError) throw insertError;
      setTrustedContacts(prev => [...prev, data as TrustedContact]);
      setNewContact({ name: '', phone: '', email: '', relationship: '' });
    } catch (err: any) {
      setError('Failed to add contact. Please try again.');
    } finally {
      setAddingContact(false);
    }
  };

  const handleDeleteContact = async (id: string) => {
    try {
      const { error: deleteError } = await supabase.from('trusted_contacts').delete().eq('id', id);
      if (deleteError) throw deleteError;
      setTrustedContacts(prev => prev.filter(c => c.id !== id));
    } catch (err: any) {
      setError('Failed to delete contact.');
    }
  };

  const handleToggleContactFlag = async (contact: TrustedContact, field: 'notify_on_trip' | 'notify_on_sos') => {
    const newValue = !contact[field];
    try {
      const { error: updateError } = await supabase
        .from('trusted_contacts')
        .update({ [field]: newValue, updated_at: new Date().toISOString() })
        .eq('id', contact.id);
      if (updateError) throw updateError;
      setTrustedContacts(prev => prev.map(c => c.id === contact.id ? { ...c, [field]: newValue } : c));
    } catch (err: any) {
      setError('Failed to update contact.');
    }
  };

  const inputClass = cn(
    'w-full px-4 py-2.5 rounded-xl border-2 transition-all focus:outline-none focus:ring-4',
    isDark
      ? 'bg-forest-800 border-forest-700 focus:border-forest-500 focus:ring-forest-900/30'
      : 'bg-white border-stone-200 focus:border-forest-500 focus:ring-forest-100',
    colors.text,
    'placeholder:text-stone-400'
  );

  const labelClass = cn('text-sm font-medium mb-1.5 block', colors.text);
  const sectionCardClass = cn(
    'rounded-xl p-4 border',
    isDark ? 'bg-forest-800/50 border-forest-700' : 'bg-stone-50 border-stone-200'
  );

  const tabs: { id: Tab; label: string; icon: typeof User }[] = [
    { id: 'personal', label: 'Personal', icon: User },
    { id: 'contact', label: 'Contact', icon: Phone },
    { id: 'safety', label: 'Safety', icon: Shield },
    { id: 'travel', label: 'Travel', icon: Mountain },
  ];

  const renderPersonal = () => (
    <div className="space-y-4 animate-fade-in">
      {/* Profile Photo */}
      <div className="flex flex-col items-center mb-4">
        <div className="relative">
          <div className={cn('w-24 h-24 rounded-full overflow-hidden border-4', isDark ? 'border-forest-700' : 'border-forest-100')}>
            {form.profile_photo_url ? (
              <img src={form.profile_photo_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className={cn('w-full h-full flex items-center justify-center text-3xl font-display font-bold', isDark ? 'bg-forest-800' : 'bg-forest-50', colors.text)}>
                {form.name?.[0]?.toUpperCase() || '?'}
              </div>
            )}
          </div>
          <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className={cn('absolute bottom-0 right-0 p-2 rounded-full shadow-lg transition-colors', isDark ? 'bg-forest-700 text-white hover:bg-forest-600' : 'bg-forest-600 text-white hover:bg-forest-700')}>
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        </div>
        <p className={cn('text-xs mt-2', colors.textMuted)}>Max 5MB, JPG/PNG/WEBP</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Full Name *</label>
          <input type="text" value={form.name || ''} onChange={(e) => update('name', e.target.value)} className={inputClass} placeholder="Your full name" />
        </div>
        <div>
          <label className={labelClass}>Username</label>
          <input type="text" value={form.username || ''} onChange={(e) => update('username', e.target.value)} className={inputClass} placeholder="Unique username" />
        </div>
      </div>

      <div>
        <label className={labelClass}>Email</label>
        <input type="email" value={form.email || ''} disabled className={cn(inputClass, 'opacity-60 cursor-not-allowed')} />
        <p className={cn('text-xs mt-1', colors.textMuted)}>Email cannot be changed here</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Date of Birth</label>
          <input type="date" value={form.date_of_birth || ''} onChange={(e) => update('date_of_birth', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Gender</label>
          <select value={form.gender || ''} onChange={(e) => update('gender', e.target.value || null)} className={inputClass}>
            <option value="">Prefer not to say</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="non-binary">Non-binary</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Nationality</label>
          <select value={form.nationality || ''} onChange={(e) => update('nationality', e.target.value || null)} className={inputClass}>
            <option value="">Select nationality</option>
            {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Country of Residence</label>
          <select value={form.country_of_residence || ''} onChange={(e) => update('country_of_residence', e.target.value || null)} className={inputClass}>
            <option value="">Select country</option>
            {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>Preferred Language</label>
        <select value={form.preferred_language || 'en'} onChange={(e) => update('preferred_language', e.target.value)} className={inputClass}>
          {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
        </select>
      </div>

      <div>
        <label className={labelClass}>Bio</label>
        <textarea value={form.bio || ''} onChange={(e) => update('bio', e.target.value)} rows={3} className={cn(inputClass, 'resize-none')} placeholder="Tell us about yourself..." />
      </div>

      <div>
        <label className={labelClass}>Location</label>
        <input type="text" value={form.location || ''} onChange={(e) => update('location', e.target.value)} className={inputClass} placeholder="Kathmandu, Nepal" />
      </div>
    </div>
  );

  const renderContact = () => (
    <div className="space-y-4 animate-fade-in">
      <div>
        <label className={labelClass}>Phone Number</label>
        <input type="tel" value={form.phone || ''} onChange={(e) => update('phone', e.target.value)} className={inputClass} placeholder="+977 98XXXXXXXX" />
      </div>

      <div className={cn('rounded-xl p-4 border', isDark ? 'bg-forest-800/50 border-forest-700' : 'bg-amber-50 border-amber-200')}>
        <div className="flex items-center gap-2 mb-3">
          <Phone className={cn('w-5 h-5', isDark ? 'text-amber-400' : 'text-amber-600')} />
          <h3 className={cn('font-semibold', colors.text)}>Emergency Contact</h3>
        </div>
        <p className={cn('text-xs mb-4', colors.textMuted)}>This person will be contacted in case of an emergency during your travels in Nepal.</p>

        <div className="space-y-3">
          <div>
            <label className={labelClass}>Contact Name</label>
            <input type="text" value={form.emergency_contact_name || ''} onChange={(e) => update('emergency_contact_name', e.target.value)} className={inputClass} placeholder="Emergency contact name" />
          </div>
          <div>
            <label className={labelClass}>Contact Phone Number</label>
            <input type="tel" value={form.emergency_contact_phone || ''} onChange={(e) => update('emergency_contact_phone', e.target.value)} className={inputClass} placeholder="+977 98XXXXXXXX" />
          </div>
          <div>
            <label className={labelClass}>Relationship</label>
            <select value={form.emergency_contact_relationship || ''} onChange={(e) => update('emergency_contact_relationship', e.target.value || null)} className={inputClass}>
              <option value="">Select relationship</option>
              {RELATIONSHIPS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSafety = () => (
    <div className="space-y-4 animate-fade-in">
      <div className={cn('rounded-xl p-3 border flex items-start gap-3', isDark ? 'bg-forest-800/50 border-forest-700' : 'bg-blue-50 border-blue-200')}>
        <Shield className={cn('w-5 h-5 flex-shrink-0 mt-0.5', isDark ? 'text-blue-400' : 'text-blue-600')} />
        <p className={cn('text-xs', colors.textSecondary)}>This information is stored securely and only used for safety-related features. It is never shared publicly.</p>
      </div>

      <div className={sectionCardClass}>
        <div className="flex items-center gap-2 mb-3">
          <Droplet className={cn('w-5 h-5', isDark ? 'text-red-400' : 'text-red-500')} />
          <h3 className={cn('font-semibold', colors.text)}>Medical Information</h3>
        </div>
        <div className="space-y-3">
          <div>
            <label className={labelClass}>Blood Group</label>
            <select value={form.blood_group || ''} onChange={(e) => update('blood_group', e.target.value || null)} className={inputClass}>
              <option value="">Unknown / Prefer not to say</option>
              {BLOOD_GROUPS.map(b => <option key={b} value={b}>{b === 'unknown' ? 'Unknown' : b}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Medical Conditions</label>
            <textarea value={form.medical_conditions || ''} onChange={(e) => update('medical_conditions', e.target.value)} rows={2} className={cn(inputClass, 'resize-none')} placeholder="e.g., asthma, diabetes, heart condition..." />
          </div>
          <div>
            <label className={labelClass}>Allergies</label>
            <textarea value={form.allergies || ''} onChange={(e) => update('allergies', e.target.value)} rows={2} className={cn(inputClass, 'resize-none')} placeholder="e.g., penicillin, peanuts, pollen..." />
          </div>
        </div>
      </div>

      <div className={sectionCardClass}>
        <div className="flex items-center gap-2 mb-3">
          <Mountain className={cn('w-5 h-5', isDark ? 'text-emerald-400' : 'text-emerald-600')} />
          <h3 className={cn('font-semibold', colors.text)}>Trekking Experience</h3>
        </div>
        <div className="space-y-3">
          <div>
            <label className={labelClass}>Experience Level</label>
            <select value={form.trekking_experience_level || ''} onChange={(e) => update('trekking_experience_level', e.target.value || null)} className={inputClass}>
              <option value="">Select level</option>
              {EXPERIENCE_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Preferred Emergency Language</label>
            <select value={form.preferred_emergency_language || ''} onChange={(e) => update('preferred_emergency_language', e.target.value || null)} className={inputClass}>
              <option value="">Same as preferred language</option>
              {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
            <p className={cn('text-xs mt-1', colors.textMuted)}>Language to use when emergency services contact you</p>
          </div>
        </div>
      </div>

      <div className={sectionCardClass}>
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className={cn('w-5 h-5', isDark ? 'text-orange-400' : 'text-orange-500')} />
          <h3 className={cn('font-semibold', colors.text)}>SOS Settings</h3>
        </div>
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <p className={cn('text-sm font-medium', colors.text)}>Enable SOS alerts</p>
            <p className={cn('text-xs', colors.textMuted)}>Allow the app to send emergency alerts (coming soon)</p>
          </div>
          <button
            type="button"
            onClick={() => update('sos_enabled', !form.sos_enabled)}
            className={cn('relative w-12 h-6 rounded-full transition-colors', form.sos_enabled ? 'bg-forest-600' : isDark ? 'bg-forest-700' : 'bg-stone-300')}
          >
            <span className={cn('absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform', form.sos_enabled && 'translate-x-6')} />
          </button>
        </label>
      </div>
    </div>
  );

  const renderTravel = () => (
    <div className="space-y-4 animate-fade-in">
      <div className={sectionCardClass}>
        <div className="flex items-center gap-2 mb-3">
          <Activity className={cn('w-5 h-5', isDark ? 'text-emerald-400' : 'text-emerald-600')} />
          <h3 className={cn('font-semibold', colors.text)}>Travel Status</h3>
        </div>
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <p className={cn('text-sm font-medium', colors.text)}>I'm currently travelling</p>
            <p className={cn('text-xs', colors.textMuted)}>Enables future safety features like SOS, trip sharing, and emergency contact notifications</p>
          </div>
          <button
            type="button"
            onClick={() => update('is_currently_travelling', !form.is_currently_travelling)}
            className={cn('relative w-12 h-6 rounded-full transition-colors', form.is_currently_travelling ? 'bg-forest-600' : isDark ? 'bg-forest-700' : 'bg-stone-300')}
          >
            <span className={cn('absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform', form.is_currently_travelling && 'translate-x-6')} />
          </button>
        </label>
      </div>

      <div className={sectionCardClass}>
        <div className="flex items-center gap-2 mb-3">
          <Heart className={cn('w-5 h-5', isDark ? 'text-rose-400' : 'text-rose-500')} />
          <h3 className={cn('font-semibold', colors.text)}>Trusted Contacts</h3>
        </div>
        <p className={cn('text-xs mb-4', colors.textMuted)}>People who can be notified about your trips or in case of emergency.</p>

        {trustedContacts.length > 0 && (
          <div className="space-y-2 mb-4">
            {trustedContacts.map(contact => (
              <div key={contact.id} className={cn('p-3 rounded-lg border flex items-start justify-between gap-2', isDark ? 'bg-forest-900/50 border-forest-700' : 'bg-white border-stone-200')}>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-medium', colors.text)}>{contact.name}</p>
                  <p className={cn('text-xs', colors.textMuted)}>{contact.phone}{contact.relationship ? ` • ${contact.relationship}` : ''}</p>
                  <div className="flex gap-3 mt-2">
                    <button
                      onClick={() => handleToggleContactFlag(contact, 'notify_on_trip')}
                      className={cn('text-xs flex items-center gap-1 transition-colors', contact.notify_on_trip ? 'text-forest-500' : colors.textMuted)}
                    >
                      <Check className={cn('w-3 h-3', contact.notify_on_trip ? 'opacity-100' : 'opacity-30')} />
                      Trip alerts
                    </button>
                    <button
                      onClick={() => handleToggleContactFlag(contact, 'notify_on_sos')}
                      className={cn('text-xs flex items-center gap-1 transition-colors', contact.notify_on_sos ? 'text-forest-500' : colors.textMuted)}
                    >
                      <Check className={cn('w-3 h-3', contact.notify_on_sos ? 'opacity-100' : 'opacity-30')} />
                      SOS alerts
                    </button>
                  </div>
                </div>
                <button onClick={() => handleDeleteContact(contact.id)} className={cn('p-1 rounded transition-colors', isDark ? 'hover:bg-forest-800' : 'hover:bg-stone-100', 'text-red-500')}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className={cn('p-3 rounded-lg border space-y-2', isDark ? 'bg-forest-900/50 border-forest-700' : 'bg-stone-50 border-stone-200')}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input type="text" value={newContact.name} onChange={(e) => setNewContact(prev => ({ ...prev, name: e.target.value }))} className={inputClass} placeholder="Contact name" />
            <input type="tel" value={newContact.phone} onChange={(e) => setNewContact(prev => ({ ...prev, phone: e.target.value }))} className={inputClass} placeholder="Phone number" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input type="email" value={newContact.email} onChange={(e) => setNewContact(prev => ({ ...prev, email: e.target.value }))} className={inputClass} placeholder="Email (optional)" />
            <select value={newContact.relationship} onChange={(e) => setNewContact(prev => ({ ...prev, relationship: e.target.value }))} className={inputClass}>
              <option value="">Relationship (optional)</option>
              {RELATIONSHIPS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <button onClick={handleAddContact} disabled={addingContact} className={cn('w-full py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2', isDark ? 'bg-forest-700 text-white hover:bg-forest-600' : 'bg-forest-600 text-white hover:bg-forest-700', 'disabled:opacity-50')}>
            {addingContact ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> Add Contact</>}
          </button>
        </div>
      </div>

      <div className={sectionCardClass}>
        <div className="flex items-center gap-2 mb-3">
          <Globe2 className={cn('w-5 h-5', isDark ? 'text-blue-400' : 'text-blue-500')} />
          <h3 className={cn('font-semibold', colors.text)}>Travel Insurance <span className={cn('text-xs font-normal', colors.textMuted)}>(optional)</span></h3>
        </div>
        <div className="space-y-3">
          <div>
            <label className={labelClass}>Insurance Provider</label>
            <input
              type="text"
              value={form.travel_insurance?.provider || ''}
              onChange={(e) => update('travel_insurance', { ...form.travel_insurance, provider: e.target.value })}
              className={inputClass}
              placeholder="e.g., World Nomads, IMG"
            />
          </div>
          <div>
            <label className={labelClass}>Policy Number</label>
            <input
              type="text"
              value={form.travel_insurance?.policy || ''}
              onChange={(e) => update('travel_insurance', { ...form.travel_insurance, policy: e.target.value })}
              className={inputClass}
              placeholder="Policy number"
            />
          </div>
          <div>
            <label className={labelClass}>Insurance Contact Phone</label>
            <input
              type="tel"
              value={form.travel_insurance?.phone || ''}
              onChange={(e) => update('travel_insurance', { ...form.travel_insurance, phone: e.target.value })}
              className={inputClass}
              placeholder="Emergency assistance number"
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className={cn('relative w-full max-w-2xl max-h-[90vh] rounded-2xl flex flex-col animate-scale-in', isDark ? 'bg-forest-900 border border-forest-700' : 'bg-white')}>
        {/* Header */}
        <div className={cn('flex items-center justify-between p-5 border-b', isDark ? 'border-forest-700' : 'border-stone-200')}>
          <h2 className={cn('text-xl font-display font-bold', colors.text)}>Edit Profile</h2>
          <button onClick={onClose} className={cn('p-2 rounded-lg transition-colors', isDark ? 'hover:bg-forest-800' : 'hover:bg-stone-100')}>
            <X className={cn('w-5 h-5', colors.text)} />
          </button>
        </div>

        {/* Tabs */}
        <div className={cn('flex gap-1 p-3 border-b overflow-x-auto', isDark ? 'border-forest-700' : 'border-stone-200')}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
                activeTab === tab.id
                  ? 'bg-forest-600 text-white'
                  : isDark ? 'text-stone-300 hover:bg-forest-800' : 'text-stone-600 hover:bg-stone-100'
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {error && <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>}
          {success && <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-600 text-sm flex items-center gap-2"><Check className="w-4 h-4" />{success}</div>}

          {activeTab === 'personal' && renderPersonal()}
          {activeTab === 'contact' && renderContact()}
          {activeTab === 'safety' && renderSafety()}
          {activeTab === 'travel' && renderTravel()}
        </div>

        {/* Footer */}
        <div className={cn('flex gap-3 p-5 border-t', isDark ? 'border-forest-700' : 'border-stone-200')}>
          <button onClick={onClose} className={cn('flex-1 py-3 rounded-xl font-medium transition-colors', isDark ? 'bg-forest-800 text-stone-300 hover:bg-forest-700' : 'bg-stone-100 text-stone-700 hover:bg-stone-200')}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving || uploading} className="flex-1 py-3 rounded-xl font-medium transition-colors bg-forest-600 text-white hover:bg-forest-700 disabled:opacity-50">
            {saving ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Saving...</span> : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
