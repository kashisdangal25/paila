import { useState, useRef, useEffect } from 'react';
import {
  Store, User, Phone, Mail, MapPin, FileText, Camera, DollarSign, Calendar,
  Check, ChevronRight, ChevronLeft, Loader2, X, Upload, Mountain, Languages, Briefcase
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';

interface VendorOnboardingProps {
  onComplete: () => void;
  onSkip: () => void;
}

const BUSINESS_TYPES = [
  { id: 'guide', label: 'Guide', emoji: '🧭' },
  { id: 'homestay', label: 'Homestay', emoji: '🏡' },
  { id: 'transport', label: 'Transport', emoji: '🚙' },
  { id: 'cafe', label: 'Cafe', emoji: '☕' },
  { id: 'rental', label: 'Rental', emoji: '🎒' },
  { id: 'agency', label: 'Agency', emoji: '🏛️' },
];

const PROVINCES = ['Koshi', 'Madhesh', 'Bagmati', 'Gandaki', 'Lumbini', 'Karnali', 'Sudurpashchim'];
const DISTRICTS: Record<string, string[]> = {
  Koshi: ['Taplejung', 'Sankhuwasabha', 'Solukhumbu', 'Bhojpur', 'Dhankuta', 'Terhathum', 'Morang', 'Sunsari', 'Ilam', 'Jhapa', 'Panchthar', 'Udayapur', 'Khotang'],
  Madhesh: ['Sarlahi', 'Dhanusha', 'Mahottari', 'Saptari', 'Siraha', 'Bara', 'Parsa', 'Rautahat'],
  Bagmati: ['Kathmandu', 'Lalitpur', 'Bhaktapur', 'Dhading', 'Nuwakot', 'Rasuwa', 'Sindhupalchok', 'Kavrepalanchok', 'Makwanpur', 'Ramechhap', 'Sindhuli', 'Chitwan', 'Dolakha', 'Gorkha', 'Lamjung', 'Tanahun', 'Nawalpur'],
  Gandaki: ['Kaski', 'Syangja', 'Parbat', 'Baglung', 'Myagdi', 'Mustang', 'Manang', 'Gorkha', 'Lamjung', 'Tanahun', 'Nawalpur'],
  Lumbini: ['Rupandehi', 'Kapilvastu', 'Dang', 'Pyuthan', 'Rolpa', 'Arghakhanchi', 'Gulmi', 'Palpa', 'Banke', 'Bardiya', 'Surkhet', 'Dailekh', 'Jajarkot'],
  Karnali: ['Jumla', 'Kalikot', 'Mugu', 'Humla', 'Dolpa', 'Surkhet', 'Dailekh', 'Jajarkot', 'Rukum', 'Salyan'],
  Sudurpashchim: ['Dadeldhura', 'Baitadi', 'Darchula', 'Kanchanpur', 'Kailali', 'Doti', 'Achham', 'Bajura', 'Bajhang'],
};

const LANGUAGES = ['English', 'Nepali', 'Hindi', 'Chinese', 'Japanese', 'Korean', 'French', 'German', 'Spanish', 'Sherpa', 'Tamang', 'Gurung', 'Magar', 'Newari', 'Thakali'];

const NATURE_COVER = 'https://images.pexels.com/photos/4194617/pexels-photo-4194617.jpeg?auto=compress&cs=tinysrgb&w=1200';

export default function VendorOnboarding({ onComplete, onSkip }: VendorOnboardingProps) {
  const { user, profile } = useAuth();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Business type
  const [businessType, setBusinessType] = useState('');
  // Step 2: Business details
  const [businessName, setBusinessName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  // Step 3: Location
  const [address, setAddress] = useState('');
  const [district, setDistrict] = useState('');
  const [province, setProvince] = useState('');
  const [gpsLat, setGpsLat] = useState<number | null>(null);
  const [gpsLng, setGpsLng] = useState<number | null>(null);
  // Step 4: Description & experience
  const [description, setDescription] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [servicesOffered, setServicesOffered] = useState<string[]>([]);
  // Step 5: Photos
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [logo, setLogo] = useState<File | null>(null);
  const [gallery, setGallery] = useState<File[]>([]);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState('');
  const [logoPreview, setLogoPreview] = useState('');
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  // Step 6: Pricing
  const [hourlyRate, setHourlyRate] = useState('');
  const [dailyRate, setDailyRate] = useState('');
  const [nightlyRate, setNightlyRate] = useState('');
  const [packageRate, setPackageRate] = useState('');
  // Step 7: Documents
  const [docFiles, setDocFiles] = useState<Record<string, File | null>>({});
  // Step 8: Availability
  const [availability, setAvailability] = useState<Record<string, boolean>>({});
  // Step 9: Review & submit

  const profilePhotoRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Initialize availability for next 30 days
    const days: Record<string, boolean> = {};
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      days[d.toISOString().split('T')[0]] = true;
    }
    setAvailability(days);
  }, []);

  const TOTAL_STEPS = 9;

  const canProceed = (): boolean => {
    switch (step) {
      case 1: return !!businessType;
      case 2: return !!businessName.trim() && !!contactPerson.trim() && !!phone.trim() && !!email.trim();
      case 3: return !!address.trim() && !!district && !!province;
      case 4: return !!description.trim();
      case 5: return true; // Photos optional
      case 6: return true; // Pricing optional
      case 7: return true; // Documents optional
      case 8: return true;
      case 9: return true;
      default: return false;
    }
  };

  function toggleLanguage(lang: string) {
    setSelectedLanguages(prev => prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]);
  }

  function toggleService(svc: string) {
    setServicesOffered(prev => prev.includes(svc) ? prev.filter(s => s !== svc) : [...prev, svc]);
  }

  function handleProfilePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    setProfilePhoto(f); setProfilePhotoPreview(URL.createObjectURL(f));
  }

  function handleLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    setLogo(f); setLogoPreview(URL.createObjectURL(f));
  }

  function handleGallery(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (gallery.length + files.length > 10) { setError('Max 10 gallery photos'); return; }
    setGallery(prev => [...prev, ...files]);
    setGalleryPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
  }

  function removeGalleryPhoto(idx: number) {
    setGallery(prev => prev.filter((_, i) => i !== idx));
    setGalleryPreviews(prev => prev.filter((_, i) => i !== idx));
  }

  function toggleAvailabilityDay(date: string) {
    setAvailability(prev => ({ ...prev, [date]: !prev[date] }));
  }

  async function uploadFile(file: File, path: string): Promise<string> {
    const { error: upErr } = await supabase.storage.from('media').upload(path, file, { cacheControl: '3600', upsert: false });
    if (upErr) throw new Error(`Upload failed: ${upErr.message}`);
    const { data: urlData } = supabase.storage.from('media').getPublicUrl(path);
    return urlData.publicUrl;
  }

  async function handleSubmit() {
    if (!user) return;
    setSaving(true); setError(null);
    try {
      const userId = user.id;
      let profilePhotoUrl = '';
      let logoUrl = '';
      let galleryUrls: string[] = [];

      if (profilePhoto) profilePhotoUrl = await uploadFile(profilePhoto, `${userId}/vendor/profile-${Date.now()}.${profilePhoto.name.split('.').pop()}`);
      if (logo) logoUrl = await uploadFile(logo, `${userId}/vendor/logo-${Date.now()}.${logo.name.split('.').pop()}`);
      for (let i = 0; i < gallery.length; i++) {
        const url = await uploadFile(gallery[i], `${userId}/vendor/gallery-${Date.now()}-${i}.${gallery[i].name.split('.').pop()}`);
        galleryUrls.push(url);
      }

      const docUrls: Record<string, string> = {};
      for (const [docType, file] of Object.entries(docFiles)) {
        if (file) docUrls[docType] = await uploadFile(file, `${userId}/vendor/docs/${docType}-${Date.now()}.${file.name.split('.').pop()}`);
      }

      const pricing = {
        hourly: hourlyRate ? parseFloat(hourlyRate) : null,
        daily: dailyRate ? parseFloat(dailyRate) : null,
        nightly: nightlyRate ? parseFloat(nightlyRate) : null,
        package: packageRate ? parseFloat(packageRate) : null,
      };

      const vendorData = {
        user_id: userId,
        business_name: businessName,
        business_type: businessType,
        contact_person: contactPerson,
        phone,
        email,
        location: address,
        district,
        province,
        gps_lat: gpsLat,
        gps_lng: gpsLng,
        description,
        years_experience: yearsExperience ? parseInt(yearsExperience) : null,
        languages: selectedLanguages,
        services_offered: servicesOffered,
        profile_photo_url: profilePhotoUrl || null,
        logo_url: logoUrl || null,
        gallery_urls: galleryUrls.length > 0 ? galleryUrls : null,
        pricing,
        documents: Object.keys(docUrls).length > 0 ? docUrls : null,
        availability,
        rating: 0,
        review_count: 0,
        cover_photo_url: NATURE_COVER,
        status: 'approved',
      };

      const { error: upsertErr } = await supabase
        .from('vendors')
        .upsert(vendorData, { onConflict: 'user_id' });
      if (upsertErr) throw upsertErr;

      await supabase.from('profiles').update({ vendor_status: 'approved' }).eq('id', userId);
      onComplete();
    } catch (err: any) {
      setError(err.message || 'Failed to submit registration');
    } finally { setSaving(false); }
  }

  const inputClass = 'w-full px-4 py-2.5 rounded-xl border-2 border-stone-200 focus:border-forest-500 focus:ring-2 focus:ring-forest-200 focus:outline-none transition-all bg-white text-stone-800 placeholder:text-stone-400';

  const stepIcons = [Store, User, MapPin, FileText, Camera, DollarSign, FileText, Calendar, Check];

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-forest-700 rounded-xl flex items-center justify-center">
              <Mountain className="w-6 h-6 text-white" />
            </div>
            <span className="font-display text-xl font-bold text-forest-700">Paila Vendor</span>
          </div>
          <button onClick={onSkip} className="text-sm text-stone-500 hover:text-stone-700">Skip for now</button>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-1 mb-6">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div key={i} className={cn('flex-1 h-2 rounded-full transition-colors', i + 1 <= step ? 'bg-forest-600' : 'bg-stone-200')} />
          ))}
        </div>
        <p className="text-sm text-stone-500 mb-4 text-center">Step {step} of {TOTAL_STEPS}</p>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          {error && <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>}

          {/* Step 1: Business Type */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="text-xl font-display font-bold text-stone-800">What type of business?</h2>
              <p className="text-sm text-stone-500">Select your business category</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {BUSINESS_TYPES.map(bt => (
                  <button key={bt.id} onClick={() => setBusinessType(bt.id)} className={cn('flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all', businessType === bt.id ? 'border-forest-500 bg-forest-50' : 'border-stone-200 hover:border-stone-300')}>
                    <span className="text-3xl">{bt.emoji}</span>
                    <span className="text-sm font-medium text-stone-700">{bt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Business Details */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="text-xl font-display font-bold text-stone-800">Business Details</h2>
              <div>
                <label className="text-sm font-medium mb-1.5 block text-stone-700">Business Name *</label>
                <input type="text" value={businessName} onChange={e => setBusinessName(e.target.value)} className={inputClass} placeholder="e.g., Himalayan Trek Guides" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block text-stone-700">Contact Person *</label>
                <input type="text" value={contactPerson} onChange={e => setContactPerson(e.target.value)} className={inputClass} placeholder="Your name" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1.5 block text-stone-700">Phone *</label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className={inputClass} placeholder="+977 98XXXXXXXX" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block text-stone-700">Email *</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputClass} placeholder="business@email.com" />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Location */}
          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="text-xl font-display font-bold text-stone-800">Location</h2>
              <div>
                <label className="text-sm font-medium mb-1.5 block text-stone-700">Address *</label>
                <input type="text" value={address} onChange={e => setAddress(e.target.value)} className={inputClass} placeholder="Street address" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1.5 block text-stone-700">Province *</label>
                  <select value={province} onChange={e => { setProvince(e.target.value); setDistrict(''); }} className={inputClass}>
                    <option value="">Select</option>
                    {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block text-stone-700">District *</label>
                  <select value={district} onChange={e => setDistrict(e.target.value)} className={inputClass} disabled={!province}>
                    <option value="">Select</option>
                    {(DISTRICTS[province] || []).map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1.5 block text-stone-700">GPS Latitude</label>
                  <input type="number" step="0.000001" value={gpsLat ?? ''} onChange={e => setGpsLat(e.target.value ? parseFloat(e.target.value) : null)} className={inputClass} placeholder="28.2096" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block text-stone-700">GPS Longitude</label>
                  <input type="number" step="0.000001" value={gpsLng ?? ''} onChange={e => setGpsLng(e.target.value ? parseFloat(e.target.value) : null)} className={inputClass} placeholder="83.9881" />
                </div>
              </div>
              <button onClick={() => { if (navigator.geolocation) navigator.geolocation.getCurrentPosition(p => { setGpsLat(p.coords.latitude); setGpsLng(p.coords.longitude); }); }} className="text-sm text-forest-600 hover:underline">Use my current location</button>
            </div>
          )}

          {/* Step 4: Description & Experience */}
          {step === 4 && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="text-xl font-display font-bold text-stone-800">About Your Business</h2>
              <div>
                <label className="text-sm font-medium mb-1.5 block text-stone-700">Description *</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} className={cn(inputClass, 'resize-none')} placeholder="Tell travelers about your business..." />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block text-stone-700">Years of Experience</label>
                <input type="number" value={yearsExperience} onChange={e => setYearsExperience(e.target.value)} className={inputClass} placeholder="5" min="0" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block text-stone-700">Languages Spoken</label>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map(l => (
                    <button key={l} onClick={() => toggleLanguage(l)} className={cn('px-3 py-1.5 rounded-full text-sm font-medium transition-colors', selectedLanguages.includes(l) ? 'bg-forest-600 text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200')}>{l}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block text-stone-700">Services Offered</label>
                <div className="flex flex-wrap gap-2">
                  {['Trekking Guide', 'City Tour', 'Transport', 'Accommodation', 'Equipment Rental', 'Photography', 'Cooking', 'Porter Service'].map(s => (
                    <button key={s} onClick={() => toggleService(s)} className={cn('px-3 py-1.5 rounded-full text-sm font-medium transition-colors', servicesOffered.includes(s) ? 'bg-forest-600 text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200')}>{s}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Photos */}
          {step === 5 && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="text-xl font-display font-bold text-stone-800">Photos</h2>
              <p className="text-sm text-stone-500">Upload photos of your business in natural settings</p>

              {/* Profile Photo */}
              <div>
                <label className="text-sm font-medium mb-1.5 block text-stone-700">Profile Photo</label>
                <div className="flex items-center gap-3">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-stone-200">
                    {profilePhotoPreview ? <img src={profilePhotoPreview} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-stone-100"><Camera className="w-6 h-6 text-stone-400" /></div>}
                  </div>
                  <button onClick={() => profilePhotoRef.current?.click()} className="px-4 py-2 rounded-xl bg-stone-100 text-stone-700 text-sm font-medium hover:bg-stone-200">Upload</button>
                  <input ref={profilePhotoRef} type="file" accept="image/*" onChange={handleProfilePhoto} className="hidden" />
                </div>
              </div>

              {/* Logo */}
              <div>
                <label className="text-sm font-medium mb-1.5 block text-stone-700">Logo</label>
                <div className="flex items-center gap-3">
                  <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-stone-200">
                    {logoPreview ? <img src={logoPreview} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-stone-100"><Briefcase className="w-6 h-6 text-stone-400" /></div>}
                  </div>
                  <button onClick={() => logoRef.current?.click()} className="px-4 py-2 rounded-xl bg-stone-100 text-stone-700 text-sm font-medium hover:bg-stone-200">Upload</button>
                  <input ref={logoRef} type="file" accept="image/*" onChange={handleLogo} className="hidden" />
                </div>
              </div>

              {/* Gallery */}
              <div>
                <label className="text-sm font-medium mb-1.5 block text-stone-700">Gallery (up to 10 photos)</label>
                <div className="flex flex-wrap gap-2">
                  {galleryPreviews.map((url, i) => (
                    <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button onClick={() => removeGalleryPhoto(i)} className="absolute top-1 right-1 p-0.5 rounded-full bg-black/50 text-white"><X className="w-3 h-3" /></button>
                    </div>
                  ))}
                  {gallery.length < 10 && (
                    <button onClick={() => galleryRef.current?.click()} className="w-20 h-20 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 hover:bg-stone-50">
                      <Upload className="w-5 h-5 text-stone-400" />
                      <span className="text-xs text-stone-400">Add</span>
                    </button>
                  )}
                </div>
                <input ref={galleryRef} type="file" accept="image/*" multiple onChange={handleGallery} className="hidden" />
              </div>
            </div>
          )}

          {/* Step 6: Pricing */}
          {step === 6 && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="text-xl font-display font-bold text-stone-800">Pricing</h2>
              <p className="text-sm text-stone-500">Set your rates in NPR (optional)</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1.5 block text-stone-700">Hourly Rate (NPR)</label>
                  <input type="number" value={hourlyRate} onChange={e => setHourlyRate(e.target.value)} className={inputClass} placeholder="500" min="0" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block text-stone-700">Daily Rate (NPR)</label>
                  <input type="number" value={dailyRate} onChange={e => setDailyRate(e.target.value)} className={inputClass} placeholder="3000" min="0" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block text-stone-700">Nightly Rate (NPR)</label>
                  <input type="number" value={nightlyRate} onChange={e => setNightlyRate(e.target.value)} className={inputClass} placeholder="1500" min="0" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block text-stone-700">Package Rate (NPR)</label>
                  <input type="number" value={packageRate} onChange={e => setPackageRate(e.target.value)} className={inputClass} placeholder="15000" min="0" />
                </div>
              </div>
            </div>
          )}

          {/* Step 7: Documents */}
          {step === 7 && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="text-xl font-display font-bold text-stone-800">Documents</h2>
              <p className="text-sm text-stone-500">Upload your business documents (optional but recommended for verification)</p>
              {['ID Document', 'License', 'Registration', 'Insurance'].map(docType => (
                <div key={docType}>
                  <label className="text-sm font-medium mb-1.5 block text-stone-700">{docType}</label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={e => { const f = e.target.files?.[0]; if (f) setDocFiles(prev => ({ ...prev, [docType]: f })); }}
                    className="hidden"
                    id={`doc-${docType}`}
                  />
                  <label htmlFor={`doc-${docType}`} className={cn('flex items-center gap-2 p-3 rounded-xl border-2 border-dashed cursor-pointer hover:bg-stone-50', docFiles[docType] ? 'border-forest-500 bg-forest-50' : 'border-stone-200')}>
                    <Upload className="w-5 h-5 text-stone-400" />
                    <span className="text-sm text-stone-600">{docFiles[docType] ? docFiles[docType].name : `Upload ${docType}`}</span>
                  </label>
                </div>
              ))}
            </div>
          )}

          {/* Step 8: Availability Calendar */}
          {step === 8 && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="text-xl font-display font-bold text-stone-800">Availability Calendar</h2>
              <p className="text-sm text-stone-500">Toggle dates you're available. Click a date to toggle.</p>
              <div className="grid grid-cols-7 gap-1 max-h-64 overflow-y-auto">
                {Object.entries(availability).map(([date, available]) => (
                  <button
                    key={date}
                    onClick={() => toggleAvailabilityDay(date)}
                    className={cn('aspect-square rounded-lg text-xs font-medium transition-colors flex flex-col items-center justify-center', available ? 'bg-forest-600 text-white' : 'bg-stone-100 text-stone-400')}
                  >
                    <span>{new Date(date).getDate()}</span>
                    <span className="text-[10px] opacity-70">{new Date(date).toLocaleDateString('en', { weekday: 'short' }).slice(0, 1)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 9: Review & Submit */}
          {step === 9 && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="text-xl font-display font-bold text-stone-800">Review & Submit</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-stone-500">Business Type</span><span className="font-medium text-stone-800">{BUSINESS_TYPES.find(b => b.id === businessType)?.label}</span></div>
                <div className="flex justify-between"><span className="text-stone-500">Business Name</span><span className="font-medium text-stone-800">{businessName}</span></div>
                <div className="flex justify-between"><span className="text-stone-500">Contact</span><span className="font-medium text-stone-800">{contactPerson}</span></div>
                <div className="flex justify-between"><span className="text-stone-500">Phone</span><span className="font-medium text-stone-800">{phone}</span></div>
                <div className="flex justify-between"><span className="text-stone-500">Location</span><span className="font-medium text-stone-800">{address}, {district}, {province}</span></div>
                <div className="flex justify-between"><span className="text-stone-500">Languages</span><span className="font-medium text-stone-800">{selectedLanguages.join(', ') || 'None'}</span></div>
                <div className="flex justify-between"><span className="text-stone-500">Services</span><span className="font-medium text-stone-800">{servicesOffered.join(', ') || 'None'}</span></div>
                <div className="flex justify-between"><span className="text-stone-500">Gallery Photos</span><span className="font-medium text-stone-800">{gallery.length}</span></div>
                <div className="flex justify-between"><span className="text-stone-500">Documents</span><span className="font-medium text-stone-800">{Object.keys(docFiles).length}</span></div>
              </div>
              <div className="p-3 rounded-xl bg-forest-50 border border-forest-200">
                <p className="text-sm text-forest-700">By submitting, your vendor account will be approved and you can start receiving bookings.</p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-6">
            {step > 1 && (
              <button onClick={() => setStep(s => s - 1)} className="flex items-center gap-1 px-4 py-3 rounded-xl bg-stone-100 text-stone-700 font-medium hover:bg-stone-200 transition-colors">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            )}
            {step < TOTAL_STEPS ? (
              <button onClick={() => canProceed() && setStep(s => s + 1)} disabled={!canProceed()} className="flex-1 flex items-center justify-center gap-1 px-4 py-3 rounded-xl bg-forest-600 text-white font-medium hover:bg-forest-700 disabled:opacity-50 transition-colors">
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={saving} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-forest-600 text-white font-medium hover:bg-forest-700 disabled:opacity-50 transition-colors">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : <><Check className="w-4 h-4" /> Submit for Approval</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
