import { useState, useEffect } from 'react';
import { X, Eye, EyeOff, Check, Mountain, Store, ArrowLeft, ArrowRight } from 'lucide-react';
import { useAuth, UserType, VendorSignUpData } from '../lib/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  mode: 'login' | 'register';
  onClose: () => void;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const BUSINESS_TYPES = [
  { value: 'guide', label: 'Licensed Guide', icon: '🧭' },
  { value: 'homestay', label: 'Homestay / Guesthouse', icon: '🏡' },
  { value: 'transport', label: 'Transport Service', icon: '🚌' },
  { value: 'cafe', label: 'Cafe / Restaurant', icon: '☕' },
  { value: 'hotel', label: 'Hotel / Lodge', icon: '🏨' },
  { value: 'tour_operator', label: 'Tour Operator', icon: '🎒' },
  { value: 'rental', label: 'Rental Service', icon: '🛍' },
  { value: 'other', label: 'Other', icon: '🌿' },
];

const QUOTES = [
  { text: 'The mountains are calling and I must go.', author: 'John Muir' },
  { text: 'Not all those who wander are lost.', author: 'J.R.R. Tolkien' },
  { text: "Nepal is not just a place. It's a feeling.", author: 'Unknown traveler' },
  { text: 'The best view comes after the hardest climb.', author: 'Unknown' },
  { text: 'Climb the mountain so you can see the world.', author: 'David McCullough Jr.' },
];

type AuthStep = 'select-type' | 'auth-form' | 'forgot-password' | 'success-traveler' | 'pending-vendor';
type FormMode = 'login' | 'register';

export default function AuthModal({ isOpen, mode, onClose, showToast }: AuthModalProps) {
  const { signIn, signUp, signUpVendor, resetPassword } = useAuth();
  const [selectedUserType, setSelectedUserType] = useState<UserType>(null);
  const [activeTab, setActiveTab] = useState<FormMode>(mode);
  const [currentStep, setCurrentStep] = useState<AuthStep>('select-type');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentQuote, setCurrentQuote] = useState(0);
  const [successName, setSuccessName] = useState('');

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Traveler form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Vendor form fields
  const [vBusinessName, setVBusinessName] = useState('');
  const [vBusinessType, setVBusinessType] = useState('');
  const [vLocation, setVLocation] = useState('');
  const [vDistrict, setVDistrict] = useState('');
  const [vDescription, setVDescription] = useState('');

  // Field errors for real-time validation
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Rotate quotes
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % QUOTES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep('select-type');
      setSelectedUserType(null);
      setActiveTab(mode);
      resetAllForms();
    }
  }, [isOpen, mode]);

  const resetAllForms = () => {
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setPhone('');
    setAgreeToTerms(false);
    setRememberMe(false);
    setVBusinessName('');
    setVBusinessType('');
    setVLocation('');
    setVDistrict('');
    setVDescription('');
    setError(null);
    setFieldErrors({});
  };

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (pwd: string) => pwd.length >= 8 && /\d/.test(pwd);
  const validatePhone = (ph: string) => !ph || /^\+?[\d\s-]{10,}$/.test(ph);

  const getPasswordStrength = (pwd: string): { level: string; color: string; width: string } => {
    if (pwd.length < 6) return { level: 'Weak', color: 'bg-red-500', width: 'w-1/3' };
    if (pwd.length < 8 || !/\d/.test(pwd)) return { level: 'Weak', color: 'bg-red-500', width: 'w-1/3' };
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) return { level: 'Fair', color: 'bg-orange-500', width: 'w-2/3' };
    return { level: 'Strong', color: 'bg-green-500', width: 'w-full' };
  };

  const validateField = (field: string, value: string): string | null => {
    switch (field) {
      case 'name':
        return value.length < 2 ? 'Name must be at least 2 characters' : null;
      case 'email':
        return !validateEmail(value) ? 'Please enter a valid email address' : null;
      case 'password':
        if (activeTab === 'register' && selectedUserType === 'traveler') {
          return !validatePassword(value) ? 'Password must be 8+ chars with at least 1 number' : null;
        }
        return value.length < 6 ? 'Password is required' : null;
      case 'confirmPassword':
        return value !== password ? 'Passwords do not match' : null;
      case 'phone':
        return !validatePhone(value) ? 'Please enter a valid phone number' : null;
      case 'vBusinessName':
        return value.length < 3 ? 'Business name must be at least 3 characters' : null;
      case 'vLocation':
        return value.length < 2 ? 'Location is required' : null;
      case 'vDescription':
        return value.length < 20 ? 'Description must be at least 20 characters' : null;
      default:
        return null;
    }
  };

  const handleBlur = (field: string, value: string) => {
    const err = validateField(field, value);
    setFieldErrors((prev) => ({ ...prev, [field]: err || '' }));
  };

  const handleInputChange = (field: string, value: string) => {
    if (fieldErrors[field]) {
      const err = validateField(field, value);
      setFieldErrors((prev) => ({ ...prev, [field]: err || '' }));
    }
  };

  const handleUserTypeSelect = (type: UserType) => {
    setSelectedUserType(type);
    setTimeout(() => setCurrentStep('auth-form'), 300);
  };

  const handleBack = () => {
    if (currentStep === 'auth-form') {
      setCurrentStep('select-type');
      setSelectedUserType(null);
    } else if (currentStep === 'forgot-password') {
      setCurrentStep('auth-form');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate all fields
    const errors: Record<string, string> = {};

    if (activeTab === 'register') {
      const nameErr = validateField('name', name);
      if (nameErr) errors.name = nameErr;
    }

    if (!validateEmail(email)) errors.email = 'Please enter a valid email address';

    if (activeTab === 'register') {
      if (!validatePassword(password)) errors.password = 'Password must be 8+ chars with at least 1 number';
      if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match';
    }

    if (activeTab === 'register' && !agreeToTerms) {
      errors.terms = 'You must agree to the terms';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);

    try {
      if (currentStep === 'forgot-password') {
        const { error: resetError } = await resetPassword(email);
        if (resetError) throw resetError;
        showToast('Reset link sent! Check your email.', 'success');
        setCurrentStep('auth-form');
        return;
      }

      if (activeTab === 'login') {
        const { error: signInError } = await signIn(email, password);
        if (signInError) throw signInError;
        showToast('Welcome back! Ready to explore Nepal.', 'success');
        onClose();
      } else if (selectedUserType === 'traveler') {
        const { error: signUpError, needsConfirmation } = await signUp(name, email, password, 'traveler', phone || undefined);
        if (signUpError) throw signUpError;
        setSuccessName(name);
        if (needsConfirmation) {
          setCurrentStep('success-traveler');
        } else {
          showToast('Account created! Welcome to Paila.', 'success');
          onClose();
        }
      } else if (selectedUserType === 'vendor') {
        // Simple vendor signup - just auth, onboarding will collect the rest
        const { error: signUpError, needsConfirmation } = await signUp(name, email, password, 'vendor');
        if (signUpError) throw signUpError;
        setSuccessName(name);
        if (needsConfirmation) {
          setCurrentStep('pending-vendor');
        } else {
          showToast('Account created! Welcome to Paila.', 'success');
          onClose();
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      // Provide more helpful error messages
      if (err.message?.includes('Invalid login credentials')) {
        setError('Wrong email or password. If you just signed up, check your email for a confirmation link.');
      } else if (err.message?.includes('already registered')) {
        setError('An account with this email already exists. Try logging in instead.');
      } else {
        setError(err.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const NEPAL_BG = 'https://images.unsplash.com/photo-1516982914291-e6262ba9e02b?auto=format&fit=crop&w=1200&q=80';
  const pwdStrength = getPasswordStrength(password);

  // Input style helper
  const inputClass = (field: string) =>
    `input ${fieldErrors[field] ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`;

  const renderLeftPanel = () => (
    <div className="hidden lg:flex lg:w-[45%] relative">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${NEPAL_BG})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-forest-900/80 via-forest-800/70 to-forest-900/90" />

      {/* Logo */}
      <div className="absolute top-8 left-8 flex items-center gap-3 z-10">
        <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
          <Mountain className="w-6 h-6 text-white" />
        </div>
        <span className="text-white font-display text-2xl font-bold tracking-tight">Paila</span>
      </div>

      {/* Center content */}
      <div className="relative z-10 flex flex-col justify-center items-center h-full px-12 text-center">
        <h2 className="text-white font-display text-4xl font-bold mb-4">Walk with confidence.</h2>
        <p className="text-white/80 text-lg max-w-md">
          Nepal's #1 travel companion for explorers and local businesses.
        </p>
      </div>

      {/* Bottom quote */}
      <div className="absolute bottom-8 left-0 right-0 text-center px-8 z-10">
        <p className="text-white/60 text-sm italic transition-opacity duration-500">
          "{QUOTES[currentQuote].text}"
        </p>
        <p className="text-white/40 text-xs mt-1">— {QUOTES[currentQuote].author}</p>
      </div>
    </div>
  );

  const renderUserTypeSelector = () => (
    <div className="animate-fade-in">
      <h2 className="font-display text-2xl font-bold text-forest-700 text-center mb-2">I am a...</h2>
      <p className="text-stone-500 text-sm text-center mb-6">Choose how you want to use Paila</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {/* Traveler card */}
        <button
          onClick={() => handleUserTypeSelect('traveler')}
          className={`group relative p-6 rounded-2xl border-2 transition-all duration-200 text-left hover:shadow-lg ${
            selectedUserType === 'traveler'
              ? 'border-forest-500 bg-forest-50 shadow-md'
              : 'border-stone-200 hover:border-forest-300 bg-white'
          }`}
        >
          {selectedUserType === 'traveler' && (
            <div className="absolute top-3 right-3 w-6 h-6 bg-forest-500 rounded-full flex items-center justify-center">
              <Check className="w-4 h-4 text-white" />
            </div>
          )}
          <div className="w-12 h-12 rounded-xl bg-forest-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Mountain className="w-6 h-6 text-forest-600" />
          </div>
          <h3 className="font-display text-lg font-bold text-forest-700 mb-1">Traveler</h3>
          <p className="text-stone-500 text-sm mb-3">
            Explore hidden gems, plan safe trips, discover Nepal
          </p>
          <span className="inline-block px-3 py-1 bg-forest-100 text-forest-600 text-xs font-semibold rounded-full">
            Free forever
          </span>
        </button>

        {/* Business/Vendor card */}
        <button
          onClick={() => handleUserTypeSelect('vendor')}
          className={`group relative p-6 rounded-2xl border-2 transition-all duration-200 text-left hover:shadow-lg ${
            selectedUserType === 'vendor'
              ? 'border-forest-500 bg-forest-50 shadow-md'
              : 'border-stone-200 hover:border-forest-300 bg-white'
          }`}
        >
          {selectedUserType === 'vendor' && (
            <div className="absolute top-3 right-3 w-6 h-6 bg-forest-500 rounded-full flex items-center justify-center">
              <Check className="w-4 h-4 text-white" />
            </div>
          )}
          <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Store className="w-6 h-6 text-orange-600" />
          </div>
          <h3 className="font-display text-lg font-bold text-forest-700 mb-1">Business / Vendor</h3>
          <p className="text-stone-500 text-sm mb-3">
            List your guides, homestays, transport, or cafe
          </p>
          <span className="inline-block px-3 py-1 bg-orange-100 text-orange-600 text-xs font-semibold rounded-full">
            Grow your bookings
          </span>
        </button>
      </div>
    </div>
  );

  const renderAuthForm = () => (
    <div className="animate-fade-in">
      {/* Back button */}
      <button
        onClick={handleBack}
        className="flex items-center gap-2 text-stone-500 hover:text-forest-600 text-sm mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* Mobile logo */}
      <div className="lg:hidden flex items-center gap-3 mb-6">
        <div className="w-8 h-8 bg-forest-700 rounded-lg flex items-center justify-center">
          <Mountain className="w-5 h-5 text-white" />
        </div>
        <span className="font-display text-xl font-bold text-forest-700">Paila</span>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => {
            setActiveTab('login');
            setError(null);
            setFieldErrors({});
          }}
          className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all ${
            activeTab === 'login'
              ? 'bg-forest-600 text-white shadow-md'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          Sign In
        </button>
        <button
          onClick={() => {
            setActiveTab('register');
            setError(null);
            setFieldErrors({});
          }}
          className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all ${
            activeTab === 'register'
              ? 'bg-forest-600 text-white shadow-md'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          Create Account
        </button>
      </div>

      {/* User type indicator */}
      <div className="flex items-center gap-2 mb-4 p-3 bg-stone-50 rounded-lg">
        {selectedUserType === 'traveler' ? (
          <>
            <Mountain className="w-4 h-4 text-forest-600" />
            <span className="text-sm text-stone-600">Signing up as <strong>Traveler</strong></span>
          </>
        ) : (
          <>
            <Store className="w-4 h-4 text-orange-600" />
            <span className="text-sm text-stone-600">Signing up as <strong>Business / Vendor</strong></span>
          </>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {activeTab === 'register' && (
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">
              {selectedUserType === 'vendor' ? 'Owner / Contact Name' : 'Full Name'} *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); handleInputChange('name', e.target.value); }}
              onBlur={() => handleBlur('name', name)}
              className={inputClass('name')}
              placeholder={selectedUserType === 'vendor' ? 'Your full name' : 'Enter your name'}
              required
            />
            {fieldErrors.name && <p className="text-red-500 text-xs mt-1">{fieldErrors.name}</p>}
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-2">Email Address *</label>
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); handleInputChange('email', e.target.value); }}
            onBlur={() => handleBlur('email', email)}
            className={inputClass('email')}
            placeholder="you@example.com"
            required
          />
          {fieldErrors.email && <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-2">Password *</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => { setPassword(e.target.value); handleInputChange('password', e.target.value); }}
              onBlur={() => handleBlur('password', password)}
              className={`${inputClass('password')} pr-12`}
              placeholder={activeTab === 'login' ? 'Enter your password' : 'Create a password (8+ chars)'}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {fieldErrors.password && <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>}
          {activeTab === 'register' && password && (
            <div className="mt-2">
              <div className="flex gap-1 h-1.5">
                <div className={`h-full rounded-full transition-all ${pwdStrength.width} ${pwdStrength.color}`}></div>
              </div>
              <p className={`text-xs mt-1 ${pwdStrength.level === 'Strong' ? 'text-green-600' : pwdStrength.level === 'Fair' ? 'text-orange-600' : 'text-red-600'}`}>
                {pwdStrength.level}
              </p>
            </div>
          )}
        </div>

        {activeTab === 'register' && (
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">Confirm Password *</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); handleInputChange('confirmPassword', e.target.value); }}
                onBlur={() => handleBlur('confirmPassword', confirmPassword)}
                className={`${inputClass('confirmPassword')} pr-12`}
                placeholder="Confirm your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {fieldErrors.confirmPassword && <p className="text-red-500 text-xs mt-1">{fieldErrors.confirmPassword}</p>}
          </div>
        )}

        {activeTab === 'register' && selectedUserType === 'traveler' && (
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">Phone Number (optional)</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => { setPhone(e.target.value); handleInputChange('phone', e.target.value); }}
              onBlur={() => handleBlur('phone', phone)}
              className={inputClass('phone')}
              placeholder="+977 98XXXXXXXX"
            />
            {fieldErrors.phone && <p className="text-red-500 text-xs mt-1">{fieldErrors.phone}</p>}
          </div>
        )}

        {activeTab === 'register' && selectedUserType === 'vendor' && (
          <div className="bg-forest-50 rounded-lg p-3 text-sm text-forest-700">
            <p className="font-medium">After signup, you'll complete your business profile with:</p>
            <ul className="mt-2 space-y-1 text-forest-600">
              <li>• Business type & name</li>
              <li>• Photos & description</li>
              <li>• Pricing & availability</li>
              <li>• Location & contact details</li>
            </ul>
          </div>
        )}

        {activeTab === 'login' && (
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-stone-300 text-forest-600 focus:ring-forest-500"
              />
              <span className="text-sm text-stone-600">Remember me</span>
            </label>
            <button
              type="button"
              onClick={() => setCurrentStep('forgot-password')}
              className="text-sm text-forest-600 hover:text-forest-700 hover:underline"
            >
              Forgot password?
            </button>
          </div>
        )}

        {activeTab === 'register' && (
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={agreeToTerms}
              onChange={(e) => { setAgreeToTerms(e.target.checked); setFieldErrors(prev => ({ ...prev, terms: '' })); }}
              className="w-4 h-4 mt-0.5 rounded border-stone-300 text-forest-600 focus:ring-forest-500"
            />
            <span className="text-sm text-stone-600">
              I agree to the{' '}
              <a href="#" className="text-forest-600 hover:underline">Terms of Service</a>
              {selectedUserType === 'vendor' && (
                <> and <a href="#" className="text-forest-600 hover:underline">Vendor Agreement</a></>
              )}
            </span>
          </label>
        )}
        {fieldErrors.terms && <p className="text-red-500 text-xs">{fieldErrors.terms}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full btn-primary py-3.5 text-base disabled:opacity-50 disabled:cursor-not-allowed mt-6"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {activeTab === 'login' ? 'Signing in...' : 'Creating account...'}
            </span>
          ) : activeTab === 'login' ? (
            'Sign In'
          ) : selectedUserType === 'vendor' ? (
            'Create Account & Continue'
          ) : (
            'Create Account'
          )}
        </button>
      </form>

      {/* Social auth for travelers */}
      {selectedUserType === 'traveler' && activeTab === 'register' && (
        <>
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-stone-200" />
            <span className="text-sm text-stone-400">or continue with</span>
            <div className="flex-1 h-px bg-stone-200" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              className="flex items-center justify-center gap-2 py-3 px-4 border border-stone-200 rounded-xl hover:bg-stone-50 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="text-sm font-medium text-stone-700">Google</span>
            </button>
            <button
              type="button"
              className="flex items-center justify-center gap-2 py-3 px-4 border border-stone-200 rounded-xl hover:bg-stone-50 transition-colors"
            >
              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span className="text-sm font-medium text-stone-700">Facebook</span>
            </button>
          </div>
        </>
      )}

      {selectedUserType === 'vendor' && activeTab === 'register' && (
        <p className="text-xs text-stone-500 text-center mt-4">
          Your account will be reviewed and approved within 24-48 hours. You'll receive an email confirmation once approved.
        </p>
      )}
    </div>
  );

  const renderForgotPassword = () => (
    <div className="animate-fade-in">
      <button
        onClick={handleBack}
        className="flex items-center gap-2 text-stone-500 hover:text-forest-600 text-sm mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Sign In
      </button>

      <h2 className="font-display text-2xl font-bold text-forest-700 mb-2">Forgot your password?</h2>
      <p className="text-stone-500 text-sm mb-6">Enter your email and we'll send you a reset link.</p>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-2">Email Address *</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            placeholder="you@example.com"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full btn-primary py-3.5 text-base disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Sending...
            </span>
          ) : (
            'Send Reset Link'
          )}
        </button>
      </form>
    </div>
  );

  const renderSuccessTraveler = () => (
    <div className="text-center animate-fade-in py-8">
      <div className="w-20 h-20 bg-forest-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <span className="text-4xl">🎉</span>
      </div>
      <h2 className="font-display text-2xl font-bold text-forest-700 mb-2">Welcome to Paila, {successName}!</h2>
      <p className="text-stone-500 mb-6">Your account has been created. Check your email inbox to confirm your account, then you can log in.</p>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-left">
        <p className="text-sm text-amber-800">
          <strong>Check your email</strong> — we sent a confirmation link to <strong>{email}</strong>. Click the link to activate your account.
        </p>
      </div>

      <button
        onClick={() => {
          setCurrentStep('auth-form');
          setActiveTab('login');
        }}
        className="btn-primary px-8 py-3"
      >
        I Confirmed My Email - Sign In
      </button>
    </div>
  );

  const renderPendingVendor = () => (
    <div className="text-center animate-fade-in py-6">
      <div className="w-20 h-20 bg-forest-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <span className="text-4xl">🎉</span>
      </div>
      <h2 className="font-display text-2xl font-bold text-forest-700 mb-2">Account Created!</h2>
      <p className="text-stone-500 mb-4">Welcome, <strong>{successName}</strong>!</p>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-left">
        <p className="text-sm text-amber-800">
          <strong>Check your email</strong> — we sent a confirmation link to <strong>{email}</strong>. Click the link to activate your account.
        </p>
      </div>

      <p className="text-stone-500 text-sm mb-6">
        After confirming your email, you'll set up your business profile.
      </p>

      <div className="bg-forest-50 rounded-xl p-4 mb-6 text-left">
        <p className="text-sm font-semibold text-forest-700 mb-3">You'll set up:</p>
        <ul className="text-sm text-forest-600 space-y-2">
          <li className="flex items-center gap-2">
            <Check className="w-4 h-4 text-forest-500" />
            <span>Business type & name</span>
          </li>
          <li className="flex items-center gap-2">
            <Check className="w-4 h-4 text-forest-500" />
            <span>Photos & description</span>
          </li>
          <li className="flex items-center gap-2">
            <Check className="w-4 h-4 text-forest-500" />
            <span>Pricing & availability</span>
          </li>
          <li className="flex items-center gap-2">
            <Check className="w-4 h-4 text-forest-500" />
            <span>Location & contact info</span>
          </li>
        </ul>
      </div>

      <button
        onClick={() => {
          setCurrentStep('auth-form');
          setActiveTab('login');
        }}
        className="btn-primary px-8 py-3"
      >
        I Confirmed My Email - Sign In
        <ArrowRight className="w-5 h-5 ml-2 inline" />
      </button>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex bg-white lg:bg-stone-900/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {renderLeftPanel()}

      {/* Right panel */}
      <div className={`flex-1 lg:w-[55%] flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-y-auto ${currentStep === 'select-type' ? 'bg-stone-50' : 'bg-white lg:bg-white'}`}>
        <div className="w-full max-w-md">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 lg:top-6 lg:right-6 text-stone-400 hover:text-stone-600 transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>

          {currentStep === 'select-type' && renderUserTypeSelector()}
          {currentStep === 'auth-form' && renderAuthForm()}
          {currentStep === 'forgot-password' && renderForgotPassword()}
          {currentStep === 'success-traveler' && renderSuccessTraveler()}
          {currentStep === 'pending-vendor' && renderPendingVendor()}
        </div>
      </div>
    </div>
  );
}
