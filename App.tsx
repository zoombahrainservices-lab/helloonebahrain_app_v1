import React, { useEffect, ErrorInfo } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, Platform, Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { getSupabase } from './src/lib/supabase';
import AppNavigator from './src/navigation/AppNavigator';
import { CartProvider } from './src/contexts/CartContext';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { LanguageProvider } from './src/contexts/LanguageContext';
import { ToastProvider } from './src/contexts/ToastContext';

// Complete auth session when app loads to handle OAuth redirects
WebBrowser.maybeCompleteAuthSession();

// Loading screen component
function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#dc2626" />
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );
}

// Error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (__DEV__) {
      console.error('❌ App Error:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorText}>
            {this.state.error?.message || 'Unknown error'}
          </Text>
          <Text style={styles.errorHint}>
            Please restart the app
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

// App content that waits for auth to load
function AppContent() {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return <AppNavigator />;
}

export default function App() {
  useEffect(() => {
    // Ensure auth session is completed on app mount
    WebBrowser.maybeCompleteAuthSession();
    
    // Handle OAuth callback on web
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleOAuthCallback = async () => {
        const supabase = getSupabase();
        
        // Check if this is a Supabase callback URL (has state parameter in query string)
        const urlParams = new URLSearchParams(window.location.search);
        const stateParam = urlParams.get('state');
        const isSupabaseCallback = window.location.pathname.includes('/auth/v1/callback') || stateParam !== null;
        
        if (__DEV__) {
          console.log('🔍 Checking OAuth callback...');
          console.log('🔍 Full URL:', window.location.href);
          console.log('🔍 Pathname:', window.location.pathname);
          console.log('🔍 Search params:', window.location.search);
          console.log('🔍 Hash:', window.location.hash);
          console.log('🔍 Is Supabase callback:', isSupabaseCallback);
        }
        
        // Check if this is an OAuth callback (Supabase redirects with hash OR query params)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token') || urlParams.get('access_token');
        const error = hashParams.get('error') || urlParams.get('error');
        const errorDescription = hashParams.get('error_description') || urlParams.get('error_description');
        
        // If we're on the Supabase callback URL and there's an error in the response
        if (isSupabaseCallback && window.location.pathname.includes('supabase.co')) {
          // This means Supabase returned an error page
          // Check if there's error info in the page
          if (__DEV__) {
            console.error('❌ On Supabase callback URL with error');
            console.error('❌ This means Supabase backend rejected the OAuth request');
          }
        }
        
        if (error) {
          if (__DEV__) {
            console.error('❌ OAuth callback error:', error, errorDescription);
            console.error('❌ Full callback URL:', window.location.href);
            console.error('❌ Current origin:', window.location.origin);
            console.error('❌ Hash params:', window.location.hash);
            
            // Log the state parameter to check if it's valid
            const urlParams = new URLSearchParams(window.location.search);
            const stateParam = urlParams.get('state');
            if (stateParam) {
              console.error('❌ State parameter present:', stateParam.substring(0, 50) + '...');
            }
          }
          
          // Clear hash and redirect to login with error
          window.history.replaceState({}, document.title, '/Login');
          
          // Provide detailed error message for 500 errors
          let errorMsg = errorDescription || error;
          if (error === 'unexpected_failure' || error.includes('500') || error.includes('unexpected')) {
            const currentOrigin = window.location.origin;
            const possiblePorts = ['8081', '19006', '19000', '19001'];
            
            errorMsg = `❌ SUPABASE REDIRECT URL MISMATCH\n\n` +
              `The 500 error at callback means the redirect URL doesn't match Supabase settings.\n\n` +
              `🔍 CHECK THESE:\n\n` +
              `1️⃣ Supabase → Settings → General → Redirect URLs\n` +
              `   Must include EXACTLY: ${currentOrigin}\n` +
              `   (Current origin: ${currentOrigin})\n\n` +
              `2️⃣ Also add these redirect URLs in Supabase:\n`;
            
            possiblePorts.forEach(port => {
              const url = `http://localhost:${port}`;
              if (url !== currentOrigin) {
                errorMsg += `   • ${url}\n`;
              }
            });
            
            errorMsg += `   • https://clmhzxiuzqvebzlkbdjs.supabase.co/auth/v1/callback\n\n` +
              `3️⃣ Supabase → Settings → General → Site URL\n` +
              `   Set to: ${currentOrigin}\n\n` +
              `4️⃣ Google Cloud Console → Credentials\n` +
              `   Add Redirect URI: https://clmhzxiuzqvebzlkbdjs.supabase.co/auth/v1/callback\n\n` +
              `5️⃣ Verify Google provider in Supabase:\n` +
              `   • Toggle is ON (green)\n` +
              `   • Client ID matches\n` +
              `   • Client Secret is correct\n\n` +
              `⏳ After changes, wait 2-3 minutes, clear cache, try again.`;
          }
          
          Alert.alert('Google Login Failed - Redirect URL Issue', errorMsg);
          return;
        }
        
        if (accessToken) {
          if (__DEV__) {
            console.log('✅ OAuth callback received, processing...');
            console.log('🔍 Hash:', window.location.hash.substring(0, 50) + '...');
          }
          
          // Supabase should automatically detect and process the session from the hash
          // But we'll manually trigger it to be sure
          try {
            // Wait a moment for Supabase to process
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Get the session (Supabase should have processed it)
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            
            if (sessionError) {
              if (__DEV__) {
                console.error('❌ Session error:', sessionError);
              }
              throw sessionError;
            }
            
            if (session) {
              if (__DEV__) {
                console.log('✅ OAuth session created successfully');
                console.log('👤 User:', session.user?.email);
              }
              // Clear hash and redirect to home
              window.history.replaceState({}, document.title, '/');
              // Small delay before reload to ensure state is saved
              setTimeout(() => {
                window.location.reload();
              }, 300);
            } else {
              if (__DEV__) {
                console.error('❌ OAuth session not created - no session found');
              }
              // The session might not be ready yet, try again after a delay
              await new Promise(resolve => setTimeout(resolve, 1000));
              const { data: { session: retrySession } } = await supabase.auth.getSession();
              if (retrySession) {
                window.history.replaceState({}, document.title, '/');
                setTimeout(() => {
                  window.location.reload();
                }, 300);
              } else {
                throw new Error('Failed to create session from OAuth callback');
              }
            }
          } catch (error: any) {
            if (__DEV__) {
              console.error('❌ OAuth callback processing error:', error);
            }
            window.history.replaceState({}, document.title, '/Login');
            Alert.alert('Login Failed', error?.message || 'Failed to process OAuth callback');
          }
        }
      };
      
      // Only run if we have OAuth callback parameters
      if (window.location.hash.includes('access_token') || window.location.hash.includes('error')) {
        handleOAuthCallback();
      }
    }
    
    if (__DEV__) {
      console.log('🚀 App started');
    }
  }, []);

  return (
    <ErrorBoundary>
    <AuthProvider>
      <CartProvider>
        <LanguageProvider>
          <ToastProvider>
              <AppContent />
          </ToastProvider>
        </LanguageProvider>
      </CartProvider>
    </AuthProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 24,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorHint: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 16,
  },
});
