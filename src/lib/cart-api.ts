import { getSupabase } from './supabase';
import { CartItem, Product } from './types';

/**
 * Cart API - Full CRUD operations for shopping cart
 * Stores cart items in Supabase database for cross-device sync
 */

// Transform database cart item to frontend format
const transformCartItem = (dbItem: any, product?: Product): CartItem => {
  return {
    productId: dbItem.product_id,
    name: dbItem.product?.name || dbItem.name || '',
    price: dbItem.product?.price || dbItem.price || 0,
    quantity: dbItem.quantity,
    image: dbItem.product?.image || dbItem.image || '',
    slug: dbItem.product?.slug || dbItem.slug || '',
    stockQuantity: dbItem.product?.stock_quantity || dbItem.stock_quantity,
  };
};

export const cartApi = {
  /**
   * Get user's cart items
   * @param userId - User ID from auth token
   * @returns Array of cart items
   */
  async getCart(userId: string): Promise<CartItem[]> {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        *,
        product:products (
          id,
          name,
          slug,
          price,
          image,
          in_stock,
          stock_quantity
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      if (__DEV__) {
        console.error('Error fetching cart:', error);
      }
      throw new Error(`Failed to fetch cart: ${error.message}`);
    }

    return (data || []).map((item: any) => {
      const product = item.product ? {
        _id: item.product.id,
        name: item.product.name,
        slug: item.product.slug,
        price: item.product.price,
        image: item.product.image,
        inStock: item.product.in_stock,
        stockQuantity: item.product.stock_quantity,
      } : undefined;

      return transformCartItem(item, product);
    });
  },

  /**
   * Add item to cart (or update quantity if exists)
   * @param userId - User ID
   * @param productId - Product ID
   * @param quantity - Quantity to add
   * @returns Updated cart item
   */
  async addItem(userId: string, productId: string, quantity: number): Promise<CartItem> {
    const supabase = getSupabase();

    // First, check if product exists and is in stock
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      throw new Error('Product not found');
    }

    if (!product.in_stock || product.stock_quantity <= 0) {
      throw new Error('Product is out of stock');
    }

    // Check if item already exists in cart
    const { data: existingItem } = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .single();

    let finalQuantity = quantity;
    if (existingItem) {
      finalQuantity = existingItem.quantity + quantity;
    }

    // Check stock availability
    if (finalQuantity > product.stock_quantity) {
      finalQuantity = product.stock_quantity;
    }

    // Upsert cart item
    const { data: cartItem, error } = await supabase
      .from('cart_items')
      .upsert({
        user_id: userId,
        product_id: productId,
        quantity: finalQuantity,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,product_id',
      })
      .select(`
        *,
        product:products (
          id,
          name,
          slug,
          price,
          image,
          in_stock,
          stock_quantity
        )
      `)
      .single();

    if (error) {
      if (__DEV__) {
        console.error('Error adding to cart:', error);
      }
      throw new Error(`Failed to add item to cart: ${error.message}`);
    }

    const productData = cartItem.product ? {
      _id: cartItem.product.id,
      name: cartItem.product.name,
      slug: cartItem.product.slug,
      price: cartItem.product.price,
      image: cartItem.product.image,
      inStock: cartItem.product.in_stock,
      stockQuantity: cartItem.product.stock_quantity,
    } : undefined;

    return transformCartItem(cartItem, productData);
  },

  /**
   * Update cart item quantity
   * @param userId - User ID
   * @param productId - Product ID
   * @param quantity - New quantity
   * @returns Updated cart item
   */
  async updateQuantity(userId: string, productId: string, quantity: number): Promise<CartItem> {
    const supabase = getSupabase();

    if (quantity <= 0) {
      // Remove item if quantity is 0 or less
      return this.removeItem(userId, productId);
    }

    // Check product stock
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      throw new Error('Product not found');
    }

    // Don't allow more than stock
    const finalQuantity = Math.min(quantity, product.stock_quantity || quantity);

    const { data: cartItem, error } = await supabase
      .from('cart_items')
      .update({
        quantity: finalQuantity,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('product_id', productId)
      .select(`
        *,
        product:products (
          id,
          name,
          slug,
          price,
          image,
          in_stock,
          stock_quantity
        )
      `)
      .single();

    if (error) {
      if (__DEV__) {
        console.error('Error updating cart:', error);
      }
      throw new Error(`Failed to update cart: ${error.message}`);
    }

    const productData = cartItem.product ? {
      _id: cartItem.product.id,
      name: cartItem.product.name,
      slug: cartItem.product.slug,
      price: cartItem.product.price,
      image: cartItem.product.image,
      inStock: cartItem.product.in_stock,
      stockQuantity: cartItem.product.stock_quantity,
    } : undefined;

    return transformCartItem(cartItem, productData);
  },

  /**
   * Remove item from cart
   * @param userId - User ID
   * @param productId - Product ID
   */
  async removeItem(userId: string, productId: string): Promise<void> {
    const supabase = getSupabase();

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId);

    if (error) {
      if (__DEV__) {
        console.error('Error removing from cart:', error);
      }
      throw new Error(`Failed to remove item from cart: ${error.message}`);
    }
  },

  /**
   * Clear entire cart
   * @param userId - User ID
   */
  async clearCart(userId: string): Promise<void> {
    const supabase = getSupabase();

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', userId);

    if (error) {
      if (__DEV__) {
        console.error('Error clearing cart:', error);
      }
      throw new Error(`Failed to clear cart: ${error.message}`);
    }
  },

  /**
   * Sync local cart with server (merge local items with server cart)
   * Useful when user logs in and has local cart items
   * @param userId - User ID
   * @param localItems - Local cart items to sync
   * @returns Synced cart items
   */
  async syncCart(userId: string, localItems: CartItem[]): Promise<CartItem[]> {
    const supabase = getSupabase();

    // Get server cart
    const serverCart = await this.getCart(userId);

    // Merge local and server carts
    const mergedItems = new Map<string, CartItem>();

    // Add server items first
    serverCart.forEach(item => {
      mergedItems.set(item.productId, item);
    });

    // Merge local items (local takes precedence for quantity)
    for (const localItem of localItems) {
      const existing = mergedItems.get(localItem.productId);
      if (existing) {
        // Use the higher quantity
        mergedItems.set(localItem.productId, {
          ...existing,
          quantity: Math.max(existing.quantity, localItem.quantity),
        });
      } else {
        mergedItems.set(localItem.productId, localItem);
      }
    }

    // Save merged cart to server
    const itemsToSync = Array.from(mergedItems.values());
    for (const item of itemsToSync) {
      try {
        await this.addItem(userId, item.productId, item.quantity);
      } catch (error) {
        if (__DEV__) {
          console.error('Error syncing cart item:', error);
        }
      }
    }

    // Return final cart
    return this.getCart(userId);
  },

  /**
   * Get cart item count
   * @param userId - User ID
   * @returns Total number of items in cart
   */
  async getItemCount(userId: string): Promise<number> {
    const supabase = getSupabase();

    const { count, error } = await supabase
      .from('cart_items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) {
      if (__DEV__) {
        console.error('Error getting cart count:', error);
      }
      return 0;
    }

    return count || 0;
  },

  /**
   * Get cart total price
   * @param userId - User ID
   * @returns Total price of all items in cart
   */
  async getTotal(userId: string): Promise<number> {
    const cart = await this.getCart(userId);
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  },
};














