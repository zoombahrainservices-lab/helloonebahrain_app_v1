import { getSupabase } from './supabase';

// Helper functions for Supabase operations in mobile app
export const supabaseHelpers = {
  // Search products with filters
  async searchProducts(params: {
    search?: string;
    category?: string;
    sort?: string;
    page?: number;
    limit?: number;
  }) {
    const supabase = getSupabase();
    let query = supabase
      .from('products')
      .select('*', { count: 'exact' });

    // Apply search filter
    if (params.search) {
      query = query.or(`name.ilike.%${params.search}%,description.ilike.%${params.search}%`);
    }

    // Apply category filter
    if (params.category) {
      query = query.eq('category', params.category);
    }

    // Apply sorting
    switch (params.sort) {
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      case 'price-low':
        query = query.order('price', { ascending: true });
        break;
      case 'price-high':
        query = query.order('price', { ascending: false });
        break;
      case 'rating':
        query = query.order('rating', { ascending: false });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    // Apply pagination
    const page = params.page || 1;
    const limit = params.limit || 12;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      if (__DEV__) {
        console.error('Error fetching products from Supabase:', error);
      }
      throw error;
    }

    // Transform to camelCase for frontend
    const transformedData = (data || []).map((product: any) => ({
      _id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: product.price,
      category: product.category,
      tags: product.tags || [],
      image: product.image,
      images: product.images || [],
      inStock: product.in_stock,
      stockQuantity: product.stock_quantity,
      rating: product.rating,
      isFeatured: product.is_featured,
      isNew: product.is_new,
      createdAt: product.created_at,
      updatedAt: product.updated_at,
    }));

    return {
      data: transformedData,
      count: count || 0,
    };
  },

  // Get single product by slug
  async getProductBySlug(slug: string) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      if (__DEV__) {
        console.error('Error fetching product from Supabase:', error);
      }
      throw error;
    }

    if (!data) return null;

    // Transform to camelCase
    return {
      _id: data.id,
      name: data.name,
      slug: data.slug,
      description: data.description,
      price: data.price,
      category: data.category,
      tags: data.tags || [],
      image: data.image,
      images: data.images || [],
      inStock: data.in_stock,
      stockQuantity: data.stock_quantity,
      rating: data.rating,
      isFeatured: data.is_featured,
      isNew: data.is_new,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  // Get categories
  async getCategories() {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      if (__DEV__) {
        console.error('Error fetching categories from Supabase:', error);
      }
      throw error;
    }

    return (data || []).map((cat: any) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
    }));
  },

  // Get active banners
  async getActiveBanners() {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false });

    if (error) {
      if (__DEV__) {
        console.error('Error fetching banners from Supabase:', error);
      }
      throw error;
    }

    if (!data || data.length === 0) return [];

    // Transform banners (similar to backend logic)
    const bannersWithOrder = data.map((banner: any) => {
      const ctaLink = banner.cta_link || '';
      const linkParts = ctaLink.split('|||');
      let displayOrder = 0;
      
      if (linkParts[1]) {
        try {
          const alignmentData = JSON.parse(linkParts[1]);
          displayOrder = alignmentData.displayOrder || 0;
        } catch (e) {
          // Invalid JSON, use default
        }
      }
      
      return { ...banner, _displayOrder: displayOrder };
    });

    // Sort by displayOrder
    bannersWithOrder.sort((a: any, b: any) => {
      if (a._displayOrder !== b._displayOrder) {
        return a._displayOrder - b._displayOrder;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    // Transform to camelCase
    return bannersWithOrder.map((banner: any) => {
      const ctaLink = banner.cta_link || '';
      const linkParts = ctaLink.split('|||');
      const actualLink = linkParts[0] || '';
      let alignmentData: any = {
        textAlign: 'left',
        textVertical: 'middle',
        buttonAlign: 'left',
        buttonVertical: 'middle',
        displayOrder: 0,
        titleColor: '#ffffff',
        subtitleColor: '#e5e7eb',
        buttonBgColor: '#ffffff',
        buttonTextColor: '#111827',
        titleSize: 'lg',
        subtitleSize: 'md',
        titleBold: true,
        titleItalic: false,
        subtitleBold: false,
        subtitleItalic: false,
      };

      if (linkParts[1]) {
        try {
          alignmentData = JSON.parse(linkParts[1]);
        } catch (e) {
          // Invalid JSON, use defaults
        }
      }

      return {
        _id: banner.id,
        title: banner.title,
        subtitle: banner.subtitle,
        ctaLabel: banner.cta_label,
        ctaLink: actualLink,
        image: banner.image,
        active: banner.active,
        textAlign: alignmentData.textAlign || 'left',
        textVertical: alignmentData.textVertical || 'middle',
        buttonAlign: alignmentData.buttonAlign || 'left',
        buttonVertical: alignmentData.buttonVertical || 'middle',
        displayOrder: alignmentData.displayOrder || 0,
        titleColor: alignmentData.titleColor || '#ffffff',
        subtitleColor: alignmentData.subtitleColor || '#e5e7eb',
        buttonBgColor: alignmentData.buttonBgColor || '#ffffff',
        buttonTextColor: alignmentData.buttonTextColor || '#111827',
        titleSize: alignmentData.titleSize || 'lg',
        subtitleSize: alignmentData.subtitleSize || 'md',
        titleBold: alignmentData.titleBold ?? true,
        titleItalic: alignmentData.titleItalic ?? false,
        subtitleBold: alignmentData.subtitleBold ?? false,
        subtitleItalic: alignmentData.subtitleItalic ?? false,
      };
    });
  },

  // Create order directly in Supabase
  async createOrder(orderData: {
    userId: string;
    items: Array<{
      productId: string;
      name: string;
      price: number;
      quantity: number;
      image: string;
    }>;
    shippingAddress: any;
    total: number;
    paymentMethod: string;
    paymentStatus?: string;
  }) {
    const supabase = getSupabase();
    
    // First, verify products and calculate total
    let calculatedTotal = 0;
    const orderItems = [];

    for (const item of orderData.items) {
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', item.productId)
        .single();

      if (productError || !product) {
        throw new Error(`Product not found: ${item.productId}`);
      }

      if (!product.in_stock || product.stock_quantity < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}`);
      }

      orderItems.push({
        product_id: product.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
      });

      calculatedTotal += parseFloat(product.price.toString()) * item.quantity;
    }

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: orderData.userId,
        total: calculatedTotal,
        status: 'pending',
        payment_status: orderData.paymentStatus || 'unpaid',
        shipping_address: orderData.shippingAddress,
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Create order items
    const orderItemsWithOrderId = orderItems.map(item => ({
      ...item,
      order_id: order.id,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsWithOrderId);

    if (itemsError) throw itemsError;

    // Update stock quantities
    for (const item of orderItems) {
      const { data: product } = await supabase
        .from('products')
        .select('stock_quantity')
        .eq('id', item.product_id)
        .single();

      if (product) {
        await supabase
          .from('products')
          .update({ stock_quantity: product.stock_quantity - item.quantity })
          .eq('id', item.product_id);
      }
    }

    // Fetch complete order with items
    const { data: completeOrder, error: fetchError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .eq('id', order.id)
      .single();

    if (fetchError) throw fetchError;

    // Transform to match expected format
    return {
      _id: completeOrder.id,
      id: completeOrder.id,
      user: completeOrder.user_id,
      items: (completeOrder.order_items || []).map((item: any) => ({
        product: item.product_id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
      })),
      total: completeOrder.total,
      status: completeOrder.status,
      paymentStatus: completeOrder.payment_status,
      shippingAddress: completeOrder.shipping_address,
      createdAt: completeOrder.created_at,
      updatedAt: completeOrder.updated_at,
    };
  },

  // Get user orders
  async getUserOrders(userId: string) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((order: any) => ({
      _id: order.id,
      id: order.id,
      user: order.user_id,
      items: (order.order_items || []).map((item: any) => ({
        product: item.product_id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
      })),
      total: order.total,
      status: order.status,
      paymentStatus: order.payment_status,
      shippingAddress: order.shipping_address,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
    }));
  },

  // Get order by ID
  async getOrderById(orderId: string, userId: string) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .eq('id', orderId)
      .eq('user_id', userId)
      .single();

    if (error) throw error;

    if (!data) return null;

    return {
      _id: data.id,
      id: data.id,
      user: data.user_id,
      items: (data.order_items || []).map((item: any) => ({
        product: item.product_id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
      })),
      total: data.total,
      status: data.status,
      paymentStatus: data.payment_status,
      shippingAddress: data.shipping_address,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },
};
