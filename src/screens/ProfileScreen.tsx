import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../navigation/AppNavigator';

// Conditionally import Ionicons
let Ionicons: any;
if (Platform.OS !== 'web') {
  try {
    Ionicons = require('@expo/vector-icons').Ionicons;
  } catch (e) {
    if (__DEV__) {
      console.warn('Ionicons not available');
    }
  }
}

// Fallback icon component
const Icon = ({ name, size, color }: { name: string; size: number; color: string }) => {
  if (Platform.OS === 'web' || !Ionicons) {
    const iconMap: Record<string, string> = {
      'receipt-outline': '📄',
      'settings-outline': '⚙️',
      'log-out-outline': '🚪',
      'person': '👤',
    };
    return <Text style={{ fontSize: size, color }}>{iconMap[name] || '•'}</Text>;
  }
  return <Ionicons name={name as any} size={size} color={color} />;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ProfileScreen() {
  // Hooks must be called at the top level - cannot be in try-catch
  const { user, logout, loading } = useAuth();
  const navigation = useNavigation<NavigationProp>();

  // Redirect to login if not authenticated
  // Use a ref to prevent multiple navigation calls
  const hasNavigated = React.useRef(false);
  
  React.useEffect(() => {
    // Only navigate once and only if we're sure there's no user
    if (!loading && !user && !hasNavigated.current) {
      hasNavigated.current = true;
      
      // Use setTimeout to ensure navigation happens after render
      setTimeout(() => {
        try {
          if (__DEV__) {
            console.log('🔒 No user, redirecting to Login');
          }
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        } catch (error) {
          if (__DEV__) {
            console.error('❌ Navigation error:', error);
          }
          // Fallback: just navigate
          navigation.navigate('Login' as any);
        }
      }, 100);
    }
    
    // Reset flag if user logs in
    if (user) {
      hasNavigated.current = false;
    }
  }, [user, loading, navigation]);

  const handleLogout = async () => {
    try {
      if (__DEV__) {
        console.log('🔴 LOGOUT BUTTON PRESSED');
      }

      // Call logout and wait for it to complete
          await logout();

      if (__DEV__) {
        console.log('✅ Logout function completed');
      }

      // Wait a bit to ensure all cleanup is done
      await new Promise(resolve => setTimeout(resolve, 500));

      // Navigate to Login screen and reset navigation stack
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });

      if (__DEV__) {
        console.log('🔄 Navigation reset to Login');
      }
    } catch (error) {
      if (__DEV__) {
        console.error('❌ Logout handler error:', error);
      }
      // Force navigation even if logout fails
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#dc2626" />
      </View>
    );
  }

  if (!user) {
    // Don't render anything if we're redirecting
    if (hasNavigated.current) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#dc2626" />
        </View>
      );
    }
    
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>Not Logged In</Text>
        <Text style={styles.emptyText}>Please login to view your profile</Text>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => {
            try {
              navigation.navigate('Login' as any);
            } catch (error) {
              if (__DEV__) {
                console.error('❌ Navigation error:', error);
              }
            }
          }}
        >
          <Text style={styles.loginButtonText}>Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ flexGrow: 1 }}>
      <View style={styles.header}>
      <View style={styles.avatar}>
        <Icon name="person" size={40} color="#dc2626" />
      </View>
        <Text style={styles.name}>{user.name || 'User'}</Text>
        <Text style={styles.email}>{user.email || ''}</Text>
        {user.role === 'admin' && (
          <View style={styles.adminBadge}>
            <Text style={styles.adminBadgeText}>Admin</Text>
          </View>
        )}
      </View>

      <View style={styles.menu}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {
            try {
              navigation.navigate('Orders' as any);
            } catch (error) {
              if (__DEV__) {
                console.error('❌ Navigation error:', error);
              }
            }
          }}
          activeOpacity={0.7}
        >
          <Icon name="receipt-outline" size={24} color="#374151" />
          <Text style={styles.menuItemText}>My Orders</Text>
          <Text style={{ fontSize: 20, color: '#9ca3af' }}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          activeOpacity={0.7}
        >
          <Icon name="settings-outline" size={24} color="#374151" />
          <Text style={styles.menuItemText}>Settings</Text>
          <Text style={{ fontSize: 20, color: '#9ca3af' }}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem} 
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Icon name="log-out-outline" size={24} color="#ef4444" />
          <Text style={[styles.menuItemText, styles.logoutText]}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#111827',
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  loginButton: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#fff',
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  adminBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  adminBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400e',
  },
  menu: {
    marginTop: 16,
    backgroundColor: '#fff',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
  },
  logoutText: {
    color: '#ef4444',
  },
});
