import { useState, useEffect, useRef } from 'react';
import { X, Eye, EyeOff, Mountain, Store, ArrowLeft, ArrowRight, Loader2, Sparkles, Shield, Phone, Mail, User, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth, UserType } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  mode: 'login' | 'register';
  onClose: () => void;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
  onDemoLogin?: (type: 'traveler' | 'vendor') => void;
}

type AuthScreen =
  | 'main'
  | 'account-type'
  | 'register'
  | 'login'
  | 'forgot-password'
  | 'reset-sent'
  | 'new-password'
  | 'phone'
  | 'otp'
  | 'verification-sent'
  | 'demo-login'
  | 'loading';

const QUOTES = [
  { text: "The mountains are calling and I must go.", author: "John Muir" },
  { text: "In every walk with nature, one receives far more than he seeks.", author: "John Muir" },
  { text: "The journey of a thousand miles begins with a single step.", author: "Lao Tzu" },
  { text: "Life is either a daring adventure or nothing at all.", author: "Helen Keller" },
  { text: "The world is a book and those who do not travel read only one page.", author: "Saint Augustine" },
];

const DEMO_ACCOUNTS = [
  { type: 'traveler', name: 'Suman Rai', email: 'suman@paila.travel', icon: Mountain, color: 'forest' },
  { type: 'guide', name: 'Nima Sherpa', email: 'nima@paila.travel', icon: Mountain, color: 'blue' },
  { type: 'business', name: 'Himalchuli Homestay', email: 'himalchuli@paila.travel', icon: Store, color: 'orange' },
];

export default function AuthModal({ isOpen, mode, onClose, showToast, onDemoLogin }: AuthModalProps) {
  const { signIn, signUp, resetPassword } = useAuth();

  const [screen, setScreen] = useState<AuthScreen>('main');
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [accountType, setAccountType] = useState<'traveler' | 'guide' | 'business' | 'admin'>('traveler');
  const [resendTimer, setResendTimer] = useState(0);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) return;
    setScreen('main');
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
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setPhone('');
    setOtp(['', '', '', '', '', '']);
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
        if (!value.trim()) return 'Please enter your name';
        if (value.trim().length < 2) return 'Name must be at least 2 characters';
        if (/\d/.test(value)) return 'Name should not contain numbers';
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
        if (!/^[0-9+]{10,15}$/.test(value.replace(/\s/g, ''))) return 'Please enter a valid phone number';
        return null;
      default:
        return null;
    }
  };

  const handleInputChange = (field: string, value: string) => {
    switch (field) {
      case 'name': setName(value); break;
      case 'email': setEmail(value); break;
      case 'password': setPassword(value); break;
      case 'confirmPassword': setConfirmPassword(value); break;
      case 'phone': setPhone(value); break;
    }
    if (fieldErrors[field]) {
      const err = validateField(field, field === 'confirmPassword' ? value : value);
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

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value[0];
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    if (newOtp.every((d) => d !== '') && newOtp.join('').length === 6) {
      handleVerifyOtp(newOtp.join(''));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleGoogleSignIn = async () => {
    showLoadingScreen('Connecting to Google...');
    await new Promise((r) => setTimeout(r, 1800));
    showToast('Google sign-in successful!', 'success');
    onDemoLogin?.('traveler');
  };

  const handleAppleSignIn = async () => {
    showLoadingScreen('Connecting to Apple...');
    await new Promise((r) => setTimeout(r, 1500));
    showToast('Apple sign-in successful!', 'success');
    onDemoLogin?.('traveler');
  };

  const handlePhoneSignIn = async () => {
    const phoneErr = validateField('phone', phone);
    if (phoneErr) {
      setFieldErrors({ phone: phoneErr });
      return;
    }
    showLoadingScreen('Sending verification code...');
    await new Promise((r) => setTimeout(r, 1200));
    setResendTimer(60);
    setScreen('otp');
  };

  const handleVerifyOtp = async (code: string) => {
    showLoadingScreen('Verifying code...');
    await new Promise((r) => setTimeout(r, 1000));

    if (code === '123456') {
      showToast('Phone verified successfully!', 'success');
      onDemoLogin?.('traveler');
    } else {
      setScreen('otp');
      setError('Invalid code. Try: 123456');
    }
  };

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const errors: Record<string, string> = {};
    const fields: Record<string, string> = { name, email, password, confirmPassword };
    Object.entries(fields).forEach(([f, value]) => {
      const err = validateField(f, value);
      if (err) errors[f] = err;
    });

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    showLoadingScreen('Creating your account...');
    setLoading(true);

    try {
      const { error: signUpError, needsConfirmation } = await signUp(
        name,
        email,
        password,
        accountType === 'business' ? 'vendor' : accountType
      );

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
      if (err.message?.includes('already registered') || err.message?.includes('already been registered')) {
        setError('An account with this email already exists. Try logging in instead.');
      } else {
        setError(err.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLocked) {
      const remaining = Math.ceil((lockedUntil! - Date.now()) / 60000);
      setError(`Too many failed attempts. Try again in ${remaining} minutes.`);
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
      } else if (err.message?.includes('Invalid login credentials')) {
        setError(`Wrong email or password. ${5 - newAttempts} attempts remaining.`);
      } else {
        setError(err.message || 'Something went wrong. Please try again.');
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

  const handleDemoLogin = (type: 'traveler' | 'guide' | 'business') => {
    if (type === 'business') {
      onDemoLogin?.('vendor');
    } else {
      onDemoLogin?.('traveler');
    }
  };

  if (!isOpen) return null;

  const NEPAL_BG = 'https://images.pexels.com/photos/4194617/pexels-photo-4194617.jpeg?auto=compress&cs=tinysrgb&w=1200';

  const inputClass = (field: string) =>
    `w-full px-4 py-3 rounded-xl border-2 ${fieldErrors[field] ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : 'border-stone-200 focus:border-forest-500 focus:ring-forest-100'} focus:outline-none focus:ring-4 transition-all text-stone-800 bg-white`;

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
            <span className="text-sm">10,000+ travelers trusted</span>
          </div>
          <div className="flex items-center gap-3 text-white/90">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span className="text-sm">500+ verified guides & businesses</span>
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
        <button onClick={handleGoogleSignIn} className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-xl bg-white border-2 border-stone-200 hover:border-stone-300 hover:bg-stone-50 transition-all font-semibold text-stone-700">
          <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.19 15.03 1 12 1 7.7 1 3.99 3.48 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continue with Google
        </button>

        <button onClick={handleAppleSignIn} className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-xl bg-stone-900 hover:bg-stone-800 transition-all font-semibold text-white">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
          Continue with Apple
        </button>

        <button onClick={() => { resetAllForms(); setScreen('register'); }} className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-xl bg-forest-600 hover:bg-forest-700 transition-all font-semibold text-white">
          <Mail className="w-5 h-5" />
          Continue with Email
        </button>

        <button onClick={() => { resetAllForms(); setScreen('phone'); }} className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-xl bg-white border-2 border-stone-200 hover:border-stone-300 hover:bg-stone-50 transition-all font-semibold text-stone-700">
          <Phone className="w-5 h-5" />
          Continue with Phone
        </button>
      </div>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-stone-200" /></div>
        <div className="relative flex justify-center text-sm"><span className="bg-white px-4 text-stone-400">or</span></div>
      </div>

      <button onClick={() => { onDemoLogin?.('traveler'); onClose(); }} className="w-full py-4 rounded-xl border-2 border-dashed border-stone-300 hover:border-forest-400 hover:bg-forest-50 transition-all text-stone-600 font-medium">
        Browse as Guest
      </button>

      <p className="text-center text-sm text-stone-500 mt-6">
        Already have an account?{' '}
        <button onClick={() => { resetAllForms(); setScreen('login'); }} className="text-forest-600 font-semibold hover:underline">
          Sign in
        </button>
      </p>
    </div>
  );

  const renderAccountType = () => (
    <div className="animate-fade-in">
      <button onClick={() => setScreen('register')} className="flex items-center gap-2 text-stone-500 hover:text-forest-600 text-sm mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <h2 className="font-display text-2xl font-bold text-forest-700 mb-2">Choose your account type</h2>
      <p className="text-stone-500 text-sm mb-6">You can change this later</p>

      <div className="space-y-3">
        {[
          { id: 'traveler', name: 'Traveler', desc: 'Explore, plan trips, save places', icon: Mountain, color: 'forest' },
          { id: 'guide', name: 'Guide', desc: 'Lead tours, share expertise', icon: User, color: 'blue' },
          { id: 'business', name: 'Business', desc: 'Homestays, cafes, transport', icon: Store, color: 'orange' },
        ].map((type) => {
          const Icon = type.icon;
          const isActive = accountType === type.id;
          const colorClasses = {
            forest: 'border-forest-500 bg-forest-50',
            blue: 'border-blue-500 bg-blue-50',
            orange: 'border-orange-500 bg-orange-50',
          }[type.color];
          return (
            <button
              key={type.id}
              onClick={() => setAccountType(type.id as any)}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${isActive ? colorClasses : 'border-stone-200 hover:border-stone-300'}`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isActive ? 'bg-white' : 'bg-stone-100'}`}>
                <Icon className={`w-6 h-6 ${isActive ? 'text-forest-600' : 'text-stone-500'}`} />
              </div>
              <div className="text-left flex-1">
                <div className={`font-semibold ${isActive ? 'text-forest-700' : 'text-stone-700'}`}>{type.name}</div>
                <div className="text-stone-500 text-sm">{type.desc}</div>
              </div>
              {isActive && <CheckCircle className="w-5 h-5 text-forest-600" />}
            </button>
          );
        })}

        <div className="mt-2 p-3 rounded-lg bg-stone-100 border border-stone-200">
          <div className="flex items-center gap-2 text-stone-600 text-sm">
            <Shield className="w-4 h-4" />
            <span>Admin accounts are invite-only</span>
          </div>
        </div>
      </div>

      <button onClick={() => setScreen('register')} className="w-full btn-primary py-4 mt-6 font-semibold">
        Continue as {accountType.charAt(0).toUpperCase() + accountType.slice(1)}
      </button>
    </div>
  );

  const renderRegister = () => (
    <div className="animate-fade-in">
      <button onClick={() => setScreen('main')} className="flex items-center gap-2 text-stone-500 hover:text-forest-600 text-sm mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-forest-100 flex items-center justify-center">
          <Mail className="w-5 h-5 text-forest-600" />
        </div>
        <div>
          <h2 className="font-display text-xl font-bold text-forest-700">Create your account</h2>
          <p className="text-stone-500 text-sm">Join thousands of explorers</p>
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
          <label className="block text-sm font-semibold text-stone-700 mb-2">Full Name</label>
          <input type="text" value={name} onChange={(e) => handleInputChange('name', e.target.value)} className={inputClass('name')} placeholder="Your name" autoFocus />
          {fieldErrors.name && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{fieldErrors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-2">Email</label>
          <input type="email" value={email} onChange={(e) => handleInputChange('email', e.target.value)} className={inputClass('email')} placeholder="you@example.com" />
          {fieldErrors.email && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{fieldErrors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-2">Password</label>
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
          <label className="block text-sm font-semibold text-stone-700 mb-2">Confirm Password</label>
          <input type="password" value={confirmPassword} onChange={(e) => handleInputChange('confirmPassword', e.target.value)} className={inputClass('confirmPassword')} placeholder="Confirm your password" />
          {fieldErrors.confirmPassword && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{fieldErrors.confirmPassword}</p>}
        </div>

        <button type="submit" disabled={loading} className="w-full btn-primary py-4 font-semibold disabled:opacity-50 mt-2">
          {loading ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Creating...</span> : <span className="flex items-center justify-center gap-2">Create Account<ArrowRight className="w-4 h-4" /></span>}
        </button>
      </form>

      <p className="text-xs text-stone-400 text-center mt-4">By continuing, you agree to our Terms of Service and Privacy Policy.</p>
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
      </form>

      <p className="text-center text-sm text-stone-500 mt-6">
        Don't have an account?{' '}
        <button onClick={() => { resetAllForms(); setScreen('register'); }} className="text-forest-600 font-semibold hover:underline">
          Sign up
        </button>
      </p>
    </div>
  );

  const renderPhone = () => (
    <div className="animate-fade-in">
      <button onClick={() => setScreen('main')} className="flex items-center gap-2 text-stone-500 hover:text-forest-600 text-sm mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-forest-100 flex items-center justify-center">
          <Phone className="w-5 h-5 text-forest-600" />
        </div>
        <div>
          <h2 className="font-display text-xl font-bold text-forest-700">Enter your phone</h2>
          <p className="text-stone-500 text-sm">We'll send a verification code</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>
      )}

      <form onSubmit={handlePhoneSignIn} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-2">Phone Number</label>
          <input type="tel" value={phone} onChange={(e) => handleInputChange('phone', e.target.value)} className={inputClass('phone')} placeholder="+977 98XXXXXXXX" />
          {fieldErrors.phone && <p className="text-red-500 text-xs mt-1">{fieldErrors.phone}</p>}
        </div>

        <button type="submit" disabled={loading} className="w-full btn-primary py-4 font-semibold disabled:opacity-50">
          {loading ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Sending...</span> : 'Send Code'}
        </button>
      </form>
    </div>
  );

  const renderOtp = () => (
    <div className="animate-fade-in">
      <button onClick={() => setScreen('phone')} className="flex items-center gap-2 text-stone-500 hover:text-forest-600 text-sm mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-forest-100 flex items-center justify-center">
          <Shield className="w-5 h-5 text-forest-600" />
        </div>
        <div>
          <h2 className="font-display text-xl font-bold text-forest-700">Enter the code</h2>
          <p className="text-stone-500 text-sm">Sent to {phone}</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>
      )}

      <div className="flex gap-3 justify-center mb-6">
        {otp.map((digit, idx) => (
          <input
            key={idx}
            ref={(el) => { otpRefs.current[idx] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleOtpChange(idx, e.target.value)}
            onKeyDown={(e) => handleOtpKeyDown(idx, e)}
            className="w-12 h-14 text-center text-xl font-bold border-2 border-stone-200 rounded-xl focus:border-forest-500 focus:ring-forest-100 focus:ring-4 focus:outline-none"
          />
        ))}
      </div>

      <p className="text-center text-sm text-stone-500 mb-4">
        Demo code: <span className="font-mono font-bold text-forest-600">123456</span>
      </p>

      <button
        onClick={() => resendTimer > 0 ? null : setResendTimer(60)}
        disabled={resendTimer > 0}
        className="w-full text-center text-sm text-forest-600 font-medium disabled:text-stone-400"
      >
        {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend code'}
      </button>
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
      <button
        onClick={async () => {
          showLoadingScreen('Signing you in...');
          try {
            const { error } = await signIn(email, password);
            if (!error) {
              showToast('Email verified! Welcome aboard.', 'success');
              onClose();
            }
          } catch {
            setScreen('login');
            setError('Click the link in your email, then sign in.');
          }
        }}
        className="btn-primary px-8 py-3 mb-3"
      >
        I've verified - Continue
      </button>
      <p className="text-xs text-stone-400">Demo: click the button above to auto-login</p>
    </div>
  );

  const renderDemoLogin = () => (
    <div className="animate-fade-in">
      <button onClick={() => setScreen('main')} className="flex items-center gap-2 text-stone-500 hover:text-forest-600 text-sm mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <h2 className="font-display text-2xl font-bold text-forest-700 mb-2">Try Paila instantly</h2>
      <p className="text-stone-500 text-sm mb-6">No signup needed. Click to explore.</p>

      <div className="space-y-3">
        {DEMO_ACCOUNTS.map((account) => {
          const Icon = account.icon;
          return (
            <button
              key={account.type}
              onClick={() => handleDemoLogin(account.type as any)}
              className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-stone-200 hover:border-forest-400 hover:bg-forest-50 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-stone-100 group-hover:bg-white flex items-center justify-center">
                <Icon className="w-6 h-6 text-stone-500 group-hover:text-forest-600 transition-colors" />
              </div>
              <div className="text-left flex-1">
                <div className="font-semibold text-stone-700">{account.name}</div>
                <div className="text-stone-400 text-sm">{account.email}</div>
              </div>
              <ArrowRight className="w-5 h-5 text-stone-400 group-hover:text-forest-600 transition-colors" />
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderScreen = () => {
    switch (screen) {
      case 'loading': return renderLoading();
      case 'main': return renderMain();
      case 'account-type': return renderAccountType();
      case 'register': return renderRegister();
      case 'login': return renderLogin();
      case 'phone': return renderPhone();
      case 'otp': return renderOtp();
      case 'forgot-password': return renderForgotPassword();
      case 'reset-sent': return renderResetSent();
      case 'verification-sent': return renderVerificationSent();
      case 'demo-login': return renderDemoLogin();
      default: return renderMain();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-sm p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="flex bg-white rounded-3xl shadow-2xl max-w-[900px] w-full max-h-[90vh] overflow-hidden">
        {renderLeftPanel()}
        <div className="flex-1 p-6 sm:p-8 overflow-y-auto">
          <button onClick={onClose} className="absolute right-6 top-6 text-stone-400 hover:text-stone-600 transition-colors z-10">
            <X className="w-6 h-6" />
          </button>
          {renderScreen()}
        </div>
      </div>
    </div>
  );
}
