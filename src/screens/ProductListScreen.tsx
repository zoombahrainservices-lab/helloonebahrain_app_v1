import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { api } from '@/lib/api';
import { supabaseHelpers } from '@/lib/supabase-helpers';
import { Product, Category } from '@/lib/types';
import ProductCard from '@/components/ProductCard';

export default function ProductListScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchCategories = useCallback(async () => {
    try {
      // Try Supabase first, fallback to API
      try {
        const categoriesData = await supabaseHelpers.getCategories();
        setCategories(categoriesData);
      } catch (supabaseError) {
        if (__DEV__) {
          console.warn('Supabase categories fetch failed, trying API:', supabaseError);
        }
        const response = await api.get('/api/categories');
        if (response.data && Array.isArray(response.data)) {
          setCategories(response.data);
        }
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Error fetching categories:', error);
      }
      setCategories([]);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      // Map sortBy to Supabase format
      let sortParam = 'newest';
      if (sortBy === 'price_asc') {
        sortParam = 'price-low';
      } else if (sortBy === 'price_desc') {
        sortParam = 'price-high';
      } else if (sortBy === 'newest') {
        sortParam = 'newest';
      }

      const params: any = {
        page,
        limit: 12,
        sort: sortParam,
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
        const fetchedProducts = result.data || [];
        
        if (page === 1) {
          setProducts(fetchedProducts);
        } else {
          setProducts((prev) => [...prev, ...fetchedProducts]);
        }
        
        // Calculate total pages from count
        const totalItems = result.count || 0;
        setTotalPages(Math.ceil(totalItems / (params.limit || 12)));
      } catch (supabaseError) {
        if (__DEV__) {
          console.warn('Supabase products fetch failed, trying API:', supabaseError);
        }
        const response = await api.get('/api/products', { params });
        const fetchedProducts = response.data.items || [];
        
        if (page === 1) {
          setProducts(fetchedProducts);
        } else {
          setProducts((prev) => [...prev, ...fetchedProducts]);
        }
        
        setTotalPages(response.data.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchTerm, sortBy, page]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    setPage(1);
    fetchProducts();
  }, [selectedCategory, searchTerm, sortBy]);

  useEffect(() => {
    if (page > 1) {
      fetchProducts();
    }
  }, [page]);

  const onRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    await Promise.all([fetchCategories(), fetchProducts()]);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (page < totalPages && !loading) {
      setPage((prev) => prev + 1);
    }
  };

  const renderItem = ({ item }: { item: Product }) => (
    <View style={styles.productWrapper}>
      <ProductCard product={item} />
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={
          <>
            {/* Filters */}
            <View style={styles.filtersContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search products..."
                value={searchTerm}
                onChangeText={setSearchTerm}
              />
              <View style={styles.sortContainer}>
                <Text style={styles.sortLabel}>Sort:</Text>
                <TouchableOpacity
                  style={[styles.sortButton, sortBy === 'newest' && styles.sortButtonActive]}
                  onPress={() => setSortBy('newest')}
                >
                  <Text style={[styles.sortText, sortBy === 'newest' && styles.sortTextActive]}>
                    Newest
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.sortButton, sortBy === 'price_asc' && styles.sortButtonActive]}
                  onPress={() => setSortBy('price_asc')}
                >
                  <Text style={[styles.sortText, sortBy === 'price_asc' && styles.sortTextActive]}>
                    Price ↑
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.sortButton, sortBy === 'price_desc' && styles.sortButtonActive]}
                  onPress={() => setSortBy('price_desc')}
                >
                  <Text
                    style={[styles.sortText, sortBy === 'price_desc' && styles.sortTextActive]}
                  >
                    Price ↓
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Categories */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoriesContainer}
              contentContainerStyle={{ paddingHorizontal: 16 }}
            >
              <TouchableOpacity
                style={[styles.categoryChip, selectedCategory === 'All' && styles.categoryChipActive]}
                onPress={() => setSelectedCategory('All')}
              >
                <Text
                  style={[styles.categoryText, selectedCategory === 'All' && styles.categoryTextActive]}
                  numberOfLines={1}
                >
                  All
                </Text>
              </TouchableOpacity>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id ?? cat.slug ?? cat.name}
                  style={[
                    styles.categoryChip,
                    selectedCategory === cat.name && styles.categoryChipActive,
                  ]}
                  onPress={() => setSelectedCategory(cat.name)}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      selectedCategory === cat.name && styles.categoryTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        }
        ListFooterComponent={
          loading && page > 1 ? (
            <ActivityIndicator size="small" color="#dc2626" style={styles.footerLoader} />
          ) : null
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No products found</Text>
            </View>
          ) : (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#dc2626" />
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  filtersContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchInput: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sortLabel: {
    fontSize: 14,
    color: '#374151',
    marginRight: 4,
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
  },
  sortButtonActive: {
    backgroundColor: '#dc2626',
  },
  sortText: {
    fontSize: 12,
    color: '#374151',
  },
  sortTextActive: {
    color: '#fff',
  },
  categoriesContainer: {
    marginBottom: 16,
    paddingTop: 5,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#fff',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryChipActive: {
    backgroundColor: '#dc2626',
    borderColor: '#dc2626',
  },
  categoryText: {
    color: '#374151',
    fontWeight: '500',
    fontSize: 13,
  },
  categoryTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: 8,
  },
  productWrapper: {
    width: '50%',
    padding: 4,
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
  },
  footerLoader: {
    padding: 20,
  },
});

