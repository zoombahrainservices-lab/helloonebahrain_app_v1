import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Modal,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../navigation/AppNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const MenuButton = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user, logout } = useAuth();
  const [menuVisible, setMenuVisible] = useState(false);

  const menuItems = [
    { label: 'Home', screen: 'MainTabs', params: { screen: 'Home' }, icon: '🏠' },
    { label: 'Products', screen: 'MainTabs', params: { screen: 'Products' }, icon: '📦' },
    { label: 'Cart', screen: 'MainTabs', params: { screen: 'Cart' }, icon: '🛒' },
    { label: 'My Orders', screen: 'Orders', icon: '📋' },
    { label: 'Profile', screen: 'MainTabs', params: { screen: 'Profile' }, icon: '👤' },
  ];

  const handleMenuItemPress = (screen: string, params?: any) => {
    setMenuVisible(false);
    // @ts-ignore - navigation typing issue
    navigation.navigate(screen as any, params);
  };

  const handleLogout = async () => {
    setMenuVisible(false);
    try {
      await logout();
      navigation.navigate('Login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={styles.menuButton}
        onPress={() => setMenuVisible(true)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={styles.menuIcon}>☰</Text>
      </TouchableOpacity>

      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.menuContainer}>
            <View style={styles.menuHeader}>
              <Text style={styles.menuTitle}>Menu</Text>
              <TouchableOpacity
                onPress={() => setMenuVisible(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.menuContent}>
              {menuItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.menuItem}
                  onPress={() => handleMenuItemPress(item.screen, item.params)}
                >
                  <Text style={styles.menuItemIcon}>{item.icon}</Text>
                  <Text style={styles.menuItemText}>{item.label}</Text>
                </TouchableOpacity>
              ))}

              {user ? (
                <>
                  <View style={styles.menuDivider} />
                  <TouchableOpacity
                    style={[styles.menuItem, styles.logoutItem]}
                    onPress={handleLogout}
                  >
                    <Text style={styles.menuItemIcon}>🚪</Text>
                    <Text style={[styles.menuItemText, styles.logoutText]}>Logout</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <View style={styles.menuDivider} />
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => {
                      setMenuVisible(false);
                      navigation.navigate('Login');
                    }}
                  >
                    <Text style={styles.menuItemIcon}>🔐</Text>
                    <Text style={styles.menuItemText}>Login</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  menuButton: {
    padding: 8,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuIcon: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  menuContainer: {
    width: '75%',
    maxWidth: 300,
    height: '100%',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#dc2626',
    borderBottomWidth: 1,
    borderBottomColor: '#b91c1c',
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  menuContent: {
    flex: 1,
    paddingTop: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  menuItemIcon: {
    fontSize: 24,
    marginRight: 12,
    width: 32,
    textAlign: 'center',
  },
  menuItemText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 8,
  },
  logoutItem: {
    backgroundColor: '#fef2f2',
  },
  logoutText: {
    color: '#dc2626',
    fontWeight: '600',
  },
});

export default MenuButton;












