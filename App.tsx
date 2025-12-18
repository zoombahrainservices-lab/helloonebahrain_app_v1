import React from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { CartProvider } from './src/contexts/CartContext';
import { AuthProvider } from './src/contexts/AuthContext';
import { LanguageProvider } from './src/contexts/LanguageContext';

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <LanguageProvider>
          <AppNavigator />
        </LanguageProvider>
      </CartProvider>
    </AuthProvider>
  );
}
