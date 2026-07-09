import { useState, useEffect } from 'react';
import { X, Eye, EyeOff, Mountain, Store, ArrowLeft, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { useAuth, UserType } from '../lib/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  mode: 'login' | 'register';
  onClose: () => void;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
  onDemoLogin?: (type: 'traveler' | 'vendor') => void;
}

type AuthStep = 'select-type' | 'signup-traveler' | 'signup-vendor' | 'signin' | 'forgot-password' | 'loading';

export default function AuthModal({ isOpen, mode, onClose, showToast, onDemoLogin }: AuthModalProps) {
  const { signIn, signUp, resetPassword } = useAuth();
  const [currentStep, setCurrentStep] = useState<AuthStep>('select-type');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('');

  const [showPassword, setShowPassword] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setCurrentStep('select-type');
      resetAllForms();
    }
  }, [isOpen, mode]);

  const resetAllForms = () => {
    setName('');
    setEmail('');
    setPassword('');
    setError(null);
    setFieldErrors({});
  };

  const validateField = (field: string, value: string): string | null => {
    switch (field) {
      case 'name':
        return value.trim().length < 2 ? 'Please enter your name' : null;
      case 'email':
        if (!value.includes('@') || !value.includes('.')) return 'Please enter a valid email';
        return null;
      case 'password':
        return value.length < 6 ? 'Password must be at least 6 characters' : null;
      default:
        return null;
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === 'name') setName(value);
    else if (field === 'email') setEmail(value);
    else if (field === 'password') setPassword(value);

    if (fieldErrors[field]) {
      const err = validateField(field, value);
      setFieldErrors((prev) => ({ ...prev, [field]: err || '' }));
    }
  };

  const handleBack = () => {
    setError(null);
    setFieldErrors({});
    if (currentStep === 'signin' || currentStep === 'signup-traveler' || currentStep === 'signup-vendor') {
      setCurrentStep('select-type');
    } else if (currentStep === 'forgot-password') {
      setCurrentStep('signin');
    }
  };

  const showLoadingScreen = (message: string) => {
    setLoadingMessage(message);
    setCurrentStep('loading');
  };

  const handleTravelerSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const errors: Record<string, string> = {};
    const nameErr = validateField('name', name);
    if (nameErr) errors.name = nameErr;
    const emailErr = validateField('email', email);
    if (emailErr) errors.email = emailErr;
    const passErr = validateField('password', password);
    if (passErr) errors.password = passErr;

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    showLoadingScreen('Setting up your Nepal journey...');
    setLoading(true);

    try {
      const { error: signUpError, needsConfirmation } = await signUp(name, email, password, 'traveler');
      if (signUpError) throw signUpError;
      if (needsConfirmation) {
        showToast('Account created! Please check your email to confirm.', 'success');
        setCurrentStep('signin');
      } else {
        showToast(`Welcome to Paila, ${name.split(' ')[0]}!`, 'success');
        onClose();
      }
    } catch (err: any) {
      setCurrentStep('signup-traveler');
      if (err.message?.includes('already registered') || err.message?.includes('already been registered')) {
        setError('An account with this email already exists. Try logging in instead.');
      } else {
        setError(err.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVendorSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const errors: Record<string, string> = {};
    const nameErr = validateField('name', name);
    if (nameErr) errors.name = nameErr;
    const emailErr = validateField('email', email);
    if (emailErr) errors.email = emailErr;
    const passErr = validateField('password', password);
    if (passErr) errors.password = passErr;

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    showLoadingScreen('Setting up your business account...');
    setLoading(true);

    try {
      const { error: signUpError, needsConfirmation } = await signUp(name, email, password, 'vendor');
      if (signUpError) throw signUpError;
      if (needsConfirmation) {
        showToast('Account created! Please check your email to confirm.', 'success');
        setCurrentStep('signin');
      } else {
        showToast("Welcome! Let's set up your listing.", 'success');
        onClose();
      }
    } catch (err: any) {
      setCurrentStep('signup-vendor');
      if (err.message?.includes('already registered') || err.message?.includes('already been registered')) {
        setError('An account with this email already exists. Try logging in instead.');
      } else {
        setError(err.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
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
      showToast('Welcome back!', 'success');
      onClose();
    } catch (err: any) {
      setCurrentStep('signin');
      if (err.message?.includes('Invalid login credentials')) {
        setError('Wrong email or password. Please try again.');
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

    setLoading(true);
    try {
      const { error: resetError } = await resetPassword(email);
      if (resetError) throw resetError;
      showToast('Reset link sent! Check your email.', 'success');
      setCurrentStep('signin');
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const NEPAL_BG = 'https://images.pexels.com/photos/3593922/pexels-photo-3593922.jpeg?auto=compress&cs=tinysrgb&w=1200';

  const inputClass = (field: string) =>
    `input ${fieldErrors[field] ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`;

  // ─── LOADING SCREEN ───
  const renderLoading = () => (
    <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
      <div className="text-5xl mb-6 animate-bounce">🏔️</div>
      <div className="font-display text-2xl font-bold text-forest-700 mb-3">Paila</div>
      <p className="text-stone-500 text-sm text-center max-w-xs mb-6">{loadingMessage}</p>
      <div className="w-48 h-1 bg-stone-200 rounded-full overflow-hidden">
        <div className="h-full bg-forest-600 rounded-full animate-[progress_1.8s_ease_forwards]" />
      </div>
    </div>
  );

  // ─── STEP 1: WHO ARE YOU ───
  const renderSelectType = () => (
    <div className="animate-fade-in">
      {/* Logo */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-14 h-14 bg-forest-700 rounded-2xl flex items-center justify-center mb-3">
          <Mountain className="w-8 h-8 text-white" />
        </div>
        <h1 className="font-display text-3xl font-bold text-forest-700">Paila</h1>
        <p className="text-stone-500 text-sm mt-1">Walk with confidence.</p>
      </div>

      <div className="border-t border-stone-200 pt-6 mb-6">
        <p className="text-center text-stone-600 font-medium mb-4">I want to...</p>

        <button
          onClick={() => { resetAllForms(); setCurrentStep('signup-traveler'); }}
          className="w-full flex items-center gap-4 p-5 rounded-2xl border-2 border-stone-200 hover:border-forest-400 hover:bg-forest-50 transition-all duration-200 mb-3 group"
        >
          <div className="w-12 h-12 rounded-xl bg-forest-100 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Mountain className="w-6 h-6 text-forest-600" />
          </div>
          <div className="text-left flex-1">
            <h3 className="font-display text-lg font-bold text-forest-700">Explore Nepal as a Traveler</h3>
            <p className="text-stone-500 text-sm">Discover destinations, plan trips, save places</p>
          </div>
          <ArrowRight className="w-5 h-5 text-stone-400 group-hover:text-forest-600 transition-colors" />
        </button>

        <button
          onClick={() => { resetAllForms(); setCurrentStep('signup-vendor'); }}
          className="w-full flex items-center gap-4 p-5 rounded-2xl border-2 border-stone-200 hover:border-forest-400 hover:bg-forest-50 transition-all duration-200 group"
        >
          <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Store className="w-6 h-6 text-orange-600" />
          </div>
          <div className="text-left flex-1">
            <h3 className="font-display text-lg font-bold text-forest-700">List my Business on Paila</h3>
            <p className="text-stone-500 text-sm">Guides, homestays, transport, cafes & more</p>
          </div>
          <ArrowRight className="w-5 h-5 text-stone-400 group-hover:text-forest-600 transition-colors" />
        </button>
      </div>

      <p className="text-center text-sm text-stone-500">
        Already have an account?{' '}
        <button
          onClick={() => { resetAllForms(); setCurrentStep('signin'); }}
          className="text-forest-600 font-semibold hover:underline"
        >
          Sign in →
        </button>
      </p>

      {/* Demo login */}
      <div className="mt-8 pt-6 border-t border-stone-200">
        <p className="text-center text-xs text-stone-400 mb-3">or try without signing up</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onDemoLogin?.('traveler')}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-stone-200 hover:border-forest-400 hover:bg-forest-50 transition-all text-sm font-medium text-stone-700"
          >
            <Mountain className="w-4 h-4 text-forest-600" />
            Demo Traveler
          </button>
          <button
            onClick={() => onDemoLogin?.('vendor')}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-stone-200 hover:border-forest-400 hover:bg-forest-50 transition-all text-sm font-medium text-stone-700"
          >
            <Store className="w-4 h-4 text-orange-600" />
            Demo Business
          </button>
        </div>
      </div>
    </div>
  );

  // ─── SHARED FORM FIELDS ───
  const renderNameField = () => (
    <div>
      <label className="block text-sm font-semibold text-stone-700 mb-2">Your Name</label>
      <input
        type="text"
        value={name}
        onChange={(e) => handleInputChange('name', e.target.value)}
        className={inputClass('name')}
        placeholder="Enter your name"
        autoFocus
      />
      {fieldErrors.name && <p className="text-red-500 text-xs mt-1">{fieldErrors.name}</p>}
    </div>
  );

  const renderEmailField = () => (
    <div>
      <label className="block text-sm font-semibold text-stone-700 mb-2">Email Address</label>
      <input
        type="email"
        value={email}
        onChange={(e) => handleInputChange('email', e.target.value)}
        className={inputClass('email')}
        placeholder="you@example.com"
      />
      {fieldErrors.email && <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>}
    </div>
  );

  const renderPasswordField = () => (
    <div>
      <label className="block text-sm font-semibold text-stone-700 mb-2">Password</label>
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => handleInputChange('password', e.target.value)}
          className={`${inputClass('password')} pr-12`}
          placeholder="Create a password"
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
    </div>
  );

  const renderBackButton = () => (
    <button
      onClick={handleBack}
      className="flex items-center gap-2 text-stone-500 hover:text-forest-600 text-sm mb-6 transition-colors"
    >
      <ArrowLeft className="w-4 h-4" />
      Back
    </button>
  );

  const renderError = () => {
    if (!error) return null;
    return (
      <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
        {error}
      </div>
    );
  };

  // ─── STEP 2A: TRAVELER SIGNUP ───
  const renderSignupTraveler = () => (
    <div className="animate-fade-in">
      {renderBackButton()}

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-forest-100 flex items-center justify-center">
          <Mountain className="w-5 h-5 text-forest-600" />
        </div>
        <div>
          <h2 className="font-display text-xl font-bold text-forest-700">Create Traveler Account</h2>
          <p className="text-stone-500 text-sm">3 fields and you're in</p>
        </div>
      </div>

      {renderError()}

      <form onSubmit={handleTravelerSignup} className="space-y-4">
        {renderNameField()}
        {renderEmailField()}
        {renderPasswordField()}

        <button type="submit" disabled={loading} className="w-full btn-primary py-3.5 text-base disabled:opacity-50 mt-2">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating account...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              Create Account
              <ArrowRight className="w-4 h-4" />
            </span>
          )}
        </button>
      </form>

      <p className="text-xs text-stone-400 text-center mt-4">
        By continuing you agree to our Terms.
      </p>
    </div>
  );

  // ─── STEP 2B: VENDOR SIGNUP ───
  const renderSignupVendor = () => (
    <div className="animate-fade-in">
      {renderBackButton()}

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
          <Store className="w-5 h-5 text-orange-600" />
        </div>
        <div>
          <h2 className="font-display text-xl font-bold text-forest-700">Create Business Account</h2>
          <p className="text-stone-500 text-sm">3 fields and you're in</p>
        </div>
      </div>

      {renderError()}

      <form onSubmit={handleVendorSignup} className="space-y-4">
        {renderNameField()}
        {renderEmailField()}
        {renderPasswordField()}

        <button type="submit" disabled={loading} className="w-full btn-primary py-3.5 text-base disabled:opacity-50 mt-2">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating account...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              Create Business Account
              <ArrowRight className="w-4 h-4" />
            </span>
          )}
        </button>
      </form>

      <p className="text-xs text-stone-400 text-center mt-4">
        By continuing you agree to our Terms.
      </p>

      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-green-600 flex-shrink-0" />
        <p className="text-sm text-green-700">
          Your account activates instantly. No waiting. No approval needed.
        </p>
      </div>
    </div>
  );

  // ─── SIGN IN ───
  const renderSignIn = () => (
    <div className="animate-fade-in">
      {renderBackButton()}

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-forest-100 flex items-center justify-center">
          <Mountain className="w-5 h-5 text-forest-600" />
        </div>
        <div>
          <h2 className="font-display text-xl font-bold text-forest-700">Welcome back</h2>
          <p className="text-stone-500 text-sm">Sign in to continue your journey</p>
        </div>
      </div>

      {renderError()}

      <form onSubmit={handleSignIn} className="space-y-4">
        {renderEmailField()}
        {renderPasswordField()}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => { setError(null); setFieldErrors({}); setCurrentStep('forgot-password'); }}
            className="text-sm text-forest-600 hover:underline"
          >
            Forgot password?
          </button>
        </div>

        <button type="submit" disabled={loading} className="w-full btn-primary py-3.5 text-base disabled:opacity-50 mt-2">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Signing in...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              Sign In
              <ArrowRight className="w-4 h-4" />
            </span>
          )}
        </button>
      </form>

      <p className="text-center text-sm text-stone-500 mt-6">
        Don't have an account?{' '}
        <button
          onClick={() => { resetAllForms(); setCurrentStep('select-type'); }}
          className="text-forest-600 font-semibold hover:underline"
        >
          Sign up →
        </button>
      </p>
    </div>
  );

  // ─── FORGOT PASSWORD ───
  const renderForgotPassword = () => (
    <div className="animate-fade-in">
      {renderBackButton()}

      <h2 className="font-display text-2xl font-bold text-forest-700 mb-2">Forgot your password?</h2>
      <p className="text-stone-500 text-sm mb-6">Enter your email and we'll send you a reset link.</p>

      {renderError()}

      <form onSubmit={handleForgotPassword} className="space-y-4">
        {renderEmailField()}

        <button type="submit" disabled={loading} className="w-full btn-primary py-3.5 text-base disabled:opacity-50">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Sending...
            </span>
          ) : (
            'Send Reset Link'
          )}
        </button>
      </form>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Background image with blur */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{ backgroundImage: `url(${NEPAL_BG})` }}
      />

      {/* Card */}
      <div className="relative w-full max-w-[420px] bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 transition-colors z-10"
        >
          <X className="w-6 h-6" />
        </button>

        {currentStep === 'select-type' && renderSelectType()}
        {currentStep === 'signup-traveler' && renderSignupTraveler()}
        {currentStep === 'signup-vendor' && renderSignupVendor()}
        {currentStep === 'signin' && renderSignIn()}
        {currentStep === 'forgot-password' && renderForgotPassword()}
        {currentStep === 'loading' && renderLoading()}
      </div>
    </div>
  );
}
