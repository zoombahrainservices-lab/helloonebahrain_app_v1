import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Alert, Platform } from 'react-native';
import { Product } from '../lib/types';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { formatPrice } from '../lib/currency';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

interface ProductCardProps {
  product: Product;
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const { user } = useAuth();
  const navigation = useNavigation<NavigationProp>();
  const [adding, setAdding] = useState(false);

  const handleAddToCart = () => {
    if (!product.inStock || (product.stockQuantity !== undefined && product.stockQuantity <= 0)) {
      return;
    }

    if (!user) {
      navigation.navigate('Login', { redirect: `ProductDetail:${product.slug}` });
      return;
    }

    try {
      setAdding(true);
      addItem(product, 1);
      Alert.alert('Success', 'Product added to cart');
    } catch (error) {
      Alert.alert('Error', 'Failed to add product to cart');
    } finally {
      setTimeout(() => setAdding(false), 500);
    }
  };

  const handlePress = () => {
    navigation.navigate('ProductDetail', { slug: product.slug });
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.8}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: product.image }} style={styles.image} resizeMode="cover" />
        {product.isNew && (
          <View style={styles.newBadge}>
            <Text style={styles.badgeText}>New</Text>
          </View>
        )}
        {product.isFeatured && (
          <View style={styles.featuredBadge}>
            <Text style={styles.badgeText}>Hot</Text>
          </View>
        )}
        {!product.inStock && (
          <View style={styles.outOfStockOverlay}>
            <Text style={styles.outOfStockText}>Out of Stock</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.category}>{product.category.toUpperCase()}</Text>
        <Text style={styles.name} numberOfLines={1}>
          {product.name}
        </Text>

        <View style={styles.rating}>
          {[...Array(5)].map((_, i) => (
            <Text key={i} style={styles.star}>
              {i < Math.floor(product.rating) ? '★' : '☆'}
            </Text>
          ))}
          <Text style={styles.ratingText}>({product.rating})</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.price}>{formatPrice(product.price)}</Text>
          {product.inStock && (
            <Text style={styles.stockText}>In Stock</Text>
          )}
        </View>
      </View>

      <TouchableOpacity
        style={[styles.addButton, (!product.inStock || adding) && styles.addButtonDisabled]}
        onPress={handleAddToCart}
        disabled={!product.inStock || adding || (product.stockQuantity !== undefined && product.stockQuantity <= 0)}
      >
        <Text style={styles.addButtonText}>
          {product.inStock ? (adding ? 'Adding...' : 'Add to Cart') : 'Out of Stock'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    margin: 8,
    ...(Platform.OS === 'web' 
      ? { boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)' } as any
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }
    ),
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    position: 'relative',
    backgroundColor: '#f3f4f6',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  newBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#dc2626',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  featuredBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  outOfStockOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outOfStockText: {
    backgroundColor: '#fff',
    color: '#000',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    fontWeight: 'bold',
  },
  content: {
    padding: 12,
  },
  category: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  star: {
    fontSize: 12,
    color: '#fbbf24',
    marginRight: 2,
  },
  ratingText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  stockText: {
    fontSize: 10,
    color: '#10b981',
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 12,
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#9ca3af',
    opacity: 0.5,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});