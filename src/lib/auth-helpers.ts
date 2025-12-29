/**
 * Authentication helpers for handling Supabase and Backend token synchronization
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSupabase } from './supabase';
import Constants from 'expo-constants';

const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl || 
  process.env.EXPO_PUBLIC_API_BASE_URL || 
  'https://hello-bahrain-e-commerce-client.vercel.app';

/**
 * Ensures a backend JWT token exists for the current user
 * This is critical for Google auth users who only have Supabase tokens
 * 
 * @returns Backend JWT token or null if creation fails
 */
export async function ensureBackendToken(): Promise<string | null> {
  try {
    // Check if we already have a backend token
    const existingToken = await AsyncStorage.getItem('backend_token');
    if (existingToken) {
      // Verify token is still valid by checking its format (basic check)
      if (existingToken.length < 500) {
        // Backend JWT tokens are shorter than Supabase tokens
        return existingToken;
      }
    }

    // Get Supabase session
    const supabase = getSupabase();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return null;
    }

    const userEmail = session.user.email;
    if (!userEmail) {
      return null;
    }

    const userName = session.user.user_metadata?.full_name || 
                     session.user.email?.split('@')[0] || 
                     'User';
    const supabaseUserId = session.user.id;
    
    // Strategy 1: Try to login with email (user might already exist from previous registration)
    try {
      const loginResponse = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: userEmail,
          password: `google_${supabaseUserId}`, // Use Google user ID as password
        }),
      });

      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        if (loginData.token) {
          await AsyncStorage.setItem('backend_token', loginData.token);
          return loginData.token;
        }
      } else {
        const errorData = await loginResponse.json().catch(() => ({}));
      }
    } catch (loginError: any) {
      // Login failed, continue to next strategy
    }

    // Strategy 2: Try to register the user
    try {
      const registerResponse = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail,
          name: userName,
          password: `google_${supabaseUserId}`, // Use Google user ID as password
          phone: '', // Phone can be empty for Google users
        }),
      });

      if (registerResponse.ok) {
        const registerData = await registerResponse.json();
        if (registerData.token) {
          await AsyncStorage.setItem('backend_token', registerData.token);
          return registerData.token;
        }
      } else {
        const errorData = await registerResponse.json().catch(() => ({}));
        // If user already exists (409 or similar), try login again with a different approach
        if (registerResponse.status === 409 || registerResponse.status === 400) {
          // User exists but login failed - might be password mismatch
          // Try to get token from backend by sending user info
        }
      }
    } catch (registerError: any) {
      // Registration failed, continue to next strategy
    }

    // Strategy 3: If backend has a special endpoint for Google users
    try {
      const googleAuthResponse = await fetch(`${API_BASE_URL}/api/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail,
          name: userName,
          supabaseUserId: supabaseUserId,
        }),
      });

      if (googleAuthResponse.ok) {
        const googleAuthData = await googleAuthResponse.json();
        if (googleAuthData.token) {
          await AsyncStorage.setItem('backend_token', googleAuthData.token);
          return googleAuthData.token;
        }
      }
    } catch (googleAuthError) {
      // Endpoint doesn't exist, that's okay
    }

    // Backend token creation failed, but that's okay
    // The app can still work with Supabase tokens for Supabase operations
    // Backend API calls will use Supabase tokens with special headers
    return null;
  } catch (error: any) {
    return null;
  }
}

/**
 * Gets the appropriate auth token for API requests
 * Prioritizes backend token, falls back to Supabase token
 */
export async function getAuthToken(): Promise<string | null> {
  // First try backend token
  const backendToken = await AsyncStorage.getItem('backend_token');
  if (backendToken && backendToken.length < 500) {
    return backendToken;
  }

  // Fall back to Supabase token
  const supabaseToken = await AsyncStorage.getItem('token');
  return supabaseToken;
}

/**
 * Clears all auth tokens
 */
export async function clearAuthTokens(): Promise<void> {
  await AsyncStorage.removeItem('token');
  await AsyncStorage.removeItem('backend_token');
}

