import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Platform, Linking } from 'react-native';
import { AuthProvider } from './src/contexts/AuthContext';
import { CartProvider } from './src/contexts/CartContext';
import { LanguageProvider } from './src/contexts/LanguageContext';
import { ToastProvider } from './src/contexts/ToastContext';
import AppNavigator from './src/navigation/AppNavigator';
import { getSupabase } from './src/lib/supabase';

export default function App() {
  useEffect(() => {
    // Handle OAuth callback on web
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleOAuthCallback = async () => {
        const supabase = getSupabase();
        
        // Check if we have hash fragments (OAuth callback)
        if (window.location.hash) {
          // Extract the hash and parse it
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          
          if (accessToken) {
            // Set the session from the URL hash
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            });
            
            if (!error && data.session) {
              // Clear the hash from URL
              window.history.replaceState(null, '', window.location.pathname);
            }
          }
        }
      };
      
      handleOAuthCallback();
    }
  }, []);

  return (
    <AuthProvider>
      <LanguageProvider>
        <CartProvider>
          <ToastProvider>
            <StatusBar style="auto" />
            <AppNavigator />
          </ToastProvider>
        </CartProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}

