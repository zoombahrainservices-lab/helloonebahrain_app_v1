import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { formatPrice } from '../lib/currency';
import { RootStackParamList } from '../navigation/AppNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function CartScreen() {
  const { items, removeItem, updateQuantity, getTotal, clearCart } = useCart();
  const { user, loading: authLoading } = useAuth();
  const { t, language } = useLanguage();
  const navigation = useNavigation<NavigationProp>();

  if (authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#dc2626" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>Login Required</Text>
        <Text style={styles.emptyText}>
          Please log in to continue. Only logged-in users can view the cart and add items.
        </Text>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => navigation.navigate('Login', { redirect: 'Cart' })}
        >
          <Text style={styles.loginButtonText}>Login to Continue</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
        <Text style={styles.emptyText}>Add some products to get started!</Text>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
        >
          <Text style={styles.continueButtonText}>Continue Shopping</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleRemove = (productId: string, name: string) => {
    Alert.alert('Remove Item', `Remove ${name} from cart?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => removeItem(productId),
      },
    ]);
  };

  const handleClear = () => {
    Alert.alert('Clear Cart', 'Remove all items from cart?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => clearCart(),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.itemsContainer}>
          {items.map((item) => (
            <View key={item.productId} style={styles.item}>
              <TouchableOpacity
                style={styles.imageContainer}
                onPress={() => navigation.navigate('ProductDetail', { slug: item.slug })}
              >
                <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />
              </TouchableOpacity>

              <View style={styles.itemInfo}>
                <TouchableOpacity
                  onPress={() => navigation.navigate('ProductDetail', { slug: item.slug })}
                >
                  <Text style={styles.itemName}>{item.name}</Text>
                </TouchableOpacity>
                <Text style={styles.itemPrice}>{formatPrice(item.price, language === 'ar' ? 'ar-BH' : 'en-BH')}</Text>
                {item.stockQuantity && item.quantity >= item.stockQuantity && (
                  <Text style={styles.stockWarning}>⚠ Max stock reached</Text>
                )}
                
                <View style={styles.quantityContainer}>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => updateQuantity(item.productId, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                  >
                    <Text style={styles.quantityButtonText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.quantityText}>{item.quantity}</Text>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => updateQuantity(item.productId, item.quantity + 1)}
                    disabled={item.stockQuantity !== undefined && item.quantity >= item.stockQuantity}
                  >
                    <Text style={styles.quantityButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.itemTotal}>
                <Text style={styles.itemTotalText}>
                  {formatPrice(item.price * item.quantity, language === 'ar' ? 'ar-BH' : 'en-BH')}
                </Text>
                <TouchableOpacity
                  onPress={() => handleRemove(item.productId, item.name)}
                  style={styles.removeButton}
                >
                  <Text style={styles.removeButtonText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
          <Text style={styles.clearButtonText}>Clear Cart</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Order Summary */}
      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>Order Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{t('subtotal')}</Text>
          <Text style={styles.summaryValue}>
            {formatPrice(getTotal(), language === 'ar' ? 'ar-BH' : 'en-BH')}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>
            {language === 'ar' ? 'الشحن' : 'Shipping'}
          </Text>
          <Text style={styles.summaryValue}>
            {language === 'ar' ? 'يحسب عند الدفع' : 'Calculated at checkout'}
          </Text>
        </View>
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>{language === 'ar' ? 'المجموع' : 'Total'}</Text>
          <Text style={styles.totalValue}>
            {formatPrice(getTotal(), language === 'ar' ? 'ar-BH' : 'en-BH')}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.checkoutButton}
          onPress={() => navigation.navigate('Checkout')}
        >
          <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
        </TouchableOpacity>
      </View>
    </View>
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
  scrollView: {
    flex: 1,
  },
  itemsContainer: {
    padding: 16,
  },
  item: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  itemInfo: {
    flex: 1,
    marginRight: 8,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    color: '#6b7280',
  },
  stockWarning: {
    fontSize: 10,
    color: '#f59e0b',
    marginTop: 4,
    fontWeight: '600',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 6,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  quantityButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
  },
  quantityText: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    fontSize: 12,
    fontWeight: '600',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#e5e7eb',
    minWidth: 32,
    textAlign: 'center',
  },
  itemTotal: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  itemTotalText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  removeButton: {
    padding: 4,
  },
  removeButtonText: {
    fontSize: 12,
    color: '#ef4444',
  },
  clearButton: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#ef4444',
    fontSize: 14,
  },
  summary: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#111827',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12,
    marginTop: 8,
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  checkoutButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  continueButton: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});



