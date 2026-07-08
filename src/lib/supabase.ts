import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Types for our database
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          email: string;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          avatar_url?: string | null;
          updated_at?: string;
        };
      };
      destinations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string;
          category: string;
          region: string;
          image_url: string;
          rating: number;
          review_count: number;
          altitude_m: number | null;
          difficulty: string | null;
          best_months: string[] | null;
          nature_score: number | null;
          featured: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description: string;
          category: string;
          region: string;
          image_url: string;
          rating?: number;
          review_count?: number;
          altitude_m?: number | null;
          difficulty?: string | null;
          best_months?: string[] | null;
          nature_score?: number | null;
          featured?: boolean;
          created_at?: string;
        };
        Update: {
          name?: string;
          description?: string;
          rating?: number;
          review_count?: number;
        };
      };
      hidden_gems: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string;
          region: string;
          image_url: string;
          nature_score: number;
          tags: string[];
          pilot_pick: boolean;
          guide_favorite: boolean;
          peaceful: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description: string;
          region: string;
          image_url: string;
          nature_score: number;
          tags: string[];
          pilot_pick?: boolean;
          guide_favorite?: boolean;
          peaceful?: boolean;
        };
        Update: {};
      };
      guides: {
        Row: {
          id: string;
          name: string;
          avatar_url: string;
          specialties: string[];
          languages: string[];
          rating: number;
          review_count: number;
          price_per_day: number;
          available: boolean;
          verified: boolean;
          bio: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          avatar_url: string;
          specialties: string[];
          languages: string[];
          rating?: number;
          review_count?: number;
          price_per_day: number;
          available?: boolean;
          verified?: boolean;
          bio: string;
        };
        Update: {};
      };
      stays: {
        Row: {
          id: string;
          name: string;
          slug: string;
          type: string;
          region: string;
          location: string;
          image_url: string;
          description: string;
          amenities: string[];
          price_per_night: number;
          rating: number;
          review_count: number;
          badge: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          type: string;
          region: string;
          location: string;
          image_url: string;
          description: string;
          amenities: string[];
          price_per_night: number;
          rating?: number;
          review_count?: number;
          badge?: string | null;
        };
        Update: {};
      };
      trips: {
        Row: {
          id: string;
          user_id: string;
          destination_id: string;
          name: string;
          start_date: string;
          end_date: string;
          status: string;
          budget_npr: number;
          notes: string | null;
          rating: number | null;
          created_at: string;
          destination?: destinations['Row'];
        };
        Insert: {
          id?: string;
          user_id: string;
          destination_id: string;
          name: string;
          start_date: string;
          end_date: string;
          status?: string;
          budget_npr: number;
          notes?: string | null;
          rating?: number | null;
        };
        Update: {};
      };
      sos_alerts: {
        Row: {
          id: string;
          user_id: string;
          latitude: number;
          longitude: number;
          message: string | null;
          resolved: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          latitude: number;
          longitude: number;
          message?: string | null;
          resolved?: boolean;
        };
        Update: {};
      };
      reviews: {
        Row: {
          id: string;
          user_id: string;
          destination_id: string | null;
          guide_id: string | null;
          stay_id: string | null;
          rating: number;
          content: string;
          user_name: string;
          user_location: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          destination_id?: string | null;
          guide_id?: string | null;
          stay_id?: string | null;
          rating: number;
          content: string;
          user_name: string;
          user_location: string;
        };
        Update: {};
      };
      quotes: {
        Row: {
          id: string;
          text: string;
          author: string;
          order_index: number;
        };
        Insert: {
          id?: string;
          text: string;
          author: string;
          order_index?: number;
        };
        Update: {};
      };
    };
  };
}

// Helper to get user profile
export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

// Helper to search destinations
export async function searchDestinations(query: string) {
  const { data, error } = await supabase
    .from('destinations')
    .select('*')
    .or(`name.ilike.%${query}%,category.ilike.%${query}%,region.ilike.%${query}%`)
    .limit(10);

  if (error) throw error;
  return data;
}
