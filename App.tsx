import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/contexts/AuthContext';
import { CartProvider } from './src/contexts/CartContext';
import { LanguageProvider } from './src/contexts/LanguageContext';
import { ToastProvider } from './src/contexts/ToastContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
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

