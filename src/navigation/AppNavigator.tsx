import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Platform, Text, Image, View, StyleSheet } from 'react-native';
import { useCart } from '../contexts/CartContext';

// Conditionally import Ionicons - use simple text icons on web to avoid expo-font issue
let Ionicons: any;
if (Platform.OS !== 'web') {
  try {
    Ionicons = require('@expo/vector-icons').Ionicons;
  } catch (e) {
    if (__DEV__) {
      console.warn('Ionicons not available, using fallback');
    }
  }
}

// Fallback icon component for web
const FallbackIcon = ({ name, size, color }: { name: string; size: number; color: string }) => {
  const iconMap: Record<string, string> = {
    'home': '🏠',
    'home-outline': '🏠',
    'grid': '📦',
    'grid-outline': '📦',
    'cart': '🛒',
    'cart-outline': '🛒',
    'person': '👤',
    'person-outline': '👤',
  };
  return <Text style={{ fontSize: size, color }}>{iconMap[name] || '•'}</Text>;
};

// Screens
import HomeScreen from '../screens/HomeScreen';
import ProductListScreen from '../screens/ProductListScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import CartScreen from '../screens/CartScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ProfileScreen from '../screens/ProfileScreen';
import OrdersScreen from '../screens/OrdersScreen';
import OrderDetailScreen from '../screens/OrderDetailScreen';

// Types
export type MainTabParamList = {
  Home: { category?: string } | undefined;
  Products: undefined;
  Cart: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  MainTabs: { screen?: keyof MainTabParamList } | undefined;
  ProductDetail: { slug: string };
  Checkout: undefined;
  Login: { redirect?: string } | undefined;
  Register: undefined;
  OrderDetail: { orderId: string };
  Orders: undefined;
};

export type MainTabNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  const IconComponent = Platform.OS === 'web' ? FallbackIcon : Ionicons;
  const { getItemCount } = useCart();
  const cartCount = getItemCount();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Products') {
            iconName = focused ? 'grid' : 'grid-outline';
          } else if (route.name === 'Cart') {
            iconName = focused ? 'cart' : 'cart-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'help-outline';
          }

          if (route.name === 'Cart' && cartCount > 0) {
            // Show cart icon with badge
            if (Platform.OS === 'web' || !Ionicons) {
              return (
                <View style={styles.iconContainer}>
                  <FallbackIcon name={iconName} size={size} color={color} />
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{cartCount > 99 ? '99+' : cartCount}</Text>
                  </View>
                </View>
              );
            }
            return (
              <View style={styles.iconContainer}>
                <Ionicons name={iconName as any} size={size} color={color} />
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{cartCount > 99 ? '99+' : cartCount}</Text>
                </View>
              </View>
            );
          }

          if (Platform.OS === 'web' || !Ionicons) {
            return <FallbackIcon name={iconName} size={size} color={color} />;
          }

          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#dc2626',
        tabBarInactiveTintColor: 'gray',
        headerShown: true,
        headerStyle: {
          backgroundColor: '#dc2626', // Red color
        },
        headerTintColor: '#ffffff', // White text
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
        headerTitle: () => (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Image
              source={{ uri: 'https://hello-bahrain-e-commerce-client.vercel.app/logo.jpg' }}
              style={{ width: 32, height: 32, borderRadius: 4 }}
              resizeMode="contain"
            />
            <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 18 }}>
              HelloOneBahrain
            </Text>
          </View>
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Products" component={ProductListScreen} />
      <Tab.Screen name="Cart" component={CartScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: true,
          headerStyle: {
            backgroundColor: '#dc2626', // Red color
          },
          headerTintColor: '#ffffff', // White text
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 18,
          },
        }}
      >
        <Stack.Screen 
          name="MainTabs" 
          component={MainTabs} 
          options={{ 
            headerShown: false, // Hide stack header, use tab header instead
          }} 
        />
        <Stack.Screen
          name="ProductDetail"
          component={ProductDetailScreen}
          options={{ 
            title: 'Product Details',
            headerStyle: {
              backgroundColor: '#dc2626',
            },
            headerTintColor: '#ffffff',
          }}
        />
        <Stack.Screen
          name="Checkout"
          component={CheckoutScreen}
          options={{ 
            title: 'Checkout',
            headerStyle: {
              backgroundColor: '#dc2626',
            },
            headerTintColor: '#ffffff',
          }}
        />
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ 
            title: 'Login',
            headerStyle: {
              backgroundColor: '#dc2626',
            },
            headerTintColor: '#ffffff',
          }}
        />
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={{ 
            title: 'Register',
            headerStyle: {
              backgroundColor: '#dc2626',
            },
            headerTintColor: '#ffffff',
          }}
        />
        <Stack.Screen
          name="OrderDetail"
          component={OrderDetailScreen}
          options={{ 
            title: 'Order Details',
            headerStyle: {
              backgroundColor: '#dc2626',
            },
            headerTintColor: '#ffffff',
          }}
        />
        <Stack.Screen
          name="Orders"
          component={OrdersScreen}
          options={{ 
            title: 'My Orders',
            headerStyle: {
              backgroundColor: '#dc2626',
            },
            headerTintColor: '#ffffff',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    position: 'relative',
    width: 24,
    height: 24,
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -12,
    backgroundColor: '#dc2626',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
