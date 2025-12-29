import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { api } from '../lib/api';
import { supabaseHelpers } from '../lib/supabase-helpers';
import { Product, Banner, Category } from '../lib/types';
import ProductCard from '../components/ProductCard';
import BannerCarousel from '../components/BannerCarousel';
import { MainTabParamList } from '../navigation/AppNavigator';

type HomeScreenRouteProp = RouteProp<MainTabParamList, 'Home'>;

export default function HomeScreen() {
  const route = useRoute<HomeScreenRouteProp>();
  const [products, setProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>(
    route.params?.category || 'All'
  );
  const [searchTerm, setSearchTerm] = useState('');

  // Update selected category when route params change
  useEffect(() => {
    if (route.params?.category) {
      setSelectedCategory(route.params.category);
    }
  }, [route.params?.category]);

  const fetchBanners = useCallback(async () => {
    try {
      // Try Supabase first, fallback to API
      try {
        const banners = await supabaseHelpers.getActiveBanners();
        setBanners(banners);
      } catch (supabaseError) {
        if (__DEV__) {
          console.warn('Supabase fetch failed, trying API:', supabaseError);
        }
        const response = await api.get('/api/banners/active', {
          params: { _t: Date.now() },
        });
        if (response.data && Array.isArray(response.data)) {
          setBanners(response.data);
        }
      }
    } catch (error: any) {
      if (__DEV__) {
        console.error('Error fetching banners:', error);
      }
      setBanners([]);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      // Try Supabase first, fallback to API
      try {
        const categories = await supabaseHelpers.getCategories();
        setCategories(categories);
      } catch (supabaseError) {
        if (__DEV__) {
          console.warn('Supabase fetch failed, trying API:', supabaseError);
        }
        const response = await api.get('/api/categories', {
          params: { _t: Date.now() },
        });
        if (response.data && Array.isArray(response.data)) {
          setCategories(response.data);
        }
      }
    } catch (error: any) {
      if (__DEV__) {
        console.error('Error fetching categories:', error);
      }
      setCategories([]);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {
        page: 1,
        limit: 12,
        sort: 'newest',
      };

      if (selectedCategory !== 'All') {
        params.category = selectedCategory;
      }

      if (searchTerm) {
        params.search = searchTerm;
      }

      // Try Supabase first, fallback to API
      try {
        const result = await supabaseHelpers.searchProducts(params);
        setProducts(result.data);
      } catch (supabaseError) {
        if (__DEV__) {
          console.warn('Supabase fetch failed, trying API:', supabaseError);
        }
        const response = await api.get('/api/products', { params });
        const fetchedProducts = response.data?.items || response.data?.products || (Array.isArray(response.data) ? response.data : []);
        if (__DEV__) {
          console.log('Fetched products count:', fetchedProducts.length);
        }
        setProducts(fetchedProducts);
      }
    } catch (error: any) {
      if (__DEV__) {
        console.error('Error fetching products:', error);
      }
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchTerm]);

  useEffect(() => {
    fetchBanners();
    fetchCategories();
  }, [fetchBanners, fetchCategories]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchBanners(), fetchCategories(), fetchProducts()]);
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {banners.length > 0 && <BannerCarousel banners={banners} />}

      <View style={styles.content}>
        {/* Search */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            onSubmitEditing={fetchProducts}
          />
        </View>

        {/* Categories */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
          <TouchableOpacity
            style={[styles.categoryChip, selectedCategory === 'All' && styles.categoryChipActive]}
            onPress={() => setSelectedCategory('All')}
          >
            <Text style={[styles.categoryText, selectedCategory === 'All' && styles.categoryTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.categoryChip, selectedCategory === cat.name && styles.categoryChipActive]}
              onPress={() => setSelectedCategory(cat.name)}
            >
              <Text style={[styles.categoryText, selectedCategory === cat.name && styles.categoryTextActive]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Products */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#dc2626" />
          </View>
        ) : products.length > 0 ? (
          <View style={styles.productsGrid}>
            {products.map((product) => (
              <View key={product._id} style={styles.productWrapper}>
                <ProductCard product={product} />
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No products found</Text>
            <Text style={styles.errorHint}>
              Check console (F12) for API errors
            </Text>
            <Text style={styles.errorHint}>
              Make sure API is running and accessible
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    padding: 16,
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  categoriesContainer: {
    marginBottom: 16,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  categoryChipActive: {
    backgroundColor: '#dc2626',
    borderColor: '#dc2626',
  },
  categoryText: {
    color: '#374151',
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#fff',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  productWrapper: {
    width: '48%',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 8,
  },
  errorHint: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 4,
  },
});
