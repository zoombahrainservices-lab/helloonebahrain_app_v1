import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { api } from '../lib/api';
import { getSupabase } from '../lib/supabase';
import { User } from '../lib/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, phone: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  loginWithGoogle: () => Promise<void>; // Google OAuth login
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [justLoggedOut, setJustLoggedOut] = useState(false);
  const [isOAuthInProgress, setIsOAuthInProgress] = useState(false);

  const fetchMe = async () => {
    // Don't fetch if we're in the middle of logging out
    if (isLoggingOut) {
      if (__DEV__) {
        console.log('⏸️ fetchMe skipped - logout in progress');
      }
      setLoading(false);
      return;
    }

    // Don't fetch if user just logged out (prevents re-authentication)
    if (justLoggedOut) {
      if (__DEV__) {
        console.log('⏸️ fetchMe skipped - user just logged out');
      }
      setUser(null);
      setLoading(false);
      return;
    }

    // Don't fetch if OAuth is in progress (prevents timeout during OAuth)
    if (isOAuthInProgress) {
      if (__DEV__) {
        console.log('⏸️ fetchMe skipped - OAuth in progress');
      }
      // Don't set loading to false here - OAuth will handle it
      return;
    }

    try {
      if (__DEV__) {
        console.log('🔄 Checking authentication status...');
      }

      // Try Supabase session first (for Google auth users)
      const supabase = getSupabase();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // User logged in via Supabase (Google auth)
        if (__DEV__) {
          console.log('✅ Supabase session found');
        }
        const supabaseUser = session.user;
        
        // Ensure user exists in users table (for foreign key constraints)
        try {
          const { ensureUserExists } = await import('../lib/user-helpers');
          await ensureUserExists(
            supabaseUser.id,
            supabaseUser.email || '',
            supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User'
          );
        } catch (error) {
          if (__DEV__) {
            console.error('Error ensuring user exists:', error);
          }
          // Continue anyway - the trigger should handle it
        }
        
        setUser({
          id: supabaseUser.id,
          name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User',
          email: supabaseUser.email || '',
          role: (supabaseUser.user_metadata?.role as 'user' | 'admin') || 'user',
        });
        if (session.access_token) {
          await AsyncStorage.setItem('token', session.access_token);
        }
        setLoading(false);
        return;
      }

      // Fallback to backend API (for regular login users)
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        if (__DEV__) {
          console.log('ℹ️ No token found, user not logged in');
        }
        setUser(null);
        setLoading(false);
        return;
      }

      // Only try backend API if token looks like a JWT (not a Supabase token)
      // Supabase tokens are very long, backend JWTs are shorter
      if (token.length > 500) {
        // This is likely a Supabase token, but no session exists
        // Try to refresh the session first
        if (__DEV__) {
          console.log('ℹ️ Supabase token found but no session, attempting refresh...');
        }
        
        try {
          const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshedSession && !refreshError) {
            if (__DEV__) {
              console.log('✅ Session refreshed successfully');
            }
            const supabaseUser = refreshedSession.user;
            setUser({
              id: supabaseUser.id,
              name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User',
              email: supabaseUser.email || '',
              role: (supabaseUser.user_metadata?.role as 'user' | 'admin') || 'user',
            });
            if (refreshedSession.access_token) {
              await AsyncStorage.setItem('token', refreshedSession.access_token);
            }
            setLoading(false);
            return;
          }
        } catch (refreshErr) {
          if (__DEV__) {
            console.log('ℹ️ Session refresh failed:', refreshErr);
          }
        }
        
        // If refresh failed, clear the token
        if (__DEV__) {
          console.log('ℹ️ Clearing invalid Supabase token...');
        }
        await AsyncStorage.removeItem('token');
        setUser(null);
        setLoading(false);
        return;
      }

      // Try backend API
      if (__DEV__) {
        console.log('🔄 Checking backend API...');
      }
      const response = await api.get('/api/auth/me');
      setUser(response.data.user);
      if (__DEV__) {
        console.log('✅ Backend authentication successful');
      }
    } catch (error: any) {
      // Only log errors that aren't 401 (unauthorized)
      if (__DEV__ && error.response?.status !== 401) {
        console.error('❌ fetchMe failed:', error);
      }
      setUser(null);
      // Clear invalid token
      await AsyncStorage.removeItem('token');
    } finally {
      setLoading(false);
      if (__DEV__) {
        console.log('✅ Auth check complete, loading:', false);
      }
    }
  };

  useEffect(() => {
    // Add timeout to prevent infinite loading (only if OAuth is not in progress)
    const timeout = setTimeout(() => {
      if (loading && !isOAuthInProgress) {
        if (__DEV__) {
          console.warn('⚠️ Auth check taking too long, forcing completion');
        }
        setLoading(false);
      }
    }, 10000); // 10 second timeout (reduced since OAuth has its own handling)

    fetchMe();

    // Listen for auth state changes (for OAuth redirects)
    const supabase = getSupabase();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (__DEV__) {
        console.log('🔄 Auth state changed:', event, session?.user?.email);
      }
      
      if (event === 'SIGNED_IN' && session?.user) {
        // Skip if OAuth is in progress OR if user is already set (prevents duplicate)
        if (isOAuthInProgress) {
          if (__DEV__) {
            console.log('⏸️ Skipping onAuthStateChange - OAuth in progress, loginWithGoogle() will handle');
          }
          return;
        }
        
        // Also skip if user is already set (prevents duplicate from OAuth)
        if (user?.id === session.user.id) {
          if (__DEV__) {
            console.log('⏸️ Skipping onAuthStateChange - user already set, likely from OAuth');
          }
          return;
        }
        
        // User signed in (likely from other auth method, not OAuth)
        const supabaseUser = session.user;
        
        // Ensure user exists in users table (for foreign key constraints)
        try {
          const { ensureUserExists } = await import('../lib/user-helpers');
          await ensureUserExists(
            supabaseUser.id,
            supabaseUser.email || '',
            supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User'
          );
        } catch (error) {
          if (__DEV__) {
            console.error('Error ensuring user exists:', error);
          }
        }
        
        setUser({
          id: supabaseUser.id,
          name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User',
          email: supabaseUser.email || '',
          role: (supabaseUser.user_metadata?.role as 'user' | 'admin') || 'user',
        });
        if (session.access_token) {
          await AsyncStorage.setItem('token', session.access_token);
        }
        setLoading(false);
        
        if (__DEV__) {
          console.log('✅ User signed in via auth state change');
        }
      } else if (event === 'SIGNED_OUT') {
        // User signed out
        setUser(null);
        await AsyncStorage.removeItem('token');
        setLoading(false);
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        // Token refreshed - update user state
        const supabaseUser = session.user;
        setUser({
          id: supabaseUser.id,
          name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User',
          email: supabaseUser.email || '',
          role: (supabaseUser.user_metadata?.role as 'user' | 'admin') || 'user',
        });
        if (session.access_token) {
          await AsyncStorage.setItem('token', session.access_token);
        }
      }
    });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const login = async (identifier: string, password: string) => {
    // Determine if identifier is email or username
    const isEmail = identifier.includes('@');
    
    if (isEmail) {
      // Try Supabase auth first for email login
      const supabase = getSupabase();
      const { data: supabaseData, error: supabaseError } = await supabase.auth.signInWithPassword({
        email: identifier,
        password: password,
      });

      if (supabaseError) {
        // If Supabase auth fails, try backend API as fallback
        // This handles cases where user was registered via backend API
        if (__DEV__) {
          console.log('⚠️ Supabase auth failed, trying backend API:', supabaseError.message);
        }
        
        try {
          const response = await api.post('/api/auth/login', { identifier, password });
          setUser(response.data.user);
          if (response.data.token) {
            await AsyncStorage.setItem('token', response.data.token);
            await AsyncStorage.setItem('backend_token', response.data.token);
          }
          if (__DEV__) {
            console.log('✅ Backend API login successful');
          }
          return;
        } catch (backendError: any) {
          // If both fail, throw the original Supabase error with better message
          if (__DEV__) {
            console.error('❌ Both Supabase and backend login failed');
            console.error('Supabase error:', supabaseError);
            console.error('Backend error:', backendError);
          }
          
          // Provide helpful error message
          if (supabaseError.message?.includes('Invalid login credentials') || 
              supabaseError.message?.includes('Email not confirmed') ||
              supabaseError.message?.includes('User not found')) {
            throw new Error('Invalid email or password. Please check your credentials and try again.');
          }
          throw supabaseError;
        }
      }

      // Supabase login successful
      if (supabaseData?.user) {
        // Ensure user exists in users table (for foreign key constraints)
        try {
          const { ensureUserExists } = await import('../lib/user-helpers');
          await ensureUserExists(
            supabaseData.user.id,
            supabaseData.user.email || '',
            supabaseData.user.user_metadata?.full_name || supabaseData.user.email?.split('@')[0] || 'User'
          );
        } catch (error) {
          if (__DEV__) {
            console.error('Error ensuring user exists:', error);
          }
          // Continue anyway - the trigger should handle it
        }
        
        // Set user from Supabase
        setUser({
          id: supabaseData.user.id,
          name: supabaseData.user.user_metadata?.full_name || supabaseData.user.email?.split('@')[0] || 'User',
          email: supabaseData.user.email || '',
          role: (supabaseData.user.user_metadata?.role as 'user' | 'admin') || 'user',
        });
        
        // Store session token
        if (supabaseData.session?.access_token) {
          await AsyncStorage.setItem('token', supabaseData.session.access_token);
        }
        
        if (__DEV__) {
          console.log('✅ Supabase login successful');
        }
      }
    } else {
      // Username login - use backend API
      try {
        const response = await api.post('/api/auth/login', { identifier, password });
        setUser(response.data.user);
        if (response.data.token) {
          await AsyncStorage.setItem('token', response.data.token);
          await AsyncStorage.setItem('backend_token', response.data.token);
        }
        if (__DEV__) {
          console.log('✅ Backend API login successful');
        }
      } catch (error: any) {
        if (__DEV__) {
          console.error('❌ Backend API login failed:', error);
        }
        // If backend fails (CORS), show helpful error
        if (error.code === 'ERR_NETWORK' || error.message?.includes('CORS')) {
          throw new Error('Network error. Please check your internet connection and try again.');
        }
        if (error.response?.status === 401) {
          throw new Error('Invalid username or password. Please check your credentials and try again.');
        }
        throw error;
      }
    }
  };

  const register = async (name: string, email: string, password: string, phone: string) => {
    const response = await api.post('/api/auth/register', { name, email, password, phone });
    setUser(response.data.user);
    if (response.data.token) {
      await AsyncStorage.setItem('token', response.data.token);
      // Also store as backend_token for consistency
      await AsyncStorage.setItem('backend_token', response.data.token);
    }
  };

  const logout = async () => {
    try {
      if (__DEV__) {
        console.log('🚪 LOGOUT FUNCTION CALLED');
        console.log('🚪 LOGOUT STARTED');
      }

      // Set flag to prevent fetchMe from running during logout
      setIsLoggingOut(true);
      
      // Clear user state IMMEDIATELY to show logged out state
      setUser(null);
      
      if (__DEV__) {
        console.log('✅ User state set to null');
      }

      // Sign out from Supabase (for Google auth users) - MUST be first
      const supabase = getSupabase();
      
      if (__DEV__) {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('📋 Current session exists:', !!session);
      }
      
      // Force sign out regardless of session check
      await supabase.auth.signOut();
      
      // Wait and verify session is cleared (try multiple times)
      for (let i = 0; i < 3; i++) {
        await new Promise(resolve => setTimeout(resolve, 200));
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          if (__DEV__) {
            console.log(`✅ Supabase session cleared (attempt ${i + 1})`);
          }
          break;
        } else if (i === 2) {
          // Last attempt, force clear
          if (__DEV__) {
            console.log('⚠️ Supabase session still exists, forcing clear...');
          }
          await supabase.auth.signOut();
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      // Final verification
      const { data: { session: finalSession } } = await supabase.auth.getSession();
      if (__DEV__) {
        console.log('✅ Final Supabase session check:', !!finalSession);
      }

      // Google OAuth is handled by Supabase, no need to sign out from native library

      // Sign out from backend API (for regular login users)
    try {
      await api.post('/api/auth/logout');
        if (__DEV__) {
          console.log('✅ Backend API signed out');
        }
      } catch (error) {
        if (__DEV__) {
          console.log('⏭️ Backend logout skipped (not applicable)');
        }
      }
    } catch (error) {
      if (__DEV__) {
        console.error('❌ Logout error:', error);
      }
    } finally {
      // Clear all storage FIRST
      await AsyncStorage.removeItem('token');
      await AsyncStorage.clear(); // Clear everything to be safe
      
      // Set justLoggedOut flag to prevent re-authentication
      setJustLoggedOut(true);
      setUser(null); // Ensure user is null
      
      if (__DEV__) {
        console.log('✅ Storage cleared');
        console.log('✅ User state cleared');
        console.log('🚪 LOGOUT COMPLETE');
      }
      
      // Reset logout flag after delay
      setTimeout(() => {
        setIsLoggingOut(false);
        if (__DEV__) {
          console.log('🔓 Logout flag reset');
        }
      }, 2000); // Increased to 2 seconds
      
      // Reset justLoggedOut flag after longer delay (prevents re-auth for 5 seconds)
      setTimeout(() => {
        setJustLoggedOut(false);
        if (__DEV__) {
          console.log('🔓 Just logged out flag reset - can check auth again');
        }
      }, 5000); // 5 second protection period
    }
  };

  const loginWithGoogle = async () => {
    // Set OAuth in progress flag to skip fetchMe
    setIsOAuthInProgress(true);
    setLoading(true); // Show loading during OAuth
    
    try {
      const supabase = getSupabase();
      // Use Platform.OS for reliable platform detection
      const isWeb = Platform.OS === 'web';
      
      if (isWeb && typeof window !== 'undefined' && window.location) {
        // Web: Use Supabase OAuth redirect
        if (__DEV__) {
          console.log('🌐 Starting Google OAuth (Web)...');
        }
        
        // Get current origin and ensure it's properly formatted
        // Use full URL including path to ensure proper redirect
        const redirectUrl = window.location.origin;
        const currentPath = window.location.pathname;
        const fullRedirectUrl = redirectUrl + (currentPath !== '/' ? currentPath : '');
        
        if (__DEV__) {
          console.log('🌐 Starting Google OAuth...');
          console.log('🌐 Current origin:', redirectUrl);
          console.log('🌐 Current path:', currentPath);
          console.log('🌐 Full URL:', window.location.href);
          console.log('🌐 Redirect URL being sent:', redirectUrl);
          console.log('⚠️  Make sure this URL is in Supabase → Settings → Redirect URLs');
        }
        
        // Use Supabase OAuth with proper redirect
        // The redirectTo must match EXACTLY what's in Supabase settings
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: redirectUrl,
            skipBrowserRedirect: false,
          },
        });
        
        if (error) {
          if (__DEV__) {
            console.error('❌ Google OAuth error:', error);
            console.error('❌ Error details:', JSON.stringify(error, null, 2));
          }
          
          // Provide helpful error message
          let errorMessage = error.message || 'Google OAuth failed';
          if (error.message?.includes('redirect_uri_mismatch') || error.message?.includes('500') || error.message?.includes('unexpected')) {
            errorMessage = `❌ SUPABASE GOOGLE OAUTH NOT CONFIGURED\n\n` +
              `The 500 error means Supabase Google OAuth provider is not properly set up.\n\n` +
              `REQUIRED STEPS:\n\n` +
              `1. Go to Supabase Dashboard → Auth → Providers\n` +
              `2. Click on "Google" provider\n` +
              `3. Toggle "Enable Google provider" to ON\n` +
              `4. Add Client ID: ${Constants.expoConfig?.extra?.googleWebClientId}\n` +
              `5. Add Client Secret (get from Google Cloud Console)\n` +
              `6. Go to Supabase → Settings → General\n` +
              `7. Add Redirect URLs:\n` +
              `   • ${redirectUrl}\n` +
              `   • http://localhost:19006\n` +
              `   • https://clmhzxiuzqvebzlkbdjs.supabase.co/auth/v1/callback\n` +
              `8. Go to Google Cloud Console → Credentials\n` +
              `9. Add Redirect URI: https://clmhzxiuzqvebzlkbdjs.supabase.co/auth/v1/callback\n\n` +
              `See SETUP_GOOGLE_OAUTH.md for detailed instructions.`;
          }
          
          throw new Error(errorMessage);
        }
        
        // Check if the OAuth URL contains an error (500 from Supabase)
        if (data?.url && (data.url.includes('error=') || data.url.includes('500'))) {
          throw new Error(
            `❌ SUPABASE GOOGLE OAUTH NOT CONFIGURED\n\n` +
            `The 500 error means Supabase Google OAuth provider is not properly set up.\n\n` +
            `REQUIRED STEPS:\n\n` +
            `1. Go to Supabase Dashboard → Auth → Providers\n` +
            `2. Click on "Google" provider\n` +
            `3. Toggle "Enable Google provider" to ON\n` +
            `4. Add Client ID: ${Constants.expoConfig?.extra?.googleWebClientId}\n` +
            `5. Add Client Secret (get from Google Cloud Console)\n` +
            `6. Go to Supabase → Settings → General\n` +
            `7. Add Redirect URLs:\n` +
            `   • ${redirectUrl}\n` +
            `   • http://localhost:19006\n` +
            `   • https://clmhzxiuzqvebzlkbdjs.supabase.co/auth/v1/callback\n` +
            `8. Go to Google Cloud Console → Credentials\n` +
            `9. Add Redirect URI: https://clmhzxiuzqvebzlkbdjs.supabase.co/auth/v1/callback\n\n` +
            `See SETUP_GOOGLE_OAUTH.md for detailed instructions.`
          );
        }
        
        // On web, the redirect will happen automatically
        // The OAuth callback will be handled in App.tsx
        if (__DEV__) {
          console.log('✅ Google OAuth redirect initiated');
          console.log('✅ Redirect URL:', data?.url || 'Will redirect automatically');
        }
      } else {
        // Mobile: Use Supabase OAuth with WebBrowser
        if (__DEV__) {
          console.log('📱 Starting Google OAuth (Mobile)...');
          console.log('📱 Platform:', Platform.OS);
        }
        
        try {
          // Get the redirect URL for mobile (using expo-linking with the app scheme)
          // Use the scheme from app.json (hellobahrain://)
          // Use the exact format that matches Supabase settings: hellobahrain://
          const redirectUrl = 'hellobahrain://';
          
          if (__DEV__) {
            console.log('📱 Redirect URL:', redirectUrl);
            console.log('⚠️  Make sure this EXACT URL is in Supabase → Settings → Redirect URLs');
            console.log('⚠️  Supabase redirect URL must be: hellobahrain:// (exact match, no trailing slash)');
          }
          
          // Start OAuth flow - use skipBrowserRedirect: true for mobile to handle manually
          const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: redirectUrl,
              skipBrowserRedirect: true, // We'll open the browser manually on mobile
            },
          });
          
          if (oauthError) {
            if (__DEV__) {
              console.error('❌ Google OAuth error:', oauthError);
              console.error('❌ Error code:', oauthError.status || oauthError.code);
              console.error('❌ Error message:', oauthError.message);
              console.error('❌ Full error:', JSON.stringify(oauthError, null, 2));
            }
            
            // Provide helpful error message based on error type
            let errorMessage = oauthError.message || 'Google OAuth failed';
            
            // Check for specific error types
            if (oauthError.message?.includes('redirect_uri_mismatch') || 
                oauthError.message?.includes('500') || 
                oauthError.message?.includes('unexpected') ||
                oauthError.status === 500) {
              errorMessage = `❌ SUPABASE GOOGLE OAUTH CONFIGURATION ISSUE\n\n` +
                `Error: ${oauthError.message}\n\n` +
                `VERIFY THESE SETTINGS:\n\n` +
                `1. Supabase → Auth → Providers → Google:\n` +
                `   • Enable Google provider: ON\n` +
                `   • Client ID: ${Constants.expoConfig?.extra?.googleWebClientId}\n` +
                `   • Client Secret: Set (from Google Cloud Console)\n\n` +
                `2. Supabase → Settings → URL Configuration:\n` +
                `   • Site URL: hellobahrain://\n` +
                `   • Redirect URLs must include: hellobahrain://\n\n` +
                `3. Google Cloud Console → Credentials:\n` +
                `   • Redirect URI: https://clmhzxiuzqvebzlkbdjs.supabase.co/auth/v1/callback\n\n` +
                `After making changes, wait 2-3 minutes and try again.`;
            } else if (oauthError.message?.includes('provider_disabled') || 
                       oauthError.message?.includes('not enabled')) {
              errorMessage = `❌ GOOGLE PROVIDER NOT ENABLED\n\n` +
                `Go to Supabase → Auth → Providers → Google\n` +
                `Toggle "Enable Google provider" to ON and save.`;
            } else {
              errorMessage = `Google OAuth failed: ${oauthError.message}\n\n` +
                `Please check Supabase Google OAuth configuration.`;
            }
            
            throw new Error(errorMessage);
          }
          
          if (!data?.url) {
            throw new Error(
              `❌ GOOGLE OAUTH URL NOT GENERATED\n\n` +
              `Supabase did not return an OAuth URL. This usually means:\n\n` +
              `1. Google provider is not enabled in Supabase\n` +
              `2. Client ID or Client Secret is missing\n` +
              `3. Redirect URL is not configured\n\n` +
              `Check Supabase → Auth → Providers → Google settings.`
            );
          }
          
          if (data.url) {
            // Check if the URL contains an error (500 from Supabase)
            if (data.url.includes('error=') || data.url.includes('500')) {
              throw new Error(
                `❌ SUPABASE GOOGLE OAUTH NOT CONFIGURED\n\n` +
                `The 500 error means Supabase Google OAuth provider is not properly set up.\n\n` +
                `REQUIRED STEPS:\n\n` +
                `1. Go to Supabase Dashboard → Auth → Providers\n` +
                `2. Click on "Google" provider\n` +
                `3. Toggle "Enable Google provider" to ON\n` +
                `4. Add Client ID: ${Constants.expoConfig?.extra?.googleWebClientId}\n` +
                `5. Add Client Secret (get from Google Cloud Console)\n` +
                `6. Go to Supabase → Settings → General\n` +
                `7. Add Redirect URLs:\n` +
                `   • ${redirectUrl}\n` +
                `   • hellobahrain://\n` +
                `   • https://clmhzxiuzqvebzlkbdjs.supabase.co/auth/v1/callback\n` +
                `8. Go to Google Cloud Console → Credentials\n` +
                `9. Add Redirect URI: https://clmhzxiuzqvebzlkbdjs.supabase.co/auth/v1/callback\n\n` +
                `See SETUP_GOOGLE_OAUTH.md for detailed instructions.`
              );
            }
            
            // Complete any existing auth session before opening a new one
            // This prevents the "invalid state" error
            try {
              WebBrowser.maybeCompleteAuthSession();
            } catch (e) {
              // Ignore errors from maybeCompleteAuthSession
              if (__DEV__) {
                console.log('ℹ️ maybeCompleteAuthSession:', e);
              }
            }
            
            // Open the OAuth URL in browser
            if (__DEV__) {
              console.log('📱 Opening OAuth URL in browser...');
              console.log('📱 OAuth URL:', data.url);
            }
            
            // Use openAuthSessionAsync - this will handle the OAuth flow
            // The redirect will come back via deep link, which App.tsx will handle
            if (__DEV__) {
              console.log('📱 About to open OAuth URL in browser...');
              console.log('📱 OAuth URL:', data.url);
              console.log('📱 Redirect URL:', redirectUrl);
            }
            
            const result = await WebBrowser.openAuthSessionAsync(
              data.url,
              redirectUrl
            );
            
            if (__DEV__) {
              console.log('📱 OAuth result type:', result.type);
              console.log('📱 OAuth result:', JSON.stringify(result, null, 2));
              if (result.url) {
                console.log('📱 Result URL:', result.url);
                console.log('📱 Result URL length:', result.url.length);
              }
            }
            
            // Check for cancellation
            if (result.type === 'cancel') {
              throw new Error('Google sign-in was cancelled');
            }
            
            // Check for dismiss
            if (result.type === 'dismiss') {
              throw new Error('Google sign-in was dismissed');
            }
            
            // Check if result URL contains error
            if (result.url && (result.url.includes('error=') || result.url.includes('500'))) {
              const urlParams = new URLSearchParams(result.url.split('?')[1] || '');
              const error = urlParams.get('error') || 'unknown_error';
              const errorDescription = urlParams.get('error_description') || 'Google OAuth failed';
              
              if (error === '500' || error.includes('unexpected') || errorDescription.includes('500')) {
                throw new Error(
                  `❌ SUPABASE GOOGLE OAUTH NOT CONFIGURED\n\n` +
                  `The 500 error means Supabase Google OAuth provider is not properly set up.\n\n` +
                  `REQUIRED STEPS:\n\n` +
                  `1. Go to Supabase Dashboard → Auth → Providers\n` +
                  `2. Click on "Google" provider\n` +
                  `3. Toggle "Enable Google provider" to ON\n` +
                  `4. Add Client ID: ${Constants.expoConfig?.extra?.googleWebClientId}\n` +
                  `5. Add Client Secret (get from Google Cloud Console)\n` +
                  `6. Go to Supabase → Settings → General\n` +
                  `7. Add Redirect URLs:\n` +
                  `   • ${redirectUrl}\n` +
                  `   • hellobahrain://\n` +
                  `   • https://clmhzxiuzqvebzlkbdjs.supabase.co/auth/v1/callback\n` +
                  `8. Go to Google Cloud Console → Credentials\n` +
                  `9. Add Redirect URI: https://clmhzxiuzqvebzlkbdjs.supabase.co/auth/v1/callback\n\n` +
                  `See SETUP_GOOGLE_OAUTH.md for detailed instructions.`
                );
              }
            }
            
            if (result.type === 'success') {
              // Extract the URL from the result
              const url = result.url;
              
              if (__DEV__) {
                console.log('📱 OAuth callback URL received:', url);
                console.log('📱 URL length:', url.length);
              }
              
              // Complete the auth session to close browser (only call once)
              // Don't call again - already called before opening browser
              
              // Extract parameters from both hash and query string
              // Supabase OAuth can use either hash (#) or query (?) parameters
              let accessToken: string | null = null;
              let refreshToken: string | null = null;
              let error: string | null = null;
              let errorDescription: string | null = null;
              
              // Check hash parameters first (most common for mobile)
              const hashIndex = url.indexOf('#');
              if (hashIndex !== -1) {
                const hash = url.substring(hashIndex + 1);
                const hashParams = new URLSearchParams(hash);
                accessToken = hashParams.get('access_token');
                refreshToken = hashParams.get('refresh_token');
                error = hashParams.get('error');
                errorDescription = hashParams.get('error_description');
              }
              
              // Check query parameters if not found in hash
              if (!accessToken) {
                const queryIndex = url.indexOf('?');
                if (queryIndex !== -1) {
                  const query = url.substring(queryIndex + 1).split('#')[0]; // Remove hash if present
                  const queryParams = new URLSearchParams(query);
                  accessToken = queryParams.get('access_token');
                  refreshToken = queryParams.get('refresh_token');
                  if (!error) error = queryParams.get('error');
                  if (!errorDescription) errorDescription = queryParams.get('error_description');
                }
              }
              
              if (__DEV__) {
                console.log('📱 Extracted from URL:', {
                  hasAccessToken: !!accessToken,
                  hasRefreshToken: !!refreshToken,
                  error: error,
                  errorDescription: errorDescription,
                  urlHasHash: hashIndex !== -1,
                  urlHasQuery: url.includes('?'),
                });
              }
              
              // Check for errors
              if (error) {
                throw new Error(`Google OAuth error: ${errorDescription || error}`);
              }
              
              // If we have tokens, set the session manually
              if (accessToken && refreshToken) {
                if (__DEV__) {
                  console.log('📱 Setting session from tokens...');
                }
                
                try {
                  // Set the session manually using the tokens
                  if (__DEV__) {
                    console.log('📱 Calling supabase.auth.setSession()...');
                  }
                  
                  // Set session - this will trigger onAuthStateChange
                  if (__DEV__) {
                    console.log('📱 About to call setSession with tokens...');
                  }
                  
                  const sessionResult = await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken,
                  });
                  
                  if (__DEV__) {
                    console.log('📱 setSession() completed, checking result...');
                    console.log('📱 Has session data:', !!sessionResult.data?.session);
                    console.log('📱 Has error:', !!sessionResult.error);
                  }
                  
                  if (sessionResult.error) {
                    if (__DEV__) {
                      console.error('❌ Error setting session:', sessionResult.error);
                    }
                    setLoading(false);
                    setIsOAuthInProgress(false);
                    throw new Error(`Failed to set session: ${sessionResult.error.message}`);
                  }
                  
                  const newSession = sessionResult.data?.session;
                  
                  // Wait a moment for onAuthStateChange to fire (it fires asynchronously)
                  if (__DEV__) {
                    console.log('📱 Waiting 200ms for onAuthStateChange...');
                  }
                  await new Promise(resolve => setTimeout(resolve, 200));
                  
                  // Get the session again to ensure we have the latest
                  if (__DEV__) {
                    console.log('📱 Getting current session...');
                  }
                  const { data: { session: currentSession } } = await supabase.auth.getSession();
                  
                  if (__DEV__) {
                    console.log('📱 Current session has user:', !!currentSession?.user);
                    console.log('📱 New session has user:', !!newSession?.user);
                  }
                  
                  if (!currentSession?.user && !newSession?.user) {
                    if (__DEV__) {
                      console.error('❌ No user in session after setSession');
                    }
                    setLoading(false);
                    setIsOAuthInProgress(false);
                    throw new Error('No user data received after setting session');
                  }
                  
                  // Use currentSession if available, otherwise newSession
                  const sessionUser = currentSession?.user || newSession?.user;
                  
                  if (__DEV__) {
                    console.log('✅ Session confirmed, user:', sessionUser.email);
                  }
                  
                  // Set user IMMEDIATELY - don't wait for ensureUserExists
                  const userData = {
                    id: sessionUser.id,
                    name: sessionUser.user_metadata?.full_name || sessionUser.email?.split('@')[0] || 'User',
                    email: sessionUser.email || '',
                    role: (sessionUser.user_metadata?.role as 'user' | 'admin') || 'user',
                  };
                  
                  if (__DEV__) {
                    console.log('✅ Setting user state IMMEDIATELY:', userData.email);
                  }
                  
                  // Set user and clear loading IMMEDIATELY - THIS IS CRITICAL
                  setUser(userData);
                  setLoading(false); // CRITICAL: Clear loading NOW
                  
                  // Store token immediately (don't await - do in background to not block)
                  const sessionToken = currentSession?.access_token || newSession?.access_token;
                  if (sessionToken) {
                    AsyncStorage.setItem('token', sessionToken).then(() => {
                      if (__DEV__) {
                        console.log('✅ Token stored');
                      }
                    }).catch((err) => {
                      if (__DEV__) {
                        console.warn('⚠️ Token storage error (non-critical):', err);
                      }
                    });
                  }
                  
                  // Ensure user exists in background (don't block)
                  (async () => {
                    try {
                      const { ensureUserExists } = await import('../lib/user-helpers');
                      await ensureUserExists(
                        sessionUser.id,
                        sessionUser.email || '',
                        sessionUser.user_metadata?.full_name || sessionUser.email?.split('@')[0] || 'User'
                      );
                      if (__DEV__) {
                        console.log('✅ User ensured in users table');
                      }
                    } catch (error) {
                      if (__DEV__) {
                        console.warn('⚠️ Error ensuring user exists (non-critical):', error);
                      }
                    }
                  })();
                  
                  // Reset OAuth flag after brief delay
                  setTimeout(() => {
                    setIsOAuthInProgress(false);
                    if (__DEV__) {
                      console.log('✅ OAuth flag reset');
                    }
                  }, 200);
                  
                  if (__DEV__) {
                    console.log('✅✅✅ Google authentication COMPLETE - user logged in:', userData.email);
                    console.log('✅✅✅ Loading cleared, user should see app now');
                  }
                  return; // Success, exit early
                } catch (sessionError: any) {
                  // Catch any errors during session setting
                  if (__DEV__) {
                    console.error('❌ Error in session setting block:', sessionError);
                    console.error('❌ Error stack:', sessionError.stack);
                  }
                  // ALWAYS clear loading on error
                  setLoading(false);
                  setIsOAuthInProgress(false);
                  throw sessionError;
                }
              } else if (__DEV__) {
                console.log('⚠️ No tokens found in callback URL, will try to get session from Supabase');
              }
              
              // Fallback: Wait briefly and check for session (in case tokens weren't in hash)
              if (__DEV__) {
                console.log('📱 Checking if Supabase auto-processed session...');
              }
              await new Promise(resolve => setTimeout(resolve, 500)); // Reduced delay
              
              // Check if we have a session after OAuth
              const { data: { session }, error: sessionError } = await supabase.auth.getSession();
              
              if (sessionError) {
                if (__DEV__) {
                  console.error('❌ Session error after OAuth:', sessionError);
                }
                throw new Error(sessionError.message || 'Failed to get session after OAuth');
              }
              
              if (session?.user) {
                // Ensure user exists in users table (for foreign key constraints)
                try {
                  const { ensureUserExists } = await import('../lib/user-helpers');
                  await ensureUserExists(
                    session.user.id,
                    session.user.email || '',
                    session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User'
                  );
                } catch (error) {
                  if (__DEV__) {
                    console.error('Error ensuring user exists:', error);
                  }
                  // Continue anyway - the trigger should handle it
                }
                
                // Set user from Supabase IMMEDIATELY
                const userData = {
                  id: session.user.id,
                  name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
                  email: session.user.email || '',
                  role: (session.user.user_metadata?.role as 'user' | 'admin') || 'user',
                };
                
                setUser(userData);
                
                // Store session token
                if (session.access_token) {
                  await AsyncStorage.setItem('token', session.access_token);
                }
                
                // Clear loading IMMEDIATELY
                setLoading(false);
                
                // Reset OAuth flag after a brief delay to let onAuthStateChange skip
                setTimeout(() => {
                  setIsOAuthInProgress(false);
                }, 100);
                
                if (__DEV__) {
                  console.log('✅ Google authentication successful (fallback) - user logged in:', userData.email);
                }
                
                // Automatically create backend session for Google auth users (async, don't wait)
                try {
                  const { ensureBackendToken } = await import('../lib/auth-helpers');
                  ensureBackendToken().then(backendToken => {
                    if (backendToken && __DEV__) {
                      console.log('✅ Backend session created for Google user');
                    }
                  }).catch(() => {
                    // Ignore errors - not critical
                  });
                } catch (importError) {
                  // Ignore import errors
                }
                
                if (__DEV__) {
                  console.log('✅ Google authentication successful - session found and user logged in');
                }
              } else {
                // No session found - this means OAuth callback wasn't processed
                if (__DEV__) {
                  console.error('❌ No session found after OAuth callback');
                  console.error('❌ This usually means:');
                  console.error('   1. Deep link was not received by app');
                  console.error('   2. Tokens were not in callback URL');
                  console.error('   3. Supabase did not process the callback');
                }
                setLoading(false); // Clear loading even on error
                setIsOAuthInProgress(false); // Reset OAuth flag
                throw new Error(
                  'Google authentication failed: No session received. ' +
                  'Please check that the deep link is properly configured and try again.'
                );
              }
            } else if (result.type === 'cancel') {
              if (__DEV__) {
                console.log('📱 User cancelled OAuth');
              }
              setIsOAuthInProgress(false);
              setLoading(false);
              throw new Error('Google sign-in was cancelled');
            } else {
              setIsOAuthInProgress(false);
              setLoading(false);
              throw new Error('Google OAuth failed');
            }
          } else {
            throw new Error('No OAuth URL received from Supabase');
          }
        } catch (googleError: any) {
          if (__DEV__) {
            console.error('❌ Google OAuth error:', googleError);
          }
          // Re-throw with more context
          throw new Error(googleError.message || 'Google OAuth failed');
        }
      }
    } catch (error: any) {
      // Reset OAuth flag and clear loading on error
      setIsOAuthInProgress(false);
      setLoading(false);
      if (__DEV__) {
        console.error('❌ Google login error:', error);
      }
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, fetchMe, loginWithGoogle }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};



