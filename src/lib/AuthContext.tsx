import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

export type UserType = 'traveler' | 'vendor' | null;
export type VendorStatus = 'pending' | 'approved' | 'rejected' | null;

interface UserProfile {
  id: string;
  name: string;
  email: string;
  user_type: UserType;
  vendor_status: VendorStatus;
  phone?: string;
  avatar_url?: string;
  isDemo?: boolean;
}

interface VendorProfile {
  id: string;
  business_name: string;
  business_type: string;
  location: string;
  district?: string;
  description: string;
  phone: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  vendor: VendorProfile | null;
  loading: boolean;
  userType: UserType;
  isDemo: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (name: string, email: string, password: string, userType?: UserType, phone?: string) => Promise<{ error: Error | null; needsConfirmation?: boolean }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
  demoLogin: (type: 'traveler' | 'vendor') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_TRAVELER: UserProfile = {
  id: 'demo-traveler',
  name: 'Suman Rai',
  email: 'suman@demo.com',
  user_type: 'traveler',
  vendor_status: null,
  isDemo: true,
};

const DEMO_VENDOR: UserProfile = {
  id: 'demo-vendor',
  name: 'Nima Sherpa',
  email: 'nima@demo.com',
  user_type: 'vendor',
  vendor_status: 'approved',
  isDemo: true,
};

const DEMO_VENDOR_PROFILE: VendorProfile = {
  id: 'demo-vendor-profile',
  business_name: 'Nima Sherpa Trekking',
  business_type: 'guide',
  location: 'Kathmandu',
  district: 'Kathmandu',
  description: 'Experienced mountain guide specializing in Everest and Annapurna regions. 15+ years of trekking experience.',
  phone: '9812345678',
  email: 'nima@demo.com',
  status: 'approved',
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [vendor, setVendor] = useState<VendorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  const userType = profile?.user_type ?? null;

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) throw profileError;

      if (profileData) {
        setProfile({
          id: profileData.id,
          name: profileData.name,
          email: profileData.email,
          user_type: profileData.user_type || 'traveler',
          vendor_status: profileData.vendor_status,
          phone: profileData.phone,
          avatar_url: profileData.avatar_url,
        });

        if (profileData.user_type === 'vendor') {
          const { data: vendorData } = await supabase
            .from('vendors')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

          if (vendorData) {
            setVendor({
              id: vendorData.id,
              business_name: vendorData.business_name,
              business_type: vendorData.business_type,
              location: vendorData.location,
              district: vendorData.district,
              description: vendorData.description,
              phone: vendorData.phone,
              email: vendorData.email,
              status: vendorData.status,
            });
          }
        }
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  }, []);

  useEffect(() => {
    // Check for demo session first
    const demoSession = localStorage.getItem('paila_demo_session');
    if (demoSession) {
      try {
        const parsed = JSON.parse(demoSession);
        if (parsed.type === 'traveler') {
          setProfile(DEMO_TRAVELER);
          setIsDemo(true);
          setLoading(false);
          return;
        } else if (parsed.type === 'vendor') {
          setProfile(DEMO_VENDOR);
          setVendor(DEMO_VENDOR_PROFILE);
          setIsDemo(true);
          setLoading(false);
          return;
        }
      } catch {
        localStorage.removeItem('paila_demo_session');
      }
    }

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) console.error('Error getting session:', error);
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => fetchProfile(session.user.id), 500);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (event === 'SIGNED_IN' && session?.user) {
        setTimeout(() => fetchProfile(session.user.id), 500);
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
        setVendor(null);
        setIsDemo(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error?.message === 'Invalid login credentials') {
      return { error: new Error('Wrong email or password. Please try again.') as Error };
    }
    return { error: error as Error | null };
  }, []);

  const signUp = useCallback(async (
    name: string,
    email: string,
    password: string,
    newUserType: UserType = 'traveler',
    phone?: string
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, user_type: newUserType, phone },
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) return { error: error as Error };

    if (data.user && !data.session) {
      return { error: null, needsConfirmation: true };
    }

    if (data.user && data.session) {
      setTimeout(() => fetchProfile(data.user!.id), 1000);
    }

    return { error: null };
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    if (isDemo) {
      localStorage.removeItem('paila_demo_session');
      setProfile(null);
      setVendor(null);
      setIsDemo(false);
      return;
    }
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
    setVendor(null);
  }, [isDemo]);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error: error as Error | null };
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error: error as Error | null };
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  }, [user, fetchProfile]);

  const demoLogin = useCallback((type: 'traveler' | 'vendor') => {
    localStorage.setItem('paila_demo_session', JSON.stringify({ type }));
    setIsDemo(true);
    if (type === 'traveler') {
      setProfile(DEMO_TRAVELER);
      setVendor(null);
    } else {
      setProfile(DEMO_VENDOR);
      setVendor(DEMO_VENDOR_PROFILE);
    }
  }, []);

  const value: AuthContextType = {
    user,
    session,
    profile,
    vendor,
    loading,
    userType,
    isDemo,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    refreshProfile,
    demoLogin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
