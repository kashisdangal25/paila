import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

export type UserType = 'traveler' | 'vendor' | null;
export type VendorStatus = 'pending' | 'approved' | 'rejected' | null;

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  user_type: UserType;
  vendor_status: VendorStatus;
  phone?: string | null;
  avatar_url?: string | null;
  profile_photo_url?: string | null;
  bio?: string | null;
  location?: string | null;
  username?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  nationality?: string | null;
  country_of_residence?: string | null;
  preferred_language?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  emergency_contact_relationship?: string | null;
  blood_group?: string | null;
  medical_conditions?: string | null;
  allergies?: string | null;
  trekking_experience_level?: string | null;
  preferred_emergency_language?: string | null;
  sos_enabled?: boolean;
  last_known_location?: { lat: number; lng: number; updated_at?: string } | null;
  offline_trek_status?: string | null;
  travel_insurance?: { provider?: string; policy?: string; phone?: string } | null;
  is_currently_travelling?: boolean;
}

export interface VendorProfile {
  id: string;
  business_name: string;
  business_type: string;
  location: string;
  district?: string | null;
  description: string;
  phone: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface TrustedContact {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  relationship?: string | null;
  notify_on_trip: boolean;
  notify_on_sos: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  vendor: VendorProfile | null;
  loading: boolean;
  userType: UserType;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (data: SignUpData) => Promise<{ error: Error | null; needsConfirmation?: boolean }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

export interface SignUpData {
  name: string;
  username?: string;
  email: string;
  password: string;
  phone: string;
  userType?: 'traveler' | 'vendor';
  country?: string;
  nationality?: string;
  preferredLanguage?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [vendor, setVendor] = useState<VendorProfile | null>(null);
  const [loading, setLoading] = useState(true);

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
        setProfile(profileData as UserProfile);

        if (profileData.user_type === 'vendor') {
          const { data: vendorData } = await supabase
            .from('vendors')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

          if (vendorData) {
            setVendor(vendorData as VendorProfile);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) console.error('Error getting session:', error);
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (event === 'SIGNED_IN' && session?.user) {
        (async () => {
          await fetchProfile(session.user.id);
        })();
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
        setVendor(null);
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

  const signUp = useCallback(async (data: SignUpData) => {
    const { data: signUpData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.name,
          user_type: data.userType ?? 'traveler',
          phone: data.phone,
          username: data.username,
          country: data.country,
          nationality: data.nationality,
          preferred_language: data.preferredLanguage,
        },
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) return { error: error as Error };

    if (signUpData.user && !signUpData.session) {
      return { error: null, needsConfirmation: true };
    }

    if (signUpData.user && signUpData.session) {
      await fetchProfile(signUpData.user.id);
    }

    return { error: null };
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
    setVendor(null);
  }, []);

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

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!user) return { error: new Error('Not authenticated') };
    const { error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', user.id);
    if (!error) {
      setProfile(prev => prev ? { ...prev, ...updates } : prev);
    }
    return { error: error as Error | null };
  }, [user]);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  }, [user, fetchProfile]);

  const value: AuthContextType = {
    user,
    session,
    profile,
    vendor,
    loading,
    userType,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    refreshProfile,
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
