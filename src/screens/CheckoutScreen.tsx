import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { formatPrice } from '../lib/currency';
import { api } from '../lib/api';
import { createOrder } from '../lib/orders-api';
import { RootStackParamList } from '../navigation/AppNavigator';
import * as Linking from 'expo-linking';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function CheckoutScreen() {
  const { user, loading: authLoading } = useAuth();
  const { items, getTotal, clearCart } = useCart();
  const { language } = useLanguage();
  const { showToast } = useToast();
  const navigation = useNavigation<NavigationProp>();

  const [formData, setFormData] = useState({
    fullName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    country: 'Bahrain',
    postalCode: '',
    phone: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'benefit' | 'cod' | 'card'>('cod');
  const [orderPlaced, setOrderPlaced] = useState(false); // Track if order was successfully placed

  useEffect(() => {
    // Only redirect if we're sure user is not logged in (after loading completes)
    if (!authLoading && !user) {
      // Double check with Supabase session before redirecting (for Google auth users)
      const checkSession = async () => {
        try {
          const { getSupabase } = await import('../lib/supabase');
          const supabase = getSupabase();
          const { data: { session } } = await supabase.auth.getSession();
          
          // Only redirect if neither user nor session exists
          if (!session?.user) {
            navigation.navigate('Login', { redirect: 'Checkout' });
          }
        } catch (error) {
          // If check fails, redirect to login
      navigation.navigate('Login', { redirect: 'Checkout' });
        }
      };
      checkSession();
    }
  }, [user, authLoading, navigation]);

  useEffect(() => {
    // Only go back if cart is empty AND we're not currently submitting an order
    // AND we haven't just placed an order (prevent redirect after successful order)
    if (items.length === 0 && !submitting && !error && !orderPlaced) {
      // Small delay to prevent immediate redirect during order processing
      const timer = setTimeout(() => {
      navigation.goBack();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [items, navigation, submitting, error, orderPlaced]);

  const handleSubmit = async () => {
    setError('');

    // Validate form
    if (!formData.fullName || !formData.addressLine1 || !formData.city || !formData.phone) {
      setError('Please fill in all required fields');
      return;
    }

    // Validate cart items have stock
    const stockIssues = items.filter(
      (item) => item.stockQuantity !== undefined && item.quantity > item.stockQuantity
    );

    if (stockIssues.length > 0) {
      setError(
        `Some items exceed available stock: ${stockIssues.map((i) => i.name).join(', ')}. Please update your cart.`
      );
      return;
    }

    setSubmitting(true);
    setError(''); // Clear any previous errors

    // Get user ID - prefer AuthContext user, fallback to Supabase session
    let userId: string | null = null;
    let userEmail = '';
    let userName = 'User';
    
    // First, try to get user from AuthContext (works for both auth methods)
    if (user?.id) {
      userId = user.id;
      userEmail = user.email || '';
      userName = user.name || 'User';}
    
    // Also check Supabase session (for Google auth users or if AuthContext user not available)
    const { getSupabase } = await import('../lib/supabase');
    const supabase = getSupabase();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      // If we have Supabase session, prefer it (ensures valid Supabase user ID)
      userId = session.user.id;
      userEmail = session.user.email || userEmail || '';
      userName = session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || userName || 'User';}
    
    // If no user ID found, redirect to login
    if (!userId) {
      setSubmitting(false);Alert.alert('Authentication Required', 'Please log in to place an order.');
      navigation.navigate('Login', { redirect: 'Checkout' });
      return;
    }// For COD - handle separately, no payment gateway needed
    if (paymentMethod === 'cod') {
      try {
        // Use Supabase directly to create order
        const orderData = {
          userId: userId,
          userEmail: userEmail,
          userName: userName,
          items: items.map((item) => ({
            productId: item.productId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.image,
          })),
          shippingAddress: formData,
          total: getTotal(),
          paymentMethod: 'cod' as const,
          paymentStatus: 'unpaid' as const,
          orderStatus: 'pending' as const,
        };
        
        const order = await createOrder(orderData);

        if (!order.id) {
          throw new Error('Order ID not received');
        }

        // COD order created successfully
        setSubmitting(false);
        setOrderPlaced(true); // Mark order as placed to prevent navigation back
        showToast('Order placed successfully! You will pay when you receive your order.', 'success');
        // Clear cart first, then navigate to Home page
        clearCart();
        // Use replace to prevent going back to checkout
        setTimeout(() => {
          navigation.navigate('MainTabs', { screen: 'Home' });
        }, 500);
        return; // Exit early for COD
      } catch (error: any) {
        // Only handle order creation errors for COD
        setSubmitting(false);const errorMessage = error.message || 'Failed to create order. Please try again.';
        setError(errorMessage);
        Alert.alert('Error', errorMessage);
        return;
      }
    }

    // For Card or Benefit - create order then payment session
    try {
      // Use Supabase directly to create order
      const orderData = {
        userId: userId,
        userEmail: userEmail,
        userName: userName,
        items: items.map((item) => ({
          productId: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
        })),
        shippingAddress: formData,
        total: getTotal(),
        paymentMethod: paymentMethod,
        paymentStatus: 'unpaid' as const,
        orderStatus: 'pending' as const,
      };
      
      const order = await createOrder(orderData);
      const orderId = order.id;

      if (!orderId) {
        throw new Error('Order ID not received');
      }

      // Now try to create payment session (only for Card/Benefit)
      try {
        const paymentResponse = await api.post('/api/eazypay/session', {
          orderId,
          amount: getTotal(),
          paymentMethod: paymentMethod,
        });

        const paymentUrl = paymentResponse.data.paymentUrl || paymentResponse.data.url || paymentResponse.data.checkoutUrl;

        if (paymentUrl) {
          // Open payment URL in browser
          const canOpen = await Linking.canOpenURL(paymentUrl);
          if (canOpen) {
            await Linking.openURL(paymentUrl);
            setSubmitting(false);
            setOrderPlaced(true); // Mark order as placed to prevent navigation back
            showToast('Order placed successfully! Redirecting to payment...', 'success');
            // Clear cart first, then navigate to Home page
            clearCart();
            setTimeout(() => {
              navigation.navigate('MainTabs', { screen: 'Home' });
            }, 500);
            return;
          } else {
            throw new Error('Cannot open payment URL');
          }
        } else {
          // Payment gateway not configured, but order is created
          setSubmitting(false);
          setSubmitting(false);
          setOrderPlaced(true); // Mark order as placed to prevent navigation back
          showToast('Order placed successfully! Payment gateway is not configured.', 'success');
          Alert.alert(
            'Order Created',
            'Your order has been created. Payment gateway is not configured. Please contact support to complete payment.',
            [
              {
                text: 'OK',
                onPress: () => {
                  clearCart();
                  setTimeout(() => {
                    navigation.navigate('MainTabs', { screen: 'Home' });
                  }, 500);
                },
              },
            ]
          );
          return;
        }
      } catch (paymentError: any) {
        // Payment gateway error - order is already created
        setSubmitting(false);
        const paymentErrorMessage = paymentError.response?.data?.message || paymentError.message || 'Payment gateway error';// Show error for payment gateway issues
        setError(paymentErrorMessage);
        setSubmitting(false);
        setOrderPlaced(true); // Mark order as placed to prevent navigation back
        showToast('Order placed successfully! Payment gateway issue occurred.', 'success');
        Alert.alert(
          'Payment Gateway Error',
          `Your order has been created, but there was an issue with the payment gateway: ${paymentErrorMessage}. Please contact support to complete payment.`,
          [
            {
              text: 'OK',
              onPress: () => {
                clearCart();
                setTimeout(() => {
                  navigation.navigate('MainTabs', { screen: 'Home' });
                }, 500);
              },
            },
          ]
        );
        return;
      }
    } catch (error: any) {
      // Order creation error for Card/Benefit
      setSubmitting(false);const errorMessage = error.response?.data?.message || error.message || 'Failed to create order. Please try again.';
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    }
  };

  if (authLoading || items.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#dc2626" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={styles.title}>Shipping Information</Text>

          {error && paymentMethod !== 'cod' ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.form}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.fullName}
              onChangeText={(text) => setFormData({ ...formData, fullName: text })}
              placeholder="Enter your full name"
            />

            <Text style={styles.label}>Address Line 1 *</Text>
            <TextInput
              style={styles.input}
              value={formData.addressLine1}
              onChangeText={(text) => setFormData({ ...formData, addressLine1: text })}
              placeholder="Street address"
            />

            <Text style={styles.label}>Address Line 2</Text>
            <TextInput
              style={styles.input}
              value={formData.addressLine2}
              onChangeText={(text) => setFormData({ ...formData, addressLine2: text })}
              placeholder="Apartment, suite, etc. (optional)"
            />

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>City *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.city}
                  onChangeText={(text) => setFormData({ ...formData, city: text })}
                  placeholder="City"
                />
              </View>

              <View style={styles.halfInput}>
                <Text style={styles.label}>Postal Code</Text>
                <TextInput
                  style={styles.input}
                  value={formData.postalCode}
                  onChangeText={(text) => setFormData({ ...formData, postalCode: text })}
                  placeholder="Postal code"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <Text style={styles.label}>Country *</Text>
            <TextInput
              style={styles.input}
              value={formData.country}
              onChangeText={(text) => setFormData({ ...formData, country: text })}
              placeholder="Country"
            />

            <Text style={styles.label}>Phone *</Text>
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              placeholder="Phone number"
              keyboardType="phone-pad"
            />
          </View>

          {/* Payment Method Selection */}
          <View style={styles.paymentSection}>
            <Text style={styles.paymentTitle}>Payment Method</Text>
            
            <TouchableOpacity
              style={[styles.paymentOption, paymentMethod === 'benefit' && styles.paymentOptionSelected]}
              onPress={() => {
                setPaymentMethod('benefit');
                setError(''); // Clear error when changing payment method
              }}
            >
              <View style={styles.paymentOptionContent}>
                <View style={styles.radioContainer}>
                  <View style={[styles.radio, paymentMethod === 'benefit' && styles.radioSelected]}>
                    {paymentMethod === 'benefit' && <View style={styles.radioInner} />}
                  </View>
                </View>
                <View style={styles.paymentOptionText}>
                  <Text style={styles.paymentOptionTitle}>BenefitPay</Text>
                  <Text style={styles.paymentOptionDesc}>Pay quickly using Bahrain's BenefitPay app</Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.paymentOption, paymentMethod === 'cod' && styles.paymentOptionSelected]}
              onPress={() => {
                setPaymentMethod('cod');
                setError(''); // Clear error when changing payment method
              }}
            >
              <View style={styles.paymentOptionContent}>
                <View style={styles.radioContainer}>
                  <View style={[styles.radio, paymentMethod === 'cod' && styles.radioSelected]}>
                    {paymentMethod === 'cod' && <View style={styles.radioInner} />}
                  </View>
                </View>
                <View style={styles.paymentOptionText}>
                  <Text style={styles.paymentOptionTitle}>Cash on Delivery</Text>
                  <Text style={styles.paymentOptionDesc}>Pay when you receive your order</Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.paymentOption, paymentMethod === 'card' && styles.paymentOptionSelected]}
              onPress={() => {
                setPaymentMethod('card');
                setError(''); // Clear error when changing payment method
              }}
            >
              <View style={styles.paymentOptionContent}>
                <View style={styles.radioContainer}>
                  <View style={[styles.radio, paymentMethod === 'card' && styles.radioSelected]}>
                    {paymentMethod === 'card' && <View style={styles.radioInner} />}
                  </View>
                </View>
                <View style={styles.paymentOptionText}>
                  <Text style={styles.paymentOptionTitle}>Credit / Debit Card</Text>
                  <Text style={styles.paymentOptionDesc}>Visa, Mastercard and other major cards</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* Order Summary */}
          <View style={styles.summary}>
            <Text style={styles.summaryTitle}>Order Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
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
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>
              {paymentMethod === 'cod' ? 'Place Order' : 'Proceed to Payment'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#111827',
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 12,
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
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  summary: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  footer: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  submitButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  paymentSection: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paymentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#111827',
  },
  paymentOption: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#f9fafb',
  },
  paymentOptionSelected: {
    borderColor: '#dc2626',
    backgroundColor: '#fef2f2',
  },
  paymentOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioContainer: {
    marginRight: 12,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#9ca3af',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: '#dc2626',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#dc2626',
  },
  paymentOptionText: {
    flex: 1,
  },
  paymentOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  paymentOptionDesc: {
    fontSize: 12,
    color: '#6b7280',
  },
});
