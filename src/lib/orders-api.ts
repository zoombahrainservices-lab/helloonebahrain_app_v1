import { getSupabase } from './supabase';
import { Order } from './types';

export const ordersApi = {
  /**
   * Get user's orders from Supabase
   */
  async getUserOrders(userId: string): Promise<Order[]> {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        if (__DEV__) {
          console.error('Error fetching orders from Supabase:', error);
        }
        throw error;
      }

      if (!data || data.length === 0) {
        return [];
      }

      // Transform Supabase data to Order format
      return data.map((order: any) => ({
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
        total: parseFloat(order.total?.toString() || '0'),
        status: order.status,
        paymentStatus: order.payment_status || order.paymentStatus,
        shippingAddress: order.shipping_address || order.shippingAddress,
        createdAt: order.created_at,
        updatedAt: order.updated_at,
      }));
    } catch (error: any) {
      if (__DEV__) {
        console.error('Error fetching orders:', error);
      }
      throw error;
    }
  },

  /**
   * Get order by ID from Supabase
   */
  async getOrderById(orderId: string, userId: string): Promise<Order | null> {
    try {
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

      if (error) {
        if (__DEV__) {
          console.error('Error fetching order from Supabase:', error);
        }
        throw error;
      }

      if (!data) {
        return null;
      }

      // Transform Supabase data to Order format
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
        total: parseFloat(data.total?.toString() || '0'),
        status: data.status,
        paymentStatus: data.payment_status || data.paymentStatus,
        shippingAddress: data.shipping_address || data.shippingAddress,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error: any) {
      if (__DEV__) {
        console.error('Error fetching order:', error);
      }
      throw error;
    }
  },

  /**
   * Create order in Supabase
   */
  async createOrder(orderData: {
    userId: string;
    userEmail?: string;
    userName?: string;
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
    orderStatus?: string;
  }): Promise<Order> {
    try {
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
      // Note: user_id must be a valid Supabase auth user ID
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: orderData.userId,
          total: calculatedTotal,
          status: orderData.orderStatus || 'pending',
          payment_status: orderData.paymentStatus || 'unpaid',
          shipping_address: orderData.shippingAddress,
        })
        .select()
        .single();

      if (orderError) {
        if (__DEV__) {
          console.error('Error creating order in Supabase:', orderError);
          console.error('User ID used:', orderData.userId);
        }
        
        // If error is about foreign key constraint (user_id doesn't exist in auth.users)
        if (orderError.message?.includes('foreign key') || orderError.message?.includes('user_id') || orderError.code === '23503') {
          throw new Error('User account not found in database. Please log in again or contact support.');
        }
        
        throw orderError;
      }

      // Create order items
      const orderItemsWithOrderId = orderItems.map(item => ({
        ...item,
        order_id: order.id,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsWithOrderId);

      if (itemsError) {
        if (__DEV__) {
          console.error('Error creating order items:', itemsError);
        }
        throw itemsError;
      }

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

      if (fetchError) {
        if (__DEV__) {
          console.error('Error fetching complete order:', fetchError);
        }
        throw fetchError;
      }

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
        total: parseFloat(completeOrder.total?.toString() || '0'),
        status: completeOrder.status,
        paymentStatus: completeOrder.payment_status,
        shippingAddress: completeOrder.shipping_address,
        createdAt: completeOrder.created_at,
        updatedAt: completeOrder.updated_at,
      };
    } catch (error: any) {
      if (__DEV__) {
        console.error('Error creating order:', error);
      }
      throw error;
    }
  },
};

// Export functions as standalone for backward compatibility
export const createOrder = ordersApi.createOrder.bind(ordersApi);
export const getOrderById = ordersApi.getOrderById.bind(ordersApi);
export const getUserOrders = ordersApi.getUserOrders.bind(ordersApi);
