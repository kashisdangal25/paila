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
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (name: string, email: string, password: string, userType?: UserType, phone?: string) => Promise<{ error: Error | null; needsConfirmation?: boolean }>;
  signUpVendor: (data: VendorSignUpData) => Promise<{ error: Error | null; pending?: boolean }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

export interface VendorSignUpData {
  name: string;
  email: string;
  password: string;
  phone: string;
  businessName: string;
  businessType: string;
  location: string;
  district?: string;
  description: string;
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
        setProfile({
          id: profileData.id,
          name: profileData.name,
          email: profileData.email,
          user_type: profileData.user_type || 'traveler',
          vendor_status: profileData.vendor_status,
          phone: profileData.phone,
          avatar_url: profileData.avatar_url,
        });

        // If vendor, fetch vendor profile
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
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) console.error('Error getting session:', error);
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        // Small delay to allow trigger to create profile
        setTimeout(() => fetchProfile(session.user.id), 500);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (event === 'SIGNED_IN' && session?.user) {
        // Small delay to allow trigger to create profile
        setTimeout(() => fetchProfile(session.user.id), 500);
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
        setVendor(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    // Improve error message for email confirmation
    if (error?.message === 'Invalid login credentials') {
      return { error: new Error('Wrong password, or your email is not yet confirmed. Check your inbox for a confirmation link.') as Error };
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

    // Profile and vendor records are auto-created by database trigger

    // Check if user needs email confirmation
    if (data.user && !data.session) {
      return { error: null, needsConfirmation: true };
    }

    // If auto-login, refresh profile after trigger creates it
    if (data.user && data.session) {
      setTimeout(() => fetchProfile(data.user!.id), 1000);
    }

    return { error: null };
  }, [fetchProfile]);

  const signUpVendor = useCallback(async (data: VendorSignUpData): Promise<{ error: Error | null; pending?: boolean }> => {
    // Create auth user - profile/vendor auto-created by trigger
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.name,
          user_type: 'vendor',
          phone: data.phone,
        },
      },
    });

    if (authError) return { error: authError as Error };
    if (!authData.user) return { error: new Error('Failed to create account') };

    // Update vendor record with full details after trigger creates initial record
    const { error: vendorError } = await supabase
      .from('vendors')
      .update({
        business_name: data.businessName,
        business_type: data.businessType,
        location: data.location,
        district: data.district || null,
        description: data.description,
        phone: data.phone,
        email: data.email,
        status: 'approved', // Auto-approve!
      })
      .eq('user_id', authData.user.id);

    if (vendorError) {
      console.error('Error updating vendor:', vendorError);
    }

    return { error: null, pending: false }; // Not pending - instant approval
  }, []);

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
    signUpVendor,
    signOut,
    resetPassword,
    updatePassword,
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
