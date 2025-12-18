import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Get Supabase credentials from environment or app.json
// For production, set these in app.json or environment variables
const SUPABASE_URL = Constants.expoConfig?.extra?.supabaseUrl || 
  process.env.EXPO_PUBLIC_SUPABASE_URL || 
  ''; // You need to set this!

const SUPABASE_ANON_KEY = Constants.expoConfig?.extra?.supabaseAnonKey || 
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 
  ''; // You need to set this!

let supabase: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient => {
  if (!supabase) {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      const errorMsg = 'Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_ANON_KEY in app.json or environment variables.';
      if (__DEV__) {
        console.error('⚠️ Supabase credentials not configured:', {
          hasUrl: !!SUPABASE_URL,
          hasKey: !!SUPABASE_ANON_KEY,
          urlPreview: SUPABASE_URL ? `${SUPABASE_URL.substring(0, 20)}...` : 'Not set',
        });
      }
      throw new Error(errorMsg);
    }

    if (__DEV__) {
      console.log('✅ Creating Supabase client:', {
        url: SUPABASE_URL.substring(0, 30) + '...',
        hasKey: !!SUPABASE_ANON_KEY,
      });
    }

    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }

  return supabase;
};

// Log configuration (without exposing keys) - only in development
if (__DEV__) {
  console.log('Supabase configured:', {
    url: SUPABASE_URL ? `${SUPABASE_URL.substring(0, 20)}...` : 'Not set',
    hasKey: !!SUPABASE_ANON_KEY,
  });
}

export default getSupabase;
