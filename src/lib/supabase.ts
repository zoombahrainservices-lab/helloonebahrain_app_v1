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
      throw new Error(errorMsg);
    }

    // Detect if we're on web platform
    const isWeb = typeof window !== 'undefined';
    
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        // Enable URL detection for web OAuth callbacks
        detectSessionInUrl: isWeb,
        // Use browser storage on web, AsyncStorage on mobile
        storage: isWeb ? undefined : {
          getItem: async (key: string) => {
            const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
            return await AsyncStorage.getItem(key);
          },
          setItem: async (key: string, value: string) => {
            const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
            return await AsyncStorage.setItem(key, value);
          },
          removeItem: async (key: string) => {
            const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
            return await AsyncStorage.removeItem(key);
          },
        },
      },
    });
  }

  return supabase;
};


export default getSupabase;
