import { useState, useEffect, useCallback } from 'react';
import {
  Mountain,
  ArrowRight,
  Check,
  MapPin,
  Star,
  Upload,
  X,
  Loader2,
  Rocket,
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';

// Types
type BusinessType = 'guide' | 'homestay' | 'transport' | 'cafe' | 'hotel' | 'tour_operator' | 'rental' | 'other';
type OnboardingStep = 'welcome' | 1 | 2 | 3 | 'success';

interface VendorData {
  businessType: BusinessType | '';
  businessName: string;
  price: string;
  priceUnit: string;
  province: string;
  district: string;
  city: string;
  coverPhoto: string;
  description: string;
  phone: string;
  whatsapp: string;
  paymentMethod: 'esewa' | 'khalti' | 'cash' | '';
  paymentId: string;
  agreeToTerms: boolean;
}

const BUSINESS_TYPES: Array<{ id: BusinessType; icon: string; label: string }> = [
  { id: 'guide', icon: '🧭', label: 'Licensed Guide' },
  { id: 'homestay', icon: '🏡', label: 'Homestay / Guesthouse' },
  { id: 'transport', icon: '🚌', label: 'Transport / Jeep' },
  { id: 'cafe', icon: '☕', label: 'Café / Restaurant' },
  { id: 'hotel', icon: '🏨', label: 'Hotel / Lodge' },
  { id: 'tour_operator', icon: '🎒', label: 'Tour Operator' },
  { id: 'rental', icon: '🛍', label: 'Rental Service' },
  { id: 'other', icon: '🌿', label: 'Other' },
];

const PROVINCES = ['Koshi', 'Madhesh', 'Bagmati', 'Gandaki', 'Lumbini', 'Karnali', 'Sudurpashchim'];

const DISTRICTS_BY_PROVINCE: Record<string, string[]> = {
  'Koshi': ['Bhojpur', 'Dhankuta', 'Ilam', 'Jhapa', 'Khotang', 'Morang', 'Okhaldhunga', 'Panchthar', 'Sankhuwasabha', 'Solukhumbu', 'Sunsari', 'Taplejung', 'Terhathum', 'Udayapur'],
  'Madhesh': ['Bara', 'Dhanusha', 'Mahottari', 'Parsa', 'Rautahat', 'Sarlahi', 'Saptari', 'Siraha'],
  'Bagmati': ['Bhaktapur', 'Chitwan', 'Dhading', 'Dolakha', 'Kathmandu', 'Kavrepalanchok', 'Lalitpur', 'Makwanpur', 'Nuwakot', 'Ramechhap', 'Rasuwa', 'Sindhulpalchok', 'Sindhuli'],
  'Gandaki': ['Baglung', 'Gorkha', 'Kaski', 'Lamjung', 'Manang', 'Mustang', 'Myagdi', 'Nawalpur', 'Parbat', 'Syangja', 'Tanahu'],
  'Lumbini': ['Arghakhanchi', 'Banke', 'Bardiya', 'Dang', 'Gulmi', 'Kapilvastu', 'Nawalparasi East', 'Palpa', 'Pyuthan', 'Rolpa', 'Rupandehi', 'Salyan'],
  'Karnali': ['Dailekh', 'Dolpa', 'Humla', 'Jajarkot', 'Jumla', 'Kalikot', 'Mugu', 'Rukum West', 'Salyan', 'Surkhet'],
  'Sudurpashchim': ['Achham', 'Baitadi', 'Bajhang', 'Bajura', 'Dadeldhura', 'Darchula', 'Doti', 'Kailali', 'Kanchanpur'],
};

const PRICE_UNITS = ['day', 'trip', 'hour', 'night', 'person', 'item'];

const PLACEHOLDER_IMAGES: Record<BusinessType, string> = {
  guide: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80',
  homestay: 'https://images.unsplash.com/photo-1520250497591-112f2f6a75a8?w=800&q=80',
  transport: 'https://images.unsplash.com/photo-1449965408869-eaa3f722eada?w=800&q=80',
  cafe: 'https://images.unsplash.com/photo-1555396273-36a6ddc1f1f6?w=800&q=80',
  hotel: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80',
  tour_operator: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&q=80',
  rental: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
  other: 'https://images.unsplash.com/photo-1506905925346-21bda4d61d26?w=800&q=80',
};

const initialData: VendorData = {
  businessType: '',
  businessName: '',
  price: '',
  priceUnit: 'day',
  province: '',
  district: '',
  city: '',
  coverPhoto: '',
  description: '',
  phone: '',
  whatsapp: '',
  paymentMethod: '',
  paymentId: '',
  agreeToTerms: false,
};

interface VendorOnboardingProps {
  onComplete: () => void;
  onSkip?: () => void;
}

export default function VendorOnboarding({ onComplete, onSkip }: VendorOnboardingProps) {
  const { user, profile } = useAuth();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [data, setData] = useState<VendorData>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize with user profile data
  useEffect(() => {
    if (profile) {
      setData(prev => ({
        ...prev,
        phone: profile.phone || '',
      }));
    }
  }, [profile]);

  // Load/save from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('vendor_onboarding');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setData(prev => ({ ...prev, ...parsed }));
        if (parsed._step) setCurrentStep(parsed._step);
      } catch {}
    }
  }, []);

  const saveProgress = useCallback(() => {
    localStorage.setItem('vendor_onboarding', JSON.stringify({ ...data, _step: currentStep }));
  }, [data, currentStep]);

  // Districts for selected province
  const districts = data.province ? DISTRICTS_BY_PROVINCE[data.province] || [] : [];

  // Validation
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!data.businessType) newErrors.businessType = 'Select your business type';
      if (!data.businessName.trim()) newErrors.businessName = 'Business name required';
      if (!data.price) newErrors.price = 'Price required';
      if (!data.province) newErrors.province = 'Province required';
      if (!data.district) newErrors.district = 'District required';
    } else if (step === 2) {
      if (!data.phone.trim()) newErrors.phone = 'Phone number required';
    } else if (step === 3) {
      if (!data.paymentMethod) newErrors.paymentMethod = 'Select payment method';
      if (!data.agreeToTerms) newErrors.agreeToTerms = 'You must accept the terms';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const goNext = () => {
    saveProgress();

    if (currentStep === 'welcome') {
      setCurrentStep(1);
    } else if (currentStep === 1 && validateStep(1)) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep(2)) {
      setCurrentStep(3);
    } else if (currentStep === 3 && validateStep(3)) {
      handleSubmit();
    }
  };

  const goBack = () => {
    if (currentStep === 1) setCurrentStep('welcome');
    else if (currentStep === 2) setCurrentStep(1);
    else if (currentStep === 3) setCurrentStep(2);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      if (user?.id) {
        const coverPhoto = data.coverPhoto || PLACEHOLDER_IMAGES[data.businessType as BusinessType] || PLACEHOLDER_IMAGES.other;

        // Create/update vendor record
        const vendorRecord = {
          user_id: user.id,
          business_name: data.businessName,
          business_type: data.businessType,
          location: data.city || data.district,
          district: data.district,
          description: data.description || `${data.businessName} - ${data.businessType} in ${data.district}`,
          phone: data.phone,
          email: profile?.email || '',
          status: 'approved', // INSTANT APPROVAL!
        };

        const { error: vendorError } = await supabase
          .from('vendors')
          .upsert(vendorRecord, { onConflict: 'user_id' });

        if (vendorError) throw vendorError;

        // Update profile
        await supabase
          .from('profiles')
          .update({ vendor_status: 'approved' })
          .eq('id', user.id);

        // Clear onboarding state
        localStorage.removeItem('vendor_onboarding');
        localStorage.setItem('vendor_onboarding_complete', 'true');

        setCurrentStep('success');
      }
    } catch (err: any) {
      console.error('Error saving vendor:', err);
      setErrors({ submit: err.message || 'Something went wrong. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Welcome Screen
  const renderWelcome = () => (
    <div className="text-center animate-fade-in">
      <div className="w-20 h-20 bg-forest-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <span className="text-4xl">🎉</span>
      </div>
      <h1 className="text-2xl font-display font-bold text-forest-700 mb-2">Welcome to Paila!</h1>
      <p className="text-stone-500 mb-6">
        Your business account is ready. Let's set up your listing in 2 minutes so travelers can find you.
      </p>

      <div className="bg-forest-50 rounded-xl p-4 mb-6 text-left">
        <p className="text-sm font-semibold text-forest-700 mb-3">Quick setup (3 steps):</p>
        <div className="space-y-2 text-sm text-forest-600">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-forest-200 text-forest-700 rounded-full flex items-center justify-center text-xs font-bold">1</span>
            <span>Business type, name, price & location</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-forest-200 text-forest-700 rounded-full flex items-center justify-center text-xs font-bold">2</span>
            <span>Photo, description & contact</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-forest-200 text-forest-700 rounded-full flex items-center justify-center text-xs font-bold">3</span>
            <span>Payment method & go live!</span>
          </div>
        </div>
      </div>

      <button onClick={goNext} className="btn-primary w-full py-3.5 text-base">
        Set Up My Business
        <ArrowRight className="w-5 h-5 ml-2 inline" />
      </button>

      {onSkip && (
        <button onClick={onSkip} className="text-sm text-stone-500 hover:text-forest-600 mt-4">
          Skip for now → Dashboard
        </button>
      )}
    </div>
  );

  // Step 1: The Basics
  const renderStep1 = () => (
    <div className="animate-fade-in">
      <div className="text-center mb-6">
        <p className="text-sm text-forest-600 font-medium mb-1">Step 1 of 3</p>
        <h2 className="text-xl font-display font-bold text-forest-700">The Basics</h2>
        <p className="text-sm text-stone-500">What do you offer?</p>
      </div>

      {/* Business Type */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-stone-700 mb-2">Business Type *</label>
        <div className="grid grid-cols-2 gap-2">
          {BUSINESS_TYPES.map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => setData({ ...data, businessType: type.id })}
              className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-left ${
                data.businessType === type.id
                  ? 'border-forest-500 bg-forest-50'
                  : 'border-stone-200 hover:border-forest-300'
              }`}
            >
              <span className="text-xl">{type.icon}</span>
              <span className="text-sm font-medium">{type.label}</span>
            </button>
          ))}
        </div>
        {errors.businessType && <p className="text-xs text-red-500 mt-1">{errors.businessType}</p>}
      </div>

      {/* Business Name */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-stone-700 mb-1">Business Name *</label>
        <input
          type="text"
          value={data.businessName}
          onChange={(e) => setData({ ...data, businessName: e.target.value })}
          placeholder="e.g. Nima Sherpa Trekking"
          className="input w-full"
        />
        {errors.businessName && <p className="text-xs text-red-500 mt-1">{errors.businessName}</p>}
      </div>

      {/* Price */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-stone-700 mb-1">Your Price *</label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 text-sm">NPR</span>
            <input
              type="number"
              value={data.price}
              onChange={(e) => setData({ ...data, price: e.target.value })}
              placeholder="3500"
              className="input w-full pl-14"
            />
          </div>
          <select
            value={data.priceUnit}
            onChange={(e) => setData({ ...data, priceUnit: e.target.value })}
            className="input w-28"
          >
            {PRICE_UNITS.map((u) => (
              <option key={u} value={u}>per {u}</option>
            ))}
          </select>
        </div>
        {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price}</p>}
      </div>

      {/* Location */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-stone-700 mb-1">Location *</label>
        <div className="grid grid-cols-2 gap-2">
          <select
            value={data.province}
            onChange={(e) => setData({ ...data, province: e.target.value, district: '' })}
            className="input"
          >
            <option value="">Province</option>
            {PROVINCES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <select
            value={data.district}
            onChange={(e) => setData({ ...data, district: e.target.value })}
            className="input"
            disabled={!data.province}
          >
            <option value="">District</option>
            {districts.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <input
          type="text"
          value={data.city}
          onChange={(e) => setData({ ...data, city: e.target.value })}
          placeholder="City/Village (optional)"
          className="input w-full mt-2"
        />
        {(errors.province || errors.district) && (
          <p className="text-xs text-red-500 mt-1">{errors.province || errors.district}</p>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-3 mt-8">
        <button onClick={goBack} className="btn-secondary flex-1 py-3">
          Back
        </button>
        <button onClick={goNext} className="btn-primary flex-1 py-3">
          Next
          <ArrowRight className="w-4 h-4 ml-1 inline" />
        </button>
      </div>
    </div>
  );

  // Step 2: Make it shine
  const renderStep2 = () => (
    <div className="animate-fade-in">
      <div className="text-center mb-6">
        <p className="text-sm text-forest-600 font-medium mb-1">Step 2 of 3</p>
        <h2 className="text-xl font-display font-bold text-forest-700">Make it Shine</h2>
        <p className="text-sm text-stone-500">Add photo & description</p>
      </div>

      {/* Cover Photo */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-stone-700 mb-2">Cover Photo</label>
        {data.coverPhoto ? (
          <div className="relative aspect-video rounded-xl overflow-hidden">
            <img src={data.coverPhoto} alt="Cover" className="w-full h-full object-cover" />
            <button
              onClick={() => setData({ ...data, coverPhoto: '' })}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <label className="block aspect-video rounded-xl border-2 border-dashed border-stone-300 cursor-pointer hover:border-forest-400 transition-colors">
            <div className="h-full flex flex-col items-center justify-center text-stone-400">
              <Upload className="w-8 h-8 mb-2" />
              <p className="text-sm">Add a photo</p>
              <p className="text-xs">or skip for now</p>
            </div>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    setData({ ...data, coverPhoto: reader.result as string });
                  };
                  reader.readAsDataURL(file);
                }
              }}
            />
          </label>
        )}
        <p className="text-xs text-stone-500 mt-1">A great photo gets 3x more views!</p>
      </div>

      {/* Description */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-stone-700 mb-1">About your service</label>
        <textarea
          value={data.description}
          onChange={(e) => setData({ ...data, description: e.target.value })}
          placeholder="Tell travelers what makes your service special..."
          rows={3}
          className="input w-full resize-none"
          maxLength={200}
        />
        <p className="text-xs text-stone-500 text-right">{data.description.length}/200</p>
      </div>

      {/* Phone */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-stone-700 mb-1">Contact Number *</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500">+977</span>
          <input
            type="tel"
            value={data.phone}
            onChange={(e) => setData({ ...data, phone: e.target.value })}
            placeholder="9812345678"
            className="input w-full pl-14"
          />
        </div>
        {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
      </div>

      {/* WhatsApp */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-stone-700 mb-1">WhatsApp (optional)</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500">+977</span>
          <input
            type="tel"
            value={data.whatsapp}
            onChange={(e) => setData({ ...data, whatsapp: e.target.value })}
            placeholder="9812345678"
            className="input w-full pl-14"
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-3 mt-8">
        <button onClick={goBack} className="btn-secondary flex-1 py-3">
          Back
        </button>
        <button onClick={goNext} className="btn-primary flex-1 py-3">
          Next
          <ArrowRight className="w-4 h-4 ml-1 inline" />
        </button>
      </div>
    </div>
  );

  // Step 3: Get Paid
  const renderStep3 = () => (
    <div className="animate-fade-in">
      <div className="text-center mb-6">
        <p className="text-sm text-forest-600 font-medium mb-1">Step 3 of 3</p>
        <h2 className="text-xl font-display font-bold text-forest-700">Get Paid</h2>
        <p className="text-sm text-stone-500">How do you receive payments?</p>
      </div>

      {/* Payment Methods */}
      <div className="mb-6 space-y-2">
        {[
          { id: 'esewa', icon: '📱', label: 'eSewa' },
          { id: 'khalti', icon: '💳', label: 'Khalti' },
          { id: 'cash', icon: '💵', label: 'Cash on arrival' },
        ].map((pm) => (
          <button
            key={pm.id}
            type="button"
            onClick={() => setData({ ...data, paymentMethod: pm.id as any })}
            className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
              data.paymentMethod === pm.id
                ? 'border-forest-500 bg-forest-50'
                : 'border-stone-200 hover:border-forest-300'
            }`}
          >
            <span className="text-2xl">{pm.icon}</span>
            <span className="font-medium">{pm.label}</span>
          </button>
        ))}
      </div>
      {errors.paymentMethod && <p className="text-xs text-red-500 mb-4">{errors.paymentMethod}</p>}

      {/* Payment ID */}
      {data.paymentMethod && data.paymentMethod !== 'cash' && (
        <div className="mb-4 animate-fade-in">
          <label className="block text-sm font-medium text-stone-700 mb-1">
            {data.paymentMethod === 'esewa' ? 'eSewa ID' : 'Khalti ID'} *
          </label>
          <input
            type="text"
            value={data.paymentId}
            onChange={(e) => setData({ ...data, paymentId: e.target.value })}
            placeholder={data.paymentMethod === 'esewa' ? '9812345678' : '9812345678'}
            className="input w-full"
          />
        </div>
      )}

      {/* Terms */}
      <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer ${
        errors.agreeToTerms ? 'border-red-300' : 'border-stone-200'
      }`}>
        <input
          type="checkbox"
          checked={data.agreeToTerms}
          onChange={(e) => setData({ ...data, agreeToTerms: e.target.checked })}
          className="mt-1 h-5 w-5 rounded border-stone-300 text-forest-600 focus:ring-forest-500"
        />
        <span className="text-sm text-stone-600">
          I agree to the <a href="#" className="text-forest-600 underline">Terms of Service</a> and{' '}
          <a href="#" className="text-forest-600 underline">Privacy Policy</a>. I confirm this information is accurate.
        </span>
      </label>
      {errors.agreeToTerms && <p className="text-xs text-red-500 mt-1">{errors.agreeToTerms}</p>}

      {/* Submit */}
      <div className="flex gap-3 mt-8">
        <button onClick={goBack} className="btn-secondary flex-1 py-3">
          Back
        </button>
        <button
          onClick={goNext}
          disabled={isSubmitting}
          className="btn-primary flex-1 py-3 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Publishing...
            </>
          ) : (
            <>
              <Rocket className="w-5 h-5" />
              Go Live Now!
            </>
          )}
        </button>
      </div>

      {errors.submit && (
        <p className="text-sm text-red-500 text-center mt-4">{errors.submit}</p>
      )}
    </div>
  );

  // Success Screen
  const renderSuccess = () => (
    <div className="text-center animate-fade-in py-4">
      <div className="w-20 h-20 bg-forest-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <Rocket className="w-10 h-10 text-forest-600" />
      </div>
      <h1 className="text-2xl font-display font-bold text-forest-700 mb-2">You're LIVE!</h1>
      <p className="text-stone-500 mb-6">
        <strong>{data.businessName}</strong> is now visible to thousands of travelers on Paila right now.
      </p>

      <div className="bg-forest-50 rounded-xl p-4 mb-6 text-left">
        <p className="text-sm font-semibold text-forest-700 mb-3">Your listing:</p>
        <div className="space-y-2 text-sm text-stone-700">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-forest-500" />
            <span>Visible on map</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-forest-500" />
            <span>Searchable by travelers</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-forest-500" />
            <span>Ready to receive bookings</span>
          </div>
        </div>
      </div>

      <button onClick={onComplete} className="btn-primary w-full py-3.5 text-base">
        Open My Dashboard
        <ArrowRight className="w-5 h-5 ml-2 inline" />
      </button>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 'welcome': return renderWelcome();
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 'success': return renderSuccess();
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 bg-white border-b border-stone-200 px-4 py-3 z-10">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-forest-700 rounded-lg flex items-center justify-center">
              <Mountain className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-forest-700">Paila</span>
          </div>
          {onSkip && currentStep !== 'success' && (
            <button onClick={onSkip} className="text-xs text-stone-500 hover:text-forest-600">
              Skip for now
            </button>
          )}
        </div>
      </header>

      {/* Progress bar */}
      {typeof currentStep === 'number' && (
        <div className="bg-white px-4 py-3 border-b border-stone-100">
          <div className="max-w-xl mx-auto flex items-center justify-center gap-3">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    step < currentStep
                      ? 'bg-forest-500 text-white'
                      : step === currentStep
                        ? 'bg-forest-500 text-white'
                        : 'bg-stone-200 text-stone-500'
                  }`}
                >
                  {step < currentStep ? <Check className="w-4 h-4" /> : step}
                </div>
                {step < 3 && (
                  <div className={`w-12 h-1 rounded-full transition-colors ${
                    step < currentStep ? 'bg-forest-500' : 'bg-stone-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <main className="flex-1 flex items-start justify-center px-4 py-6">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-card p-6">
          {renderStepContent()}
        </div>
      </main>
    </div>
  );
}
