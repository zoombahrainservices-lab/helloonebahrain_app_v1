import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

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

// Log API configuration for debugging (only in development)
if (__DEV__) {
  console.log('API Base URL:', API_BASE_URL);
}

// Add request interceptor for auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
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
      // Handle unauthorized - clear token and redirect to login
      try {
        await AsyncStorage.removeItem('token');
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
