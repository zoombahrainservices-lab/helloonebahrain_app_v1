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
    // Add timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (loading) {
        if (__DEV__) {
          console.warn('⚠️ Auth check taking too long, forcing completion');
        }
        setLoading(false);
      }
    }, 10000); // 10 second timeout

    fetchMe();

    // Listen for auth state changes (for OAuth redirects)
    const supabase = getSupabase();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (__DEV__) {
        console.log('🔄 Auth state changed:', event, session?.user?.email);
      }
      
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
          AsyncStorage.setItem('token', session.access_token);
        }
        setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        // User signed out
        setUser(null);
        AsyncStorage.removeItem('token');
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
        if (__DEV__) {
          console.log('⚠️ Supabase login failed, trying backend API as fallback:', error.message);
        }
        
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
                if (__DEV__) {
                  console.log('⚠️ Supabase sign-in failed, user may need to be created in Supabase');
                }
                // Note: We can't create Supabase user here without password
                // The user will need to use Supabase login or we need to handle this differently
              }
            } catch (supabaseError) {
              // Supabase session creation failed, but backend login succeeded
              // User can still use the app, but orders might fail
              if (__DEV__) {
                console.log('⚠️ Could not create Supabase session, orders may not work:', supabaseError);
              }
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
          if (__DEV__) {
            console.log('⚠️ Backend API also failed:', backendError.message);
          }
          
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

      // Sign out from Google Sign-In library (clears native session)
      try {
        const { GoogleSignin } = require('@react-native-google-signin/google-signin');
        const isSignedIn = await GoogleSignin.isSignedIn();
        if (isSignedIn) {
          await GoogleSignin.signOut();
          if (__DEV__) {
            console.log('✅ Google Sign-In signed out');
          }
        } else {
          if (__DEV__) {
            console.log('⏭️ Not signed in to Google Sign-In');
          }
        }
      } catch (error: any) {
        if (__DEV__) {
          console.log('⚠️ Google Sign-In logout error:', error?.message);
        }
      }

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
        // The OAuth callback will be handled in App.tsx
        if (__DEV__) {
          console.log('✅ Google OAuth redirect initiated');
          console.log('✅ Redirect URL:', data?.url || 'Will redirect automatically');
        }
      } else {
        // Mobile: Use native Google Sign-In
        if (__DEV__) {
          console.log('📱 Starting Google Sign-In (Mobile)...');
          console.log('📱 Platform:', Platform.OS);
        }
        
        try {
          const { GoogleSignin } = require('@react-native-google-signin/google-signin');
          const Constants = require('expo-constants').default;
          
          // Configure Google Sign-In
          // Note: androidClientId is deprecated, only use webClientId
          const webClientId = Constants.expoConfig?.extra?.googleWebClientId;
          
          if (__DEV__) {
            console.log('📱 Configuring Google Sign-In:', {
              hasWebClientId: !!webClientId,
              webClientId: webClientId ? webClientId.substring(0, 30) + '...' : 'Not set',
            });
          }
          
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
          
          if (__DEV__) {
            console.log('📱 Google Play Services available:', hasPlayServices);
          }
          
          // Sign in - this will show the account picker
          const signInResult = await GoogleSignin.signIn();
          
          if (__DEV__) {
            console.log('📱 Google Sign-In result:', {
              hasUser: !!signInResult.user,
              hasIdToken: !!signInResult.idToken,
              hasServerAuthCode: !!signInResult.serverAuthCode,
              email: signInResult.user?.email,
            });
          }
          
          // Get ID token - if not in signIn result, get it separately
          let idToken = signInResult.idToken;
          
          if (!idToken) {
            // Try to get tokens
            if (__DEV__) {
              console.log('📱 ID token not in signIn result, getting tokens...');
            }
            const tokens = await GoogleSignin.getTokens();
            idToken = tokens.idToken;
            
            if (__DEV__) {
              console.log('📱 Tokens retrieved:', {
                hasIdToken: !!tokens.idToken,
                hasAccessToken: !!tokens.accessToken,
              });
            }
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
          
          if (__DEV__) {
            console.log('✅ ID token received, exchanging with Supabase...');
          }
          
          // Exchange ID token with Supabase
          const { data, error } = await supabase.auth.signInWithIdToken({
            provider: 'google',
            token: idToken,
          });
          
          if (error) {
            if (__DEV__) {
              console.error('❌ Supabase sign-in error:', error);
              console.error('❌ Error details:', JSON.stringify(error, null, 2));
            }
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
                if (__DEV__) {
                  console.log('✅ Backend session created for Google user');
                }
              } else {
                if (__DEV__) {
                  console.log('ℹ️ Backend token creation deferred (will be created on first API call)');
                }
              }
            } catch (importError) {
              // Ignore import errors
              if (__DEV__) {
                console.log('ℹ️ Could not import auth helpers');
              }
            }
            
            if (__DEV__) {
              console.log('✅ Google authentication successful');
            }
          } else {
            throw new Error('No user data received from Supabase');
          }
        } catch (googleError: any) {
          if (__DEV__) {
            console.error('❌ Google Sign-In error:', googleError);
          }
          // Re-throw with more context
          throw new Error(googleError.message || 'Google Sign-In failed');
        }
      }
    } catch (error: any) {
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



