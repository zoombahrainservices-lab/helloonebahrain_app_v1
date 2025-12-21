import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { api } from '../lib/api';
import { supabaseHelpers } from '../lib/supabase-helpers';
import { Product } from '../lib/types';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { formatPrice } from '../lib/currency';
import { RootStackParamList } from '../navigation/AppNavigator';
import ProductCard from '../components/ProductCard';

type ProductDetailRouteProp = RouteProp<RootStackParamList, 'ProductDetail'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get('window');

export default function ProductDetailScreen() {
  const route = useRoute<ProductDetailRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { slug } = route.params;
  const { addItem } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    fetchProduct();
  }, [slug]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      
      // Try Supabase first, fallback to API
      let productData: Product | null = null;
      try {
        productData = await supabaseHelpers.getProductBySlug(slug);
        if (productData) {
          setProduct(productData);
        }
      } catch (supabaseError) {
        if (__DEV__) {
          console.warn('Supabase product fetch failed, trying API:', supabaseError);
        }
        const response = await api.get(`/api/products/${slug}`);
        productData = response.data;
        setProduct(productData);
      }

      if (!productData) {
        Alert.alert('Error', 'Product not found');
        navigation.goBack();
        return;
      }

      // Fetch related products
      try {
        const relatedResult = await supabaseHelpers.searchProducts({
          category: productData.category,
          limit: 4,
        });
        setRelatedProducts(
          relatedResult.data.filter((p: Product) => p._id !== productData!._id)
        );
      } catch (supabaseError) {
        if (__DEV__) {
          console.warn('Supabase related products fetch failed, trying API:', supabaseError);
        }
        try {
          const relatedResponse = await api.get('/api/products', {
            params: { category: productData.category, limit: 4 },
          });
          setRelatedProducts(
            (relatedResponse.data.items || relatedResponse.data.products || []).filter(
              (p: Product) => p._id !== productData!._id
            )
          );
        } catch (apiError) {
          if (__DEV__) {
            console.error('Error fetching related products:', apiError);
          }
          setRelatedProducts([]);
        }
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Error fetching product:', error);
      }
      Alert.alert('Error', 'Failed to load product');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!user) {
      navigation.navigate('Login', { redirect: `ProductDetail:${slug}` });
      return;
    }

    if (product) {
      addItem(product, quantity);
      showToast('Product added to cart');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#dc2626" />
      </View>
    );
  }

  if (!product) {
    return null;
  }

  const images = [product.image, ...(product.images || [])].filter(Boolean);

  return (
    <ScrollView style={styles.container}>
      {/* Main Image */}
      <View style={styles.imageContainer}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / width);
            setSelectedImage(index);
          }}
        >
          {images.map((img, idx) => (
            <Image key={idx} source={{ uri: img }} style={styles.mainImage} resizeMode="contain" />
          ))}
        </ScrollView>
        {images.length > 1 && (
          <View style={styles.imageIndicators}>
            {images.map((_, idx) => (
              <View
                key={idx}
                style={[styles.indicator, selectedImage === idx && styles.indicatorActive]}
              />
            ))}
          </View>
        )}
      </View>

      {/* Thumbnails */}
      {images.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbnails}>
          {images.map((img, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => setSelectedImage(idx)}
              style={[styles.thumbnail, selectedImage === idx && styles.thumbnailActive]}
            >
              <Image source={{ uri: img }} style={styles.thumbnailImage} resizeMode="cover" />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Product Info */}
      <View style={styles.content}>
        <Text style={styles.category}>{product.category.toUpperCase()}</Text>
        <Text style={styles.name}>{product.name}</Text>

        {/* Rating */}
        <View style={styles.rating}>
          {[...Array(5)].map((_, i) => (
            <Text key={i} style={styles.star}>
              {i < Math.floor(product.rating) ? '★' : '☆'}
            </Text>
          ))}
          <Text style={styles.ratingText}>({product.rating})</Text>
        </View>

        <Text style={styles.price}>{formatPrice(product.price)}</Text>
        <Text style={styles.description}>{product.description}</Text>

        {/* Tags */}
        {product.tags.length > 0 && (
          <View style={styles.tags}>
            {product.tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Stock Status */}
        <View style={styles.stockContainer}>
          {product.inStock && product.stockQuantity > 0 ? (
            <View style={styles.stockInfo}>
              <View style={styles.stockDot} />
              <Text style={styles.stockText}>
                In Stock
                {product.stockQuantity <= 5 && product.stockQuantity > 0 && (
                  <Text style={styles.lowStockText}> (Only {product.stockQuantity} left!)</Text>
                )}
                {product.stockQuantity > 5 && (
                  <Text style={styles.stockQuantityText}> ({product.stockQuantity} available)</Text>
                )}
              </Text>
            </View>
          ) : (
            <View style={styles.outOfStockContainer}>
              <Text style={styles.outOfStockTitle}>Out of Stock</Text>
              <Text style={styles.outOfStockSubtitle}>This product is currently unavailable.</Text>
            </View>
          )}
        </View>

        {/* Quantity and Add to Cart */}
        {product.inStock && product.stockQuantity > 0 && (
          <View style={styles.cartSection}>
            <View style={styles.quantityContainer}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Text style={styles.quantityButtonText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.quantityText}>{quantity}</Text>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => setQuantity(Math.min(product.stockQuantity, quantity + 1))}
              >
                <Text style={styles.quantityButtonText}>+</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.addToCartButton, !user && styles.addToCartButtonDisabled]}
              onPress={handleAddToCart}
              disabled={!user}
            >
              <Text style={styles.addToCartText}>Add to Cart</Text>
            </TouchableOpacity>

            {!user && (
              <TouchableOpacity
                style={styles.loginPrompt}
                onPress={() => navigation.navigate('Login', { redirect: `ProductDetail:${slug}` })}
              >
                <Text style={styles.loginPromptText}>Log in to add items to your cart</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <View style={styles.relatedSection}>
          <Text style={styles.relatedTitle}>You May Also Like</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {relatedProducts.map((relatedProduct) => (
              <View key={relatedProduct._id} style={styles.relatedProduct}>
                <ProductCard product={relatedProduct} />
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    width: '100%',
    height: 400,
    backgroundColor: '#f3f4f6',
  },
  mainImage: {
    width,
    height: 400,
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  indicatorActive: {
    backgroundColor: '#fff',
  },
  thumbnails: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f9fafb',
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  thumbnailActive: {
    borderColor: '#dc2626',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  content: {
    padding: 16,
  },
  category: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  star: {
    fontSize: 16,
    color: '#fbbf24',
    marginRight: 2,
  },
  ratingText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 4,
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 16,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tag: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 12,
    color: '#374151',
  },
  stockContainer: {
    marginBottom: 16,
  },
  stockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stockDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  stockText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
  },
  lowStockText: {
    color: '#f59e0b',
  },
  stockQuantityText: {
    color: '#6b7280',
    fontWeight: 'normal',
  },
  outOfStockContainer: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
    padding: 16,
  },
  outOfStockTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 4,
  },
  outOfStockSubtitle: {
    fontSize: 14,
    color: '#991b1b',
  },
  cartSection: {
    marginTop: 24,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  quantityButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  quantityButtonText: {
    fontSize: 18,
    color: '#374151',
  },
  quantityText: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '600',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#e5e7eb',
  },
  addToCartButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  addToCartButtonDisabled: {
    backgroundColor: '#9ca3af',
    opacity: 0.5,
  },
  addToCartText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginPrompt: {
    padding: 12,
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fde047',
  },
  loginPromptText: {
    fontSize: 14,
    color: '#92400e',
    textAlign: 'center',
  },
  relatedSection: {
    padding: 16,
    backgroundColor: '#f9fafb',
  },
  relatedTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#111827',
  },
  relatedProduct: {
    width: 200,
    marginRight: 12,
  },
});











