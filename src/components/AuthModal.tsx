import { useState, useEffect } from 'react';
import { X, Eye, EyeOff, Mountain, ArrowLeft, ArrowRight, Loader2, Shield, Phone, Mail, AlertCircle, CheckCircle, User, Globe2, Languages } from 'lucide-react';
import { useAuth, SignUpData } from '../lib/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  mode: 'login' | 'register';
  onClose: () => void;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

type AuthScreen =
  | 'main'
  | 'register'
  | 'login'
  | 'forgot-password'
  | 'reset-sent'
  | 'verification-sent'
  | 'loading';

const QUOTES = [
  { text: "The mountains are calling and I must go.", author: "John Muir" },
  { text: "In every walk with nature, one receives far more than he seeks.", author: "John Muir" },
  { text: "The journey of a thousand miles begins with a single step.", author: "Lao Tzu" },
  { text: "Life is either a daring adventure or nothing at all.", author: "Helen Keller" },
  { text: "The world is a book and those who do not travel read only one page.", author: "Saint Augustine" },
];

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

export default function AuthModal({ isOpen, mode, onClose, showToast }: AuthModalProps) {
  const { signIn, signInWithGoogle, signUp, resetPassword } = useAuth();

  const [screen, setScreen] = useState<AuthScreen>('main');
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [resendTimer, setResendTimer] = useState(0);
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  // Registration fields
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [nationality, setNationality] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('en');

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) return;
    setScreen(mode === 'register' ? 'register' : 'main');
    resetAllForms();
  }, [isOpen, mode]);

  useEffect(() => {
    if (screen !== 'main') return;
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % QUOTES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [screen]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => setResendTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  useEffect(() => {
    if (lockedUntil && Date.now() < lockedUntil) {
      const interval = setInterval(() => {
        if (lockedUntil && Date.now() >= lockedUntil) {
          setLockedUntil(null);
          setLoginAttempts(0);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [lockedUntil]);

  const resetAllForms = () => {
    setName('');
    setUsername('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setPhone('');
    setCountry('');
    setNationality('');
    setPreferredLanguage('en');
    setAgreeToTerms(false);
    setError(null);
    setSuccessMessage(null);
    setFieldErrors({});
    setLoading(false);
    setResendTimer(0);
  };

  const showLoadingScreen = (message: string) => {
    setLoadingMessage(message);
    setScreen('loading');
  };

  const validateField = (field: string, value: string): string | null => {
    switch (field) {
      case 'name':
        if (!value.trim()) return 'Please enter your full name';
        if (value.trim().length < 2) return 'Name must be at least 2 characters';
        return null;
      case 'username':
        if (value && value.trim().length < 3) return 'Username must be at least 3 characters';
        if (value && !/^[a-zA-Z0-9_]+$/.test(value)) return 'Username can only contain letters, numbers, and underscores';
        return null;
      case 'email':
        if (!value.trim()) return 'Please enter your email';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email address';
        return null;
      case 'password':
        if (!value) return 'Please enter a password';
        if (value.length < 8) return 'Password must be at least 8 characters';
        if (!/[a-z]/.test(value)) return 'Include at least one lowercase letter';
        if (!/[A-Z]/.test(value)) return 'Include at least one uppercase letter';
        if (!/\d/.test(value)) return 'Include at least one number';
        return null;
      case 'confirmPassword':
        if (!value) return 'Please confirm your password';
        if (value !== password) return 'Passwords do not match';
        return null;
      case 'phone':
        if (!value.trim()) return 'Please enter your phone number';
        if (!/^[0-9+]{10,15}$/.test(value.replace(/\s/g, ''))) return 'Please enter a valid phone number (10-15 digits)';
        return null;
      case 'country':
        if (!value) return 'Please select your country';
        return null;
      case 'nationality':
        if (!value) return 'Please select your nationality';
        return null;
      default:
        return null;
    }
  };

  const handleInputChange = (field: string, value: string) => {
    switch (field) {
      case 'name': setName(value); break;
      case 'username': setUsername(value); break;
      case 'email': setEmail(value); break;
      case 'password': setPassword(value); break;
      case 'confirmPassword': setConfirmPassword(value); break;
      case 'phone': setPhone(value); break;
      case 'country': setCountry(value); break;
      case 'nationality': setNationality(value); break;
      case 'preferredLanguage': setPreferredLanguage(value); break;
    }
    if (fieldErrors[field]) {
      const err = validateField(field, value);
      setFieldErrors((prev) => ({ ...prev, [field]: err || '' }));
    }
  };

  const validatePasswordStrength = (pwd: string): { score: number; label: string; color: string; width: string } => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) score++;

    const levels = [
      { label: 'Very Weak', color: 'bg-red-500', width: 'w-1/6' },
      { label: 'Weak', color: 'bg-orange-500', width: 'w-2/6' },
      { label: 'Fair', color: 'bg-yellow-500', width: 'w-3/6' },
      { label: 'Good', color: 'bg-lime-500', width: 'w-4/6' },
      { label: 'Strong', color: 'bg-green-500', width: 'w-5/6' },
      { label: 'Very Strong', color: 'bg-emerald-600', width: 'w-full' },
    ];
    return { score, ...levels[Math.min(score, 5)] };
  };

  const isLocked = lockedUntil && Date.now() < lockedUntil;

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const errors: Record<string, string> = {};
    const fields: Record<string, string> = { name, email, password, confirmPassword, phone, country, nationality };
    Object.entries(fields).forEach(([f, value]) => {
      const err = validateField(f, value);
      if (err) errors[f] = err;
    });

    // Validate optional username only if provided
    const usernameErr = validateField('username', username);
    if (usernameErr) errors.username = usernameErr;

    if (!agreeToTerms) {
      errors.terms = 'You must agree to the Terms and Privacy Policy to continue';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    showLoadingScreen('Creating your account...');
    setLoading(true);

    try {
      const signUpData: SignUpData = {
        name,
        username: username || undefined,
        email,
        password,
        phone,
        userType: 'traveler',
        country,
        nationality,
        preferredLanguage,
      };

      const { error: signUpError, needsConfirmation } = await signUp(signUpData);

      if (signUpError) throw signUpError;

      if (needsConfirmation) {
        setSuccessMessage('Verification email sent!');
        setScreen('verification-sent');
      } else {
        showToast(`Welcome to Paila, ${name.split(' ')[0]}!`, 'success');
        onClose();
      }
    } catch (err: any) {
      setScreen('register');
      const msg = err.message || '';
      if (msg.includes('already registered') || msg.includes('already been registered') || msg.includes('User already registered')) {
        setError('An account with this email already exists. Try logging in instead.');
      } else if (msg.includes('username')) {
        setError('That username is already taken. Please choose another.');
      } else {
        setError(msg || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLocked) {
      const remaining = Math.ceil((lockedUntil! - Date.now()) / 60000);
      setError(`Too many failed attempts. Try again in ${remaining} minute${remaining > 1 ? 's' : ''}.`);
      return;
    }

    setError(null);

    const errors: Record<string, string> = {};
    const emailErr = validateField('email', email);
    if (emailErr) errors.email = emailErr;
    if (!password) errors.password = 'Please enter your password';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    showLoadingScreen('Signing you in...');
    setLoading(true);

    try {
      const { error: signInError } = await signIn(email, password);
      if (signInError) throw signInError;

      setLoginAttempts(0);
      showToast('Welcome back!', 'success');
      onClose();
    } catch (err: any) {
      setScreen('login');
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);

      if (newAttempts >= 5) {
        const lockTime = Date.now() + 15 * 60 * 1000;
        setLockedUntil(lockTime);
        setError('Too many failed attempts. Account locked for 15 minutes.');
      } else {
        const msg = err.message || '';
        if (msg.includes('Invalid email or password') || msg.includes('Invalid login credentials')) {
          setError(`Wrong password. ${5 - newAttempts} attempt${5 - newAttempts > 1 ? 's' : ''} remaining.`);
        } else if (msg.includes('Email not confirmed')) {
          setError('Please verify your email before signing in.');
        } else {
          setError(msg || 'Something went wrong. Please try again.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const emailErr = validateField('email', email);
    if (emailErr) {
      setFieldErrors({ email: emailErr });
      return;
    }

    showLoadingScreen('Sending reset link...');
    setLoading(true);

    try {
      const { error: resetError } = await resetPassword(email);
      if (resetError) throw resetError;
      setScreen('reset-sent');
    } catch (err: any) {
      setScreen('forgot-password');
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const NEPAL_BG = 'https://images.pexels.com/photos/4194617/pexels-photo-4194617.jpeg?auto=compress&cs=tinysrgb&w=1200';

  const inputClass = (field: string) =>
    `w-full px-4 py-3 rounded-xl border-2 ${fieldErrors[field] ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : 'border-stone-200 focus:border-forest-500 focus:ring-forest-100'} focus:outline-none focus:ring-4 transition-all text-stone-800 bg-white`;

  const selectClass = (field: string) =>
    `w-full px-4 py-3 rounded-xl border-2 ${fieldErrors[field] ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : 'border-stone-200 focus:border-forest-500 focus:ring-forest-100'} focus:outline-none focus:ring-4 transition-all text-stone-800 bg-white appearance-none cursor-pointer`;

  const renderLoading = () => (
    <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
      <div className="w-16 h-16 bg-forest-700 rounded-2xl flex items-center justify-center mb-4 animate-pulse">
        <Mountain className="w-8 h-8 text-white" />
      </div>
      <div className="font-display text-2xl font-bold text-forest-700 mb-2">Paila</div>
      <p className="text-stone-500 text-sm text-center max-w-xs mb-6">{loadingMessage}</p>
      <div className="w-48 h-1.5 bg-stone-200 rounded-full overflow-hidden">
        <div className="h-full bg-forest-600 rounded-full animate-[progress_1.5s_ease_infinite]" />
      </div>
    </div>
  );

  const renderLeftPanel = () => (
    <div className="hidden md:block w-[45%] relative overflow-hidden rounded-l-3xl">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${NEPAL_BG})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-forest-900/60 via-forest-800/40 to-stone-900/70" />

      <div className="relative h-full flex flex-col justify-between p-8">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
              <Mountain className="w-6 h-6 text-white" />
            </div>
            <span className="font-display text-2xl font-bold text-white">Paila</span>
          </div>
        </div>

        <div className="animate-fade-in">
          <blockquote className="text-white text-xl font-medium leading-relaxed mb-4 transition-all duration-500">
            "{QUOTES[quoteIndex].text}"
          </blockquote>
          <p className="text-white/70 text-sm">— {QUOTES[quoteIndex].author}</p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 text-white/90">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span className="text-sm">Trusted by Nepal travelers</span>
          </div>
          <div className="flex items-center gap-3 text-white/90">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span className="text-sm">Verified guides & homestays</span>
          </div>
          <div className="flex items-center gap-3 text-white/90">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span className="text-sm">Safe & secure booking</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMain = () => (
    <div className="animate-fade-in">
      <div className="flex flex-col items-center mb-8">
        <div className="md:hidden w-14 h-14 bg-forest-700 rounded-2xl flex items-center justify-center mb-3">
          <Mountain className="w-8 h-8 text-white" />
        </div>
        <h1 className="font-display text-3xl font-bold text-forest-700">Welcome to Paila</h1>
        <p className="text-stone-500 text-sm mt-1">Your Nepal journey starts here</p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-3 mb-6">
        <button onClick={() => { resetAllForms(); setScreen('register'); }} className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-xl bg-forest-600 hover:bg-forest-700 transition-all font-semibold text-white">
          <Mail className="w-5 h-5" />
          Create an account
        </button>

        <button onClick={() => { resetAllForms(); setScreen('login'); }} className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-xl bg-white border-2 border-stone-200 hover:border-stone-300 hover:bg-stone-50 transition-all font-semibold text-stone-700">
          <Shield className="w-5 h-5" />
          Sign in
        </button>

        <div className="flex items-center gap-3 py-2">
          <div className="flex-1 h-px bg-stone-200" />
          <span className="text-xs text-stone-400">or</span>
          <div className="flex-1 h-px bg-stone-200" />
        </div>

        <button onClick={() => signInWithGoogle()} className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-xl bg-white border-2 border-stone-200 hover:border-stone-300 hover:bg-stone-50 transition-all font-semibold text-stone-700">
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>
      </div>

      <p className="text-center text-xs text-stone-400 mt-6">
        By continuing, you agree to Paila's Terms of Service and Privacy Policy.
      </p>
    </div>
  );

  const renderRegister = () => (
    <div className="animate-fade-in">
      <button onClick={() => setScreen('main')} className="flex items-center gap-2 text-stone-500 hover:text-forest-600 text-sm mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-forest-100 flex items-center justify-center">
          <Mail className="w-5 h-5 text-forest-600" />
        </div>
        <div>
          <h2 className="font-display text-xl font-bold text-forest-700">Create your account</h2>
          <p className="text-stone-500 text-sm">Join the Paila community</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <form onSubmit={handleEmailRegister} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-1.5">Full Name *</label>
          <input type="text" value={name} onChange={(e) => handleInputChange('name', e.target.value)} className={inputClass('name')} placeholder="Your full name" autoFocus />
          {fieldErrors.name && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{fieldErrors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-1.5">Username <span className="text-stone-400 font-normal">(optional)</span></label>
          <input type="text" value={username} onChange={(e) => handleInputChange('username', e.target.value)} className={inputClass('username')} placeholder="Choose a unique username" />
          {fieldErrors.username && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{fieldErrors.username}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-1.5">Email Address *</label>
          <input type="email" value={email} onChange={(e) => handleInputChange('email', e.target.value)} className={inputClass('email')} placeholder="you@example.com" />
          {fieldErrors.email && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{fieldErrors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-1.5">Password *</label>
          <div className="relative">
            <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => handleInputChange('password', e.target.value)} className={`${inputClass('password')} pr-12`} placeholder="Create a strong password" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {password && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-stone-500">Password strength</span>
                <span className={`font-medium ${validatePasswordStrength(password).color.replace('bg-', 'text-')}`}>{validatePasswordStrength(password).label}</span>
              </div>
              <div className="h-1.5 bg-stone-200 rounded-full overflow-hidden">
                <div className={`h-full ${validatePasswordStrength(password).color} rounded-full transition-all duration-300 ${validatePasswordStrength(password).width}`} />
              </div>
            </div>
          )}
          {fieldErrors.password && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{fieldErrors.password}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-1.5">Confirm Password *</label>
          <input type="password" value={confirmPassword} onChange={(e) => handleInputChange('confirmPassword', e.target.value)} className={inputClass('confirmPassword')} placeholder="Confirm your password" />
          {fieldErrors.confirmPassword && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{fieldErrors.confirmPassword}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-1.5">Phone Number *</label>
          <input type="tel" value={phone} onChange={(e) => handleInputChange('phone', e.target.value)} className={inputClass('phone')} placeholder="+977 98XXXXXXXX" />
          {fieldErrors.phone && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{fieldErrors.phone}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">Country *</label>
            <select value={country} onChange={(e) => handleInputChange('country', e.target.value)} className={selectClass('country')}>
              <option value="">Select country</option>
              {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {fieldErrors.country && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{fieldErrors.country}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">Nationality *</label>
            <select value={nationality} onChange={(e) => handleInputChange('nationality', e.target.value)} className={selectClass('nationality')}>
              <option value="">Select nationality</option>
              {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {fieldErrors.nationality && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{fieldErrors.nationality}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-1.5">Preferred Language</label>
          <select value={preferredLanguage} onChange={(e) => handleInputChange('preferredLanguage', e.target.value)} className={selectClass('preferredLanguage')}>
            {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
          </select>
        </div>

        <label className="flex items-start gap-3 cursor-pointer pt-2">
          <input
            type="checkbox"
            checked={agreeToTerms}
            onChange={(e) => {
              setAgreeToTerms(e.target.checked);
              if (fieldErrors.terms) setFieldErrors(prev => ({ ...prev, terms: '' }));
            }}
            className="mt-1 w-5 h-5 rounded border-2 border-stone-300 text-forest-600 focus:ring-forest-500 cursor-pointer"
          />
          <span className="text-sm text-stone-600">
            I agree to Paila's <span className="text-forest-600 font-medium">Terms of Service</span> and <span className="text-forest-600 font-medium">Privacy Policy</span>
          </span>
        </label>
        {fieldErrors.terms && <p className="text-red-500 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" />{fieldErrors.terms}</p>}

        <button type="submit" disabled={loading} className="w-full btn-primary py-4 font-semibold disabled:opacity-50 mt-2">
          {loading ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Creating...</span> : <span className="flex items-center justify-center gap-2">Create Account<ArrowRight className="w-4 h-4" /></span>}
        </button>

        <div className="flex items-center gap-3 py-1">
          <div className="flex-1 h-px bg-stone-200" />
          <span className="text-xs text-stone-400">or</span>
          <div className="flex-1 h-px bg-stone-200" />
        </div>

        <button type="button" onClick={() => signInWithGoogle()} className="w-full flex items-center justify-center gap-3 py-3 px-6 rounded-xl bg-white border-2 border-stone-200 hover:border-stone-300 hover:bg-stone-50 transition-all font-semibold text-stone-700 text-sm">
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Sign up with Google
        </button>
      </form>

      <p className="text-center text-sm text-stone-500 mt-5">
        Already have an account?{' '}
        <button onClick={() => { resetAllForms(); setScreen('login'); }} className="text-forest-600 font-semibold hover:underline">
          Sign in
        </button>
      </p>
    </div>
  );

  const renderLogin = () => (
    <div className="animate-fade-in">
      <button onClick={() => setScreen('main')} className="flex items-center gap-2 text-stone-500 hover:text-forest-600 text-sm mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-forest-100 flex items-center justify-center">
          <Mountain className="w-5 h-5 text-forest-600" />
        </div>
        <div>
          <h2 className="font-display text-xl font-bold text-forest-700">Welcome back</h2>
          <p className="text-stone-500 text-sm">Sign in to continue your journey</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {isLocked && (
        <div className="mb-4 p-3 rounded-lg bg-orange-50 border border-orange-200 text-orange-700 text-sm">
          Account temporarily locked. Please wait {Math.ceil((lockedUntil! - Date.now()) / 60000)} minutes.
        </div>
      )}

      <form onSubmit={handleEmailLogin} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-2">Email</label>
          <input type="email" value={email} onChange={(e) => handleInputChange('email', e.target.value)} className={inputClass('email')} placeholder="you@example.com" />
          {fieldErrors.email && <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-2">Password</label>
          <div className="relative">
            <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className={`${inputClass('password')} pr-12`} placeholder="Enter your password" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {fieldErrors.password && <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>}
        </div>

        <div className="flex justify-end">
          <button type="button" onClick={() => setScreen('forgot-password')} className="text-sm text-forest-600 hover:underline">
            Forgot password?
          </button>
        </div>

        <button type="submit" disabled={loading || isLocked} className="w-full btn-primary py-4 font-semibold disabled:opacity-50">
          {loading ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Signing in...</span> : 'Sign In'}
        </button>

        <div className="flex items-center gap-3 py-1">
          <div className="flex-1 h-px bg-stone-200" />
          <span className="text-xs text-stone-400">or</span>
          <div className="flex-1 h-px bg-stone-200" />
        </div>

        <button type="button" onClick={() => signInWithGoogle()} className="w-full flex items-center justify-center gap-3 py-3 px-6 rounded-xl bg-white border-2 border-stone-200 hover:border-stone-300 hover:bg-stone-50 transition-all font-semibold text-stone-700 text-sm">
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>
      </form>

      <p className="text-center text-sm text-stone-500 mt-6">
        Don't have an account?{' '}
        <button onClick={() => { resetAllForms(); setScreen('register'); }} className="text-forest-600 font-semibold hover:underline">
          Sign up
        </button>
      </p>
    </div>
  );

  const renderForgotPassword = () => (
    <div className="animate-fade-in">
      <button onClick={() => setScreen('login')} className="flex items-center gap-2 text-stone-500 hover:text-forest-600 text-sm mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to sign in
      </button>

      <h2 className="font-display text-2xl font-bold text-forest-700 mb-2">Forgot password?</h2>
      <p className="text-stone-500 text-sm mb-6">Enter your email and we'll send a reset link.</p>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>
      )}

      <form onSubmit={handleForgotPassword} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-2">Email Address</label>
          <input type="email" value={email} onChange={(e) => handleInputChange('email', e.target.value)} className={inputClass('email')} placeholder="you@example.com" />
          {fieldErrors.email && <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>}
        </div>

        <button type="submit" disabled={loading} className="w-full btn-primary py-4 font-semibold disabled:opacity-50">
          {loading ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Sending...</span> : 'Send Reset Link'}
        </button>
      </form>
    </div>
  );

  const renderResetSent = () => (
    <div className="animate-fade-in text-center py-8">
      <div className="w-16 h-16 bg-forest-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Mail className="w-8 h-8 text-forest-600" />
      </div>
      <h2 className="font-display text-2xl font-bold text-forest-700 mb-2">Check your email</h2>
      <p className="text-stone-500 text-sm mb-6">We sent a password reset link to<br /><span className="font-semibold text-stone-700">{email}</span></p>
      <button onClick={() => setScreen('login')} className="btn-primary px-8 py-3">Back to Sign In</button>
    </div>
  );

  const renderVerificationSent = () => (
    <div className="animate-fade-in text-center py-8">
      <div className="w-16 h-16 bg-forest-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Mail className="w-8 h-8 text-forest-600" />
      </div>
      <h2 className="font-display text-2xl font-bold text-forest-700 mb-2">Verify your email</h2>
      <p className="text-stone-500 text-sm mb-6">We sent a verification link to<br /><span className="font-semibold text-stone-700">{email}</span></p>
      <p className="text-xs text-stone-400 mb-6">Click the link in your email to activate your account, then sign in.</p>
      <button
        onClick={() => { resetAllForms(); setScreen('login'); }}
        className="btn-primary px-8 py-3"
      >
        Continue to Sign In
      </button>
    </div>
  );

  const renderScreen = () => {
    switch (screen) {
      case 'loading': return renderLoading();
      case 'main': return renderMain();
      case 'register': return renderRegister();
      case 'login': return renderLogin();
      case 'forgot-password': return renderForgotPassword();
      case 'reset-sent': return renderResetSent();
      case 'verification-sent': return renderVerificationSent();
      default: return renderMain();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-sm p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="flex bg-white rounded-3xl shadow-2xl max-w-[900px] w-full max-h-[90vh] overflow-hidden">
        {renderLeftPanel()}
        <div className="flex-1 p-6 sm:p-8 overflow-y-auto relative">
          <button onClick={onClose} className="absolute right-6 top-6 text-stone-400 hover:text-stone-600 transition-colors z-10">
            <X className="w-6 h-6" />
          </button>
          {renderScreen()}
        </div>
      </div>
    </div>
  );
}
