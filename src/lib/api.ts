import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { getSupabase } from './supabase';

// Get API base URL from environment or use default
// For production, set EXPO_PUBLIC_API_BASE_URL in your .env or app.json
const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl || 
  process.env.EXPO_PUBLIC_API_BASE_URL || 
  'https://hello-bahrain-e-commerce-client.vercel.app';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000,
  withCredentials: false,
});


// Cache for backend JWT tokens (to avoid repeated exchanges)
let backendTokenCache: { supabaseToken: string; backendToken: string; expiresAt: number } | null = null;
const TOKEN_CACHE_DURATION = 55 * 60 * 1000; // 55 minutes (tokens usually expire in 1 hour)

/**
 * Check if token is a Supabase token (longer than 500 chars)
 */
const isSupabaseToken = (token: string): boolean => {
  return token.length > 500;
};

/**
 * Exchange Supabase token for backend JWT token
 * This function tries to get a backend JWT by:
 * 1. First trying to exchange via backend endpoint (if exists)
 * 2. If that fails, using Supabase token with special handling
 */
const exchangeSupabaseTokenForBackendJWT = async (supabaseToken: string): Promise<string | null> => {
  try {
    // Check cache first
    if (backendTokenCache && 
        backendTokenCache.supabaseToken === supabaseToken &&
        backendTokenCache.expiresAt > Date.now()) {
      if (__DEV__) {
        console.log('✅ Using cached backend JWT token');
      }
      return backendTokenCache.backendToken;
    }

    // Try to get backend JWT via exchange endpoint
    // First, try the standard exchange endpoint
    try {
      const exchangeResponse = await axios.post(
        `${API_BASE_URL}/api/auth/exchange-token`,
        { supabaseToken },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseToken}`,
          },
          timeout: 10000,
        }
      );

      if (exchangeResponse.data?.token) {
        const backendToken = exchangeResponse.data.token;
        // Cache the token
        backendTokenCache = {
          supabaseToken,
          backendToken,
          expiresAt: Date.now() + TOKEN_CACHE_DURATION,
        };
        if (__DEV__) {
          console.log('✅ Successfully exchanged Supabase token for backend JWT');
        }
        return backendToken;
      }
    } catch (exchangeError: any) {
      // Exchange endpoint might not exist, that's okay
      if (__DEV__) {
        console.log('ℹ️ Token exchange endpoint not available, will use Supabase token directly');
      }
    }

    // If exchange fails, try to use Supabase session to get user info
    // and create a backend session by registering/logging in the user
    const supabase = getSupabase();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (session && session.user) {
      const userEmail = session.user.email;
      const userName = session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User';
      
      // Try to login user in backend (they might already exist)
      try {
        // First try to login with email (using a dummy password or magic link approach)
        // Since we don't have password, try to register/login via a special endpoint
        const backendAuthResponse = await axios.post(
          `${API_BASE_URL}/api/auth/google-login`,
          {
            email: userEmail,
            name: userName,
            supabaseUserId: session.user.id,
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
            timeout: 10000,
          }
        );

        if (backendAuthResponse.data?.token) {
          const backendToken = backendAuthResponse.data.token;
          // Cache the token
          backendTokenCache = {
            supabaseToken,
            backendToken,
            expiresAt: Date.now() + TOKEN_CACHE_DURATION,
          };
          // Also store the backend token
          await AsyncStorage.setItem('backend_token', backendToken);
          if (__DEV__) {
            console.log('✅ Successfully created backend session from Google user');
          }
          return backendToken;
        }
      } catch (backendAuthError: any) {
        // If login fails, try to register the user
        if (backendAuthError.response?.status === 404 || backendAuthError.response?.status === 401) {
          try {
            const registerResponse = await axios.post(
              `${API_BASE_URL}/api/auth/register`,
              {
                email: userEmail,
                name: userName,
                password: `google_${session.user.id}`, // Dummy password for Google users
                phone: '', // Google users might not have phone
                supabaseUserId: session.user.id,
              },
              {
                headers: {
                  'Content-Type': 'application/json',
                },
                timeout: 10000,
              }
            );

            if (registerResponse.data?.token) {
              const backendToken = registerResponse.data.token;
              backendTokenCache = {
                supabaseToken,
                backendToken,
                expiresAt: Date.now() + TOKEN_CACHE_DURATION,
              };
              await AsyncStorage.setItem('backend_token', backendToken);
              if (__DEV__) {
                console.log('✅ Successfully registered Google user in backend');
              }
              return backendToken;
            }
          } catch (registerError: any) {
            if (__DEV__) {
              console.log('ℹ️ Could not register Google user in backend:', registerError.response?.data || registerError.message);
            }
          }
        } else {
          if (__DEV__) {
            console.log('ℹ️ Backend Google login endpoint not available or failed');
          }
        }
      }
    }

    // If all else fails, return null (will use Supabase token directly)
    return null;
  } catch (error: any) {
    if (__DEV__) {
      console.error('❌ Error exchanging Supabase token:', error);
    }
    return null;
  }
};

// Add request interceptor for auth token
api.interceptors.request.use(
  async (config) => {
    try {
      // Priority 1: Use backend token if available
      let backendToken = await AsyncStorage.getItem('backend_token');
      
      // Priority 2: If no backend token, try to ensure one exists (for Google users)
      // Only try this if we have a Supabase token (Google auth users)
      if (!backendToken || backendToken.length > 500) {
        const supabaseToken = await AsyncStorage.getItem('token');
        if (supabaseToken && isSupabaseToken(supabaseToken)) {
          // Only try to create backend token for Google users (who have Supabase tokens)
          // But don't block if it fails - we can use Supabase token directly
          try {
            const { ensureBackendToken } = await import('./auth-helpers');
            const newBackendToken = await ensureBackendToken();
            if (newBackendToken && newBackendToken.length < 500) {
              backendToken = newBackendToken;
            }
          } catch (error) {
            // Silently fail - we'll use Supabase token instead
            if (__DEV__) {
              console.log('ℹ️ Backend token creation skipped, using Supabase token');
            }
          }
        }
      }
      
      // Priority 3: Fall back to Supabase token
      const supabaseToken = await AsyncStorage.getItem('token');
      
      if (config.headers) {
        if (backendToken && backendToken.length < 500) {
          // Valid backend JWT token
          config.headers.Authorization = `Bearer ${backendToken}`;
          if (__DEV__) {
            console.log('✅ Using backend JWT token for API request');
          }
        } else if (supabaseToken) {
          if (isSupabaseToken(supabaseToken)) {
            // Supabase token - add user info headers for backend compatibility
            config.headers.Authorization = `Bearer ${supabaseToken}`;
            config.headers['X-Auth-Provider'] = 'supabase';
            
            // Add user info in headers so backend can identify the user
            try {
              const supabase = getSupabase();
              const { data: { session } } = await supabase.auth.getSession();
              if (session?.user) {
                config.headers['X-User-Email'] = session.user.email || '';
                config.headers['X-User-Id'] = session.user.id || '';
                config.headers['X-User-Name'] = session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || '';
              }
            } catch (e) {
              // Ignore errors
            }
            
            if (__DEV__) {
              console.log('✅ Using Supabase token for API request (backend will receive user info via headers)');
            }
          } else {
            // Regular backend JWT token stored as 'token'
            config.headers.Authorization = `Bearer ${supabaseToken}`;
            if (__DEV__) {
              console.log('✅ Using backend JWT token for API request');
            }
          }
        }
      }
    } catch (error) {
      console.error('Error getting token from storage:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      // Check if this is a Supabase token issue
      const token = await AsyncStorage.getItem('token').catch(() => null);
      if (token && isSupabaseToken(token)) {
        // Clear the cache to force re-exchange on next request
        backendTokenCache = null;
        
        if (__DEV__) {
          console.log('ℹ️ 401 Unauthorized with Supabase token');
          console.log('ℹ️ This is expected if backend requires JWT tokens');
          console.log('ℹ️ App will continue using Supabase for orders and cart operations');
        }
        
        // Try one more time to exchange the token (non-blocking)
        try {
          const backendToken = await exchangeSupabaseTokenForBackendJWT(token);
          if (backendToken) {
            // Retry the original request with the new token
            if (error.config) {
              error.config.headers.Authorization = `Bearer ${backendToken}`;
              return api.request(error.config);
            }
          }
        } catch (retryError) {
          // Silently fail - Supabase operations will still work
          if (__DEV__) {
            console.log('ℹ️ Backend token exchange not available (non-critical)');
          }
        }
      }
      
      // Handle unauthorized - clear token and redirect to login
      try {
        await AsyncStorage.removeItem('token');
        backendTokenCache = null; // Clear cache
      } catch (e) {
        if (__DEV__) {
          console.error('Error removing token:', e);
        }
      }
    }
    
    // Suppress verbose logging for expected payment gateway errors
    if (__DEV__ && error.response?.data?.message?.toLowerCase().includes('eazypay')) {
      // Only log in dev mode, but don't spam console
      // The error will still be passed to the component for handling
    }
    
    return Promise.reject(error);
  }
);

export default api;
