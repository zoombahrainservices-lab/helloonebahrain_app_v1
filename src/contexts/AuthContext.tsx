import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
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

  const fetchMe = async () => {
    // Don't fetch if we're in the middle of logging out
    if (isLoggingOut) {
      setLoading(false);
      return;
    }

    // Don't fetch if user just logged out (prevents re-authentication)
    if (justLoggedOut) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {

      // Try Supabase session first (for Google auth users)
      const supabase = getSupabase();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // User logged in via Supabase (Google auth)
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
        setLoading(false);
        return;
      }

      // Fallback to backend API (for regular login users)
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      // Only try backend API if token looks like a JWT (not a Supabase token)
      // Supabase tokens are very long, backend JWTs are shorter
      if (token.length > 500) {
        // This is likely a Supabase token, but no session exists
        // Try to refresh the session first
        try {
          const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshedSession && !refreshError) {
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
          // Session refresh failed
        }
        
        // If refresh failed, clear the token
        await AsyncStorage.removeItem('token');
        setUser(null);
        setLoading(false);
        return;
      }

      // Try backend API
      const response = await api.get('/api/auth/me');
      setUser(response.data.user);
    } catch (error: any) {
      setUser(null);
      // Clear invalid token
      await AsyncStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Add timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (loading) {
        setLoading(false);
      }
    }, 10000); // 10 second timeout

    fetchMe();

    // Listen for auth state changes (for OAuth redirects)
    const supabase = getSupabase();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // User signed in (likely from OAuth redirect)
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
        
        // Try to create backend token for Google auth users
        try {
          const { ensureBackendToken } = await import('../lib/auth-helpers');
          await ensureBackendToken();
        } catch (error) {
          // Ignore errors - backend token creation is optional
        }
        
        setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        // User signed out
        setUser(null);
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('backend_token');
        setLoading(false);
      }
    });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const login = async (identifier: string, password: string) => {
    // Use Supabase for email/password login (no CORS issues)
    const supabase = getSupabase();
    
    // Determine if identifier is email or username
    const isEmail = identifier.includes('@');
    
    if (isEmail) {
      // Login with email and password using Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: identifier.trim().toLowerCase(),
        password: password,
      });

      if (error) {
        // If Supabase login fails, try backend API as fallback
        // This handles cases where user exists in backend but not in Supabase
        
        try {
          const response = await api.post('/api/auth/login', { 
            identifier: identifier.trim().toLowerCase(), 
            password 
          });
          
          if (response.data.user) {
            // Backend login successful - try to create Supabase session for order creation
            // This ensures orders can be created in Supabase
            try {
              // Try to sign up or sign in to Supabase with same credentials
              // This creates a Supabase user if it doesn't exist
              const supabaseSignIn = await supabase.auth.signInWithPassword({
                email: identifier.trim().toLowerCase(),
                password: password,
              });
              
              // If Supabase sign-in still fails, try to sign up (create new Supabase user)
              if (supabaseSignIn.error) {
                // Note: We can't create Supabase user here without password
                // The user will need to use Supabase login or we need to handle this differently
              }
            } catch (supabaseError) {
              // Supabase session creation failed, but backend login succeeded
              // User can still use the app, but orders might fail
            }
            
            setUser(response.data.user);
            if (response.data.token) {
              await AsyncStorage.setItem('token', response.data.token);
              await AsyncStorage.setItem('backend_token', response.data.token);
            }
            return; // Success via backend
          }
        } catch (backendError: any) {
          // Both Supabase and backend failed
          // Normalize Supabase error to match axios error format for consistent handling
          const normalizedError: any = new Error(error.message || 'Invalid credentials');
          normalizedError.response = {
            data: {
              message: error.message || 'Invalid email or password. Please check your credentials and try again.',
            },
          };
          normalizedError.status = error.status || 401;
          throw normalizedError;
        }
      }

      if (data.user) {
        // Set user from Supabase
        setUser({
          id: data.user.id,
          name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User',
          email: data.user.email || '',
          role: (data.user.user_metadata?.role as 'user' | 'admin') || 'user',
        });
        
        // Store session token
        if (data.session?.access_token) {
          await AsyncStorage.setItem('token', data.session.access_token);
        }
      }
    } else {
      // Username login - try backend API (fallback)
      // Note: This might still have CORS issues on web
      try {
        const response = await api.post('/api/auth/login', { identifier, password });
        setUser(response.data.user);
        if (response.data.token) {
          await AsyncStorage.setItem('token', response.data.token);
          // Also store as backend_token for consistency
          await AsyncStorage.setItem('backend_token', response.data.token);
        }
      } catch (error: any) {
        // If backend fails (CORS), show helpful error
        if (error.code === 'ERR_NETWORK' || error.message?.includes('CORS')) {
          throw new Error('Username login requires backend API. Please use email/password login or contact support.');
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
      // Set flag to prevent fetchMe from running during logout
      setIsLoggingOut(true);
      
      // Clear user state IMMEDIATELY to show logged out state
      setUser(null);

      // Sign out from Supabase (for Google auth users) - MUST be first
      const supabase = getSupabase();
      
      // Force sign out regardless of session check
      await supabase.auth.signOut();
      
      // Wait and verify session is cleared (try multiple times)
      for (let i = 0; i < 3; i++) {
        await new Promise(resolve => setTimeout(resolve, 200));
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          break;
        } else if (i === 2) {
          // Last attempt, force clear
          await supabase.auth.signOut();
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // Sign out from Google Sign-In library (clears native session)
      try {
        const { GoogleSignin } = require('@react-native-google-signin/google-signin');
        const isSignedIn = await GoogleSignin.isSignedIn();
        if (isSignedIn) {
          await GoogleSignin.signOut();
        }
      } catch (error: any) {}

      // Sign out from backend API (for regular login users)
      try {
        await api.post('/api/auth/logout');
      } catch (error) {
        // Ignore logout errors
      }
    } catch (error) {} finally {
      // Clear all storage FIRST
      await AsyncStorage.removeItem('token');
      await AsyncStorage.clear(); // Clear everything to be safe
      
      // Set justLoggedOut flag to prevent re-authentication
      setJustLoggedOut(true);
      setUser(null); // Ensure user is null
      
      // Reset logout flag after delay
      setTimeout(() => {
        setIsLoggingOut(false);
      }, 2000); // Increased to 2 seconds
      
      // Reset justLoggedOut flag after longer delay (prevents re-auth for 5 seconds)
      setTimeout(() => {
        setJustLoggedOut(false);
      }, 5000); // 5 second protection period
    }
  };

  const loginWithGoogle = async () => {
    try {
      const supabase = getSupabase();
      // Use Platform.OS for reliable platform detection
      const isWeb = Platform.OS === 'web';
      
      if (isWeb && typeof window !== 'undefined' && window.location) {
        // Web: Use Supabase OAuth redirect
        // Get current origin and ensure it's properly formatted
        // Use full URL including path to ensure proper redirect
        const redirectUrl = window.location.origin;
        const currentPath = window.location.pathname;
        const fullRedirectUrl = redirectUrl + (currentPath !== '/' ? currentPath : '');
        
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
          // Provide helpful error message
          let errorMessage = error.message || 'Google OAuth failed';
          if (error.message?.includes('redirect_uri_mismatch') || error.message?.includes('500') || error.message?.includes('unexpected')) {
            errorMessage = `❌ SUPABASE NOT CONFIGURED\n\n` +
              `The 500 error means Supabase Google OAuth is missing configuration.\n\n` +
              `REQUIRED STEPS:\n\n` +
              `1. Supabase → Auth → Providers → Google → ENABLE\n` +
              `2. Add Client ID: ${Constants.expoConfig?.extra?.googleWebClientId}\n` +
              `3. Add Client Secret (from Google Cloud)\n` +
              `4. Supabase → Settings → Add Redirect URL: ${redirectUrl}\n` +
              `5. Google Cloud → Add Redirect URI: https://clmhzxiuzqvebzlkbdjs.supabase.co/auth/v1/callback\n\n` +
              `See SETUP_GOOGLE_OAUTH.md for details.`;
          }
          
          throw new Error(errorMessage);
        }
        
        // On web, the redirect will happen automatically
        // The OAuth callback will be handled in App.tsx and onAuthStateChange listener
        // Note: This function won't complete normally on web due to redirect
        // The session will be set via the auth state change listener
      } else {
        // Mobile: Use native Google Sign-In
        try {
          const { GoogleSignin } = require('@react-native-google-signin/google-signin');
          const Constants = require('expo-constants').default;
          
          // Configure Google Sign-In
          // Note: androidClientId is deprecated, only use webClientId
          const webClientId = Constants.expoConfig?.extra?.googleWebClientId;
          
          if (!webClientId) {
            throw new Error('Google Web Client ID not configured in app.json');
          }
          
          // Configure with only webClientId (androidClientId is deprecated)
          GoogleSignin.configure({
            webClientId: webClientId, // This is used for both web and Android
            offlineAccess: true, // Request refresh token
            forceCodeForRefreshToken: true, // Force code exchange for refresh token
          });
          
          // Check if device has Google Play Services
          const hasPlayServices = await GoogleSignin.hasPlayServices({ 
            showPlayServicesUpdateDialog: true 
          });
          
          // Sign in - this will show the account picker
          const signInResult = await GoogleSignin.signIn();
          
          // Get ID token - if not in signIn result, get it separately
          let idToken = signInResult.idToken;
          
          if (!idToken) {
            // Try to get tokens
            const tokens = await GoogleSignin.getTokens();
            idToken = tokens.idToken;
          }
          
          if (!idToken) {
            // Provide detailed error message
            const errorMsg = `No ID token received from Google Sign-In.\n\n` +
              `Possible causes:\n` +
              `1. webClientId doesn't match Google Cloud Console\n` +
              `2. OAuth client not configured for Android\n` +
              `3. SHA-1 fingerprint not added to Google Cloud Console\n\n` +
              `Current webClientId: ${webClientId?.substring(0, 40)}...\n\n` +
              `Fix: Go to Google Cloud Console → Credentials → Find this Client ID → Add Android app with SHA-1 fingerprint`;
            throw new Error(errorMsg);
          }
          
          // Exchange ID token with Supabase
          const { data, error } = await supabase.auth.signInWithIdToken({
            provider: 'google',
            token: idToken,
          });
          
          if (error) {
            throw error;
          }
          
          if (data.user) {
            // Set user from Supabase
            setUser({
              id: data.user.id,
              name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User',
              email: data.user.email || '',
              role: (data.user.user_metadata?.role as 'user' | 'admin') || 'user',
            });
            
            // Store session token
            if (data.session?.access_token) {
              await AsyncStorage.setItem('token', data.session.access_token);
            }
            
            // Automatically create backend session for Google auth users
            try {
              const { ensureBackendToken } = await import('../lib/auth-helpers');
              const backendToken = await ensureBackendToken();
              
              if (backendToken) {
                // Backend token created successfully
              }
            } catch (importError) {
              // Ignore import errors
            }
          } else {
            throw new Error('No user data received from Supabase');
          }
        } catch (googleError: any) {
          // Re-throw with more context
          throw new Error(googleError.message || 'Google Sign-In failed');
        }
      }
    } catch (error: any) {
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




