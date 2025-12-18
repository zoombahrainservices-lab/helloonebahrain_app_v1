import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import Constants from 'expo-constants';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../navigation/AppNavigator';

WebBrowser.maybeCompleteAuthSession();

type LoginRouteProp = RouteProp<RootStackParamList, 'Login'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function LoginScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<LoginRouteProp>();
  const { login, loginWithGoogle } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const googleWebClientId =
    Constants.expoConfig?.extra?.googleWebClientId ||
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

  const googleAndroidClientId =
    Constants.expoConfig?.extra?.googleAndroidClientId ||
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;

  const [request, response, promptAsync] = Google.useAuthRequest({
    // Used by Expo Go and native web auth
    expoClientId: googleWebClientId,
    // Required when running on web
    webClientId: googleWebClientId,
    // For native / dev builds, you must set googleAndroidClientId in app.json extra
    androidClientId: Platform.OS === 'android' ? googleAndroidClientId : undefined,
  });

  useEffect(() => {
    const handleGoogleResponse = async () => {
      if (response?.type === 'success' && response.authentication?.idToken) {
        try {
          setGoogleLoading(true);
          await loginWithGoogle(response.authentication.idToken);
          const redirect = route.params?.redirect;
          if (redirect) {
            if (redirect.startsWith('ProductDetail:')) {
              const slug = redirect.replace('ProductDetail:', '');
              navigation.navigate('ProductDetail', { slug });
            } else if (redirect === 'Cart' || redirect === 'Checkout') {
              navigation.navigate('MainTabs', { screen: 'Cart' });
            } else {
              navigation.navigate('MainTabs', { screen: 'Home' });
            }
          } else {
            navigation.navigate('MainTabs', { screen: 'Home' });
          }
        } catch (error: any) {
          Alert.alert(
            'Google Login Failed',
            error.response?.data?.message || 'Unable to login with Google'
          );
        } finally {
          setGoogleLoading(false);
        }
      }
    };

    handleGoogleResponse();
  }, [response]);

  const handleLogin = async () => {
    if (!identifier || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await login(identifier, password);
      // Navigate based on redirect or default to home
      const redirect = route.params?.redirect;
      if (redirect) {
        if (redirect.startsWith('ProductDetail:')) {
          const slug = redirect.replace('ProductDetail:', '');
          navigation.navigate('ProductDetail', { slug });
        } else if (redirect === 'Cart' || redirect === 'Checkout') {
          navigation.navigate('MainTabs', { screen: 'Cart' });
        } else {
          navigation.navigate('MainTabs', { screen: 'Home' });
        }
      } else {
        navigation.navigate('MainTabs', { screen: 'Home' });
      }
    } catch (error: any) {
      Alert.alert('Login Failed', error.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>Login</Text>
          <Text style={styles.subtitle}>Welcome back! Please login to your account.</Text>

          <View style={styles.form}>
            <Text style={styles.label}>Email or Username</Text>
            <TextInput
              style={styles.input}
              value={identifier}
              onChangeText={setIdentifier}
              placeholder="Enter your email or username"
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />

            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#6b7280"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginButtonText}>Login</Text>
              )}
            </TouchableOpacity>

            {Platform.OS !== 'web' && (
              <>
                <View style={styles.orContainer}>
                  <View style={styles.orLine} />
                  <Text style={styles.orText}>OR</Text>
                  <View style={styles.orLine} />
                </View>

                <TouchableOpacity
                  style={[
                    styles.googleButton,
                    (googleLoading || !request) && styles.loginButtonDisabled,
                  ]}
                  onPress={() => promptAsync()}
                  disabled={googleLoading || !request}
                  activeOpacity={0.8}
                >
                  {googleLoading ? (
                    <ActivityIndicator color="#000" />
                  ) : (
                    <View style={styles.googleContent}>
                      <View style={styles.googleIconCircle}>
                        <Text style={styles.googleIconLetter}>G</Text>
                      </View>
                      <Text style={styles.googleButtonText}>Continue with Google</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </>
            )}

            <View style={styles.registerPrompt}>
              <Text style={styles.registerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.registerLink}>Register</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 32,
    textAlign: 'center',
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  passwordContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    paddingRight: 45,
    fontSize: 16,
    color: '#111827',
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeIcon: {
    fontSize: 20,
  },
  loginButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  loginButtonDisabled: {
    opacity: 0.5,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 8,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  orText: {
    marginHorizontal: 8,
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
  },
  googleButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginTop: 8,
  },
  googleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  googleIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIconLetter: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4285F4',
  },
  googleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  registerPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  registerText: {
    fontSize: 14,
    color: '#6b7280',
  },
  registerLink: {
    fontSize: 14,
    color: '#dc2626',
    fontWeight: '600',
  },
});



