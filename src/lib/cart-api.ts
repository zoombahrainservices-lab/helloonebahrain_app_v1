import { getSupabase } from './supabase';
import { CartItem } from './types';

export const cartApi = {
  /**
   * Get user's cart from Supabase
   * Joins with products table to get product details
   */
  async getCart(userId: string): Promise<CartItem[]> {
    try {
      const supabase = getSupabase();
      
      // Fetch cart items with product details
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          id,
          product_id,
          quantity,
          products (
            id,
            name,
            slug,
            price,
            image,
            images,
            in_stock,
            stock_quantity
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) {
        if (__DEV__) {
          console.error('Error fetching cart from Supabase:', error);
        }
        throw error;
      }

      if (!data || data.length === 0) {
        return [];
      }

      // Transform Supabase data to CartItem format
      return data.map((item: any) => {
        const product = item.products;
        if (!product) {
          // Product might be deleted, skip this item
          return null;
        }

        return {
          productId: product.id || item.product_id,
          name: product.name,
          price: parseFloat(product.price?.toString() || '0'),
          quantity: item.quantity,
          image: product.image || (product.images && product.images[0]) || '',
          slug: product.slug || '',
          stockQuantity: product.stock_quantity || (product.in_stock ? 0 : 0),
        };
      }).filter((item: CartItem | null): item is CartItem => item !== null);
    } catch (error: any) {
      if (__DEV__) {
        console.error('Error fetching cart:', error);
      }
      // Return empty array on error
      return [];
    }
  },

  /**
   * Sync local cart items with Supabase
   * Adds items that don't exist, updates quantities for existing items
   */
  async syncCart(userId: string, items: CartItem[]): Promise<void> {
    try {
      const supabase = getSupabase();
      
      // Get current cart items
      const { data: existingItems } = await supabase
        .from('cart_items')
        .select('product_id, quantity')
        .eq('user_id', userId);

      const existingMap = new Map(
        (existingItems || []).map((item: any) => [item.product_id, item.quantity])
      );

      // Process each local item
      for (const item of items) {
        const existingQty = existingMap.get(item.productId) || 0;
        
        if (existingQty > 0) {
          // Update existing item
          const { error } = await supabase
            .from('cart_items')
            .update({ quantity: item.quantity })
            .eq('user_id', userId)
            .eq('product_id', item.productId);

          if (error && __DEV__) {
            console.error(`Error updating cart item ${item.productId}:`, error);
          }
        } else {
          // Insert new item
          const { error } = await supabase
            .from('cart_items')
            .insert({
              user_id: userId,
              product_id: item.productId,
              quantity: item.quantity,
            });

          if (error && __DEV__) {
            console.error(`Error adding cart item ${item.productId}:`, error);
          }
        }
      }
    } catch (error: any) {
      if (__DEV__) {
        console.error('Error syncing cart:', error);
      }
      // Don't throw - sync is best effort
    }
  },

  /**
   * Add item to cart in Supabase
   */
  async addItem(userId: string, productId: string, quantity: number): Promise<boolean> {
    try {
      const supabase = getSupabase();
      
      // Check if item already exists in cart
      const { data: existingItem } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('user_id', userId)
        .eq('product_id', productId)
        .single();

      if (existingItem) {
        // Update quantity
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity: existingItem.quantity + quantity })
          .eq('id', existingItem.id);

        if (error) {
          if (__DEV__) {
            console.error('Error updating cart item:', error);
          }
          throw error;
        }
      } else {
        // Insert new item
        const { error } = await supabase
          .from('cart_items')
          .insert({
            user_id: userId,
            product_id: productId,
            quantity: quantity,
          });

        if (error) {
          if (__DEV__) {
            console.error('Error adding cart item:', error);
          }
          throw error;
        }
      }

      return true;
    } catch (error: any) {
      if (__DEV__) {
        console.error('Error adding item to cart:', error);
      }
      throw error;
    }
  },

  /**
   * Remove item from cart in Supabase
   */
  async removeItem(userId: string, productId: string): Promise<boolean> {
    try {
      const supabase = getSupabase();
      
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', userId)
        .eq('product_id', productId);

      if (error) {
        if (__DEV__) {
          console.error('Error removing cart item:', error);
        }
        throw error;
      }

      return true;
    } catch (error: any) {
      if (__DEV__) {
        console.error('Error removing item from cart:', error);
      }
      throw error;
    }
  },

  /**
   * Update item quantity in cart in Supabase
   */
  async updateQuantity(userId: string, productId: string, quantity: number): Promise<boolean> {
    try {
      const supabase = getSupabase();
      
      if (quantity <= 0) {
        // Remove item if quantity is 0 or less
        return await this.removeItem(userId, productId);
      }

      const { error } = await supabase
        .from('cart_items')
        .update({ quantity: quantity })
        .eq('user_id', userId)
        .eq('product_id', productId);

      if (error) {
        if (__DEV__) {
          console.error('Error updating cart quantity:', error);
        }
        throw error;
      }

      return true;
    } catch (error: any) {
      if (__DEV__) {
        console.error('Error updating cart quantity:', error);
      }
      throw error;
    }
  },

  /**
   * Clear entire cart in Supabase
   */
  async clearCart(userId: string): Promise<boolean> {
    try {
      const supabase = getSupabase();
      
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', userId);

      if (error) {
        if (__DEV__) {
          console.error('Error clearing cart:', error);
        }
        throw error;
      }

      return true;
    } catch (error: any) {
      if (__DEV__) {
        console.error('Error clearing cart:', error);
      }
      throw error;
    }
  },
};
