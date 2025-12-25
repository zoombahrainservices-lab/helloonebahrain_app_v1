import { getSupabase } from './supabase';
import { Order, ShippingAddress } from './types';
import { ensureUserExists } from './user-helpers';

/**
 * Orders API - Full CRUD operations for orders
 * Stores orders in Supabase database
 */

interface CreateOrderData {
  userId: string;
  userEmail: string;
  userName: string;
  items: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
  }>;
  shippingAddress: ShippingAddress;
  total: number;
  paymentMethod: 'cod' | 'card' | 'benefit';
  paymentStatus: 'unpaid' | 'paid';
  orderStatus: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
}

// Transform database order to frontend format
const transformOrder = (dbOrder: any, orderItems?: any[]): Order => {
  // If orderItems are provided, use them; otherwise try to get from dbOrder.items
  const items = orderItems || dbOrder.items || [];
  
  return {
    _id: dbOrder.id || dbOrder._id,
    id: dbOrder.id || dbOrder._id,
    user: dbOrder.user_id || dbOrder.user,
    items: items.map((item: any) => ({
      product: item.product_id || item.product,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      image: item.image,
    })),
    total: dbOrder.total || 0,
    status: dbOrder.status || dbOrder.order_status || 'pending',
    paymentStatus: dbOrder.payment_status || dbOrder.paymentStatus || 'unpaid',
    payment_status: dbOrder.payment_status || dbOrder.paymentStatus || 'unpaid',
    shippingAddress: dbOrder.shipping_address || dbOrder.shippingAddress || {
      fullName: '',
      addressLine1: '',
      city: '',
      country: '',
      postalCode: '',
      phone: '',
    },
    createdAt: dbOrder.created_at || dbOrder.createdAt || new Date().toISOString(),
    updatedAt: dbOrder.updated_at || dbOrder.updatedAt || new Date().toISOString(),
    created_at: dbOrder.created_at || dbOrder.createdAt || new Date().toISOString(),
  };
};

/**
 * Create a new order
 */
export async function createOrder(orderData: CreateOrderData): Promise<Order> {
  const supabase = getSupabase();

  // Ensure user exists in users table (required for foreign key constraint)
  await ensureUserExists(
    orderData.userId,
    orderData.userEmail,
    orderData.userName
  );

  // First, create the order without items (items go in order_items table)
  const { data: orderData_result, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: orderData.userId,
      shipping_address: orderData.shippingAddress,
      total: orderData.total,
      payment_method: orderData.paymentMethod, // Now using payment_method column
      payment_status: orderData.paymentStatus,
      status: orderData.orderStatus,
    })
    .select()
    .single();

  if (orderError) {
    if (__DEV__) {
      console.error('Error creating order:', orderError);
    }
    throw new Error(`Failed to create order: ${orderError.message}`);
  }

  if (!orderData_result?.id) {
    throw new Error('Order created but no ID returned');
  }

  const orderId = orderData_result.id;

  // Now insert items into orderitems table
  const orderItems = orderData.items.map(item => ({
    order_id: orderId,
    product_id: item.productId,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    image: item.image,
  }));

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems);

  if (itemsError) {
    if (__DEV__) {
      console.error('Error creating order items:', itemsError);
    }
    // Try to delete the order if items insertion failed
    await supabase.from('orders').delete().eq('id', orderId);
    throw new Error(`Failed to create order items: ${itemsError.message}`);
  }

  // Fetch the complete order with items
  return await getOrderById(orderId) || transformOrder(orderData_result);
}

/**
 * Get order by ID
 */
export async function getOrderById(orderId: string): Promise<Order | null> {
  const supabase = getSupabase();

  // Fetch the order
  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (orderError) {
    if (__DEV__) {
      console.error('Error fetching order:', orderError);
    }
    // Return null if order not found
    if (orderError.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch order: ${orderError.message}`);
  }

  if (!orderData) {
    return null;
  }

  // Fetch order items
  const { data: itemsData, error: itemsError } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', orderId);

  if (itemsError) {
    if (__DEV__) {
      console.error('Error fetching order items:', itemsError);
    }
    // If items can't be fetched, return order without items
    return transformOrder(orderData, []);
  }

  return transformOrder(orderData, itemsData || []);
}

/**
 * Get all orders for the current user
 * Works with both Supabase auth users and backend API users
 */
export async function getUserOrders(userId?: string): Promise<Order[]> {
  const supabase = getSupabase();

  let targetUserId: string | null = null;

  // If userId is provided, use it (for backend API users)
  if (userId) {
    targetUserId = userId;
    if (__DEV__) {
      console.log('📦 Fetching orders for user ID:', userId);
    }
  } else {
    // Try to get from Supabase session (for Supabase auth users)
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      targetUserId = session.user.id;
      if (__DEV__) {
        console.log('📦 Fetching orders for Supabase user:', session.user.id);
      }
    } else {
      if (__DEV__) {
        console.warn('⚠️ No user session found for getUserOrders and no userId provided');
      }
      return [];
    }
  }

  if (!targetUserId) {
    if (__DEV__) {
      console.warn('⚠️ No user ID available for getUserOrders');
    }
    return [];
  }

  // Fetch orders
  const { data: ordersData, error: ordersError } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', targetUserId)
    .order('created_at', { ascending: false });

  if (ordersError) {
    if (__DEV__) {
      console.error('Error fetching user orders:', ordersError);
    }
    throw new Error(`Failed to fetch orders: ${ordersError.message}`);
  }

  if (!ordersData || ordersData.length === 0) {
    return [];
  }

  // Fetch all order items for these orders
  const orderIds = ordersData.map(order => order.id);
  const { data: itemsData, error: itemsError } = await supabase
    .from('order_items')
    .select('*')
    .in('order_id', orderIds);

  if (itemsError) {
    if (__DEV__) {
      console.error('Error fetching order items:', itemsError);
    }
    // Return orders without items if items can't be fetched
    return ordersData.map(order => transformOrder(order, []));
  }

  // Group items by order_id
  const itemsByOrderId: Record<string, any[]> = {};
  (itemsData || []).forEach(item => {
    if (!itemsByOrderId[item.order_id]) {
      itemsByOrderId[item.order_id] = [];
    }
    itemsByOrderId[item.order_id].push(item);
  });

  // Transform orders with their items
  return ordersData.map(order => transformOrder(order, itemsByOrderId[order.id] || []));
}
