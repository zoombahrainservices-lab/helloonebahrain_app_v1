import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem, Product } from '../lib/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { cartApi } from '../lib/cart-api';
import { useAuth } from './AuthContext';

interface CartContextType {
  items: CartItem[];
  loading: boolean;
  addItem: (product: Product, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  getTotal: () => number;
  getItemCount: () => number;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'hellobahrain_cart';

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load cart from database (if logged in) or local storage (if not)
  useEffect(() => {
    const loadCart = async () => {
      try {
        setLoading(true);
        
        if (user?.id) {
          // User is logged in - load from database
          try {
            const cartItems = await cartApi.getCart(user.id);
            setItems(cartItems);
            
            // Also sync any local cart items
            const localCart = await AsyncStorage.getItem(CART_STORAGE_KEY);
            if (localCart) {
              const localItems = JSON.parse(localCart);
              if (localItems.length > 0) {
                // Sync local cart with server
                await cartApi.syncCart(user.id, localItems);
                const syncedCart = await cartApi.getCart(user.id);
                setItems(syncedCart);
                // Clear local cart after sync
                await AsyncStorage.removeItem(CART_STORAGE_KEY);
              }
            }
          } catch (error) {
            if (__DEV__) {
              console.error('Error loading cart from database:', error);
            }
            // Fallback to local storage
            const localCart = await AsyncStorage.getItem(CART_STORAGE_KEY);
            if (localCart) {
              setItems(JSON.parse(localCart));
            }
          }
        } else {
          // User not logged in - load from local storage
          const localCart = await AsyncStorage.getItem(CART_STORAGE_KEY);
          if (localCart) {
            setItems(JSON.parse(localCart));
          }
        }
      } catch (error) {
        if (__DEV__) {
          console.error('Error loading cart:', error);
        }
      } finally {
        setLoading(false);
        setIsInitialized(true);
      }
    };
    
    loadCart();
  }, [user?.id]);

  // Save to local storage as backup (for offline/unauthenticated users)
  useEffect(() => {
    if (isInitialized && !user?.id) {
      AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items)).catch((error) => {
        if (__DEV__) {
          console.error('Error saving cart to local storage:', error);
        }
      });
    }
  }, [items, isInitialized, user?.id]);

  const addItem = async (product: Product, quantity: number) => {
    try {
      if (user?.id) {
        // User logged in - save to database
        await cartApi.addItem(user.id, product._id, quantity);
        // Refresh cart from database
        const updatedCart = await cartApi.getCart(user.id);
        setItems(updatedCart);
      } else {
        // User not logged in - save locally
        setItems((prevItems) => {
          const maxStock = product.inStock ? product.stockQuantity ?? 0 : 0;
          if (maxStock <= 0) {
            return prevItems;
          }

          const existingItem = prevItems.find((item) => item.productId === product._id);
          const currentQty = existingItem ? existingItem.quantity : 0;
          const desiredQty = currentQty + quantity;

          if (desiredQty > maxStock) {
            if (existingItem) {
              return prevItems.map((item) =>
                item.productId === product._id ? { ...item, quantity: maxStock } : item
              );
            }
            return [
              ...prevItems,
              {
                productId: product._id,
                name: product.name,
                price: product.price,
                quantity: maxStock,
                image: product.image,
                slug: product.slug,
                stockQuantity: maxStock,
              },
            ];
          }

          if (existingItem) {
            return prevItems.map((item) =>
              item.productId === product._id
                ? { ...item, quantity: desiredQty }
                : item
            );
          }

          return [
            ...prevItems,
            {
              productId: product._id,
              name: product.name,
              price: product.price,
              quantity,
              image: product.image,
              slug: product.slug,
              stockQuantity: maxStock,
            },
          ];
        });
      }
    } catch (error: any) {
      if (__DEV__) {
        console.error('Error adding item to cart:', error);
      }
      throw error;
    }
  };

  const removeItem = async (productId: string) => {
    try {
      if (user?.id) {
        await cartApi.removeItem(user.id, productId);
        const updatedCart = await cartApi.getCart(user.id);
        setItems(updatedCart);
      } else {
        setItems((prevItems) => prevItems.filter((item) => item.productId !== productId));
      }
    } catch (error: any) {
      if (__DEV__) {
        console.error('Error removing item from cart:', error);
      }
      throw error;
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    try {
      if (user?.id) {
        await cartApi.updateQuantity(user.id, productId, quantity);
        const updatedCart = await cartApi.getCart(user.id);
        setItems(updatedCart);
      } else {
        setItems((prevItems) => {
          const item = prevItems.find((i) => i.productId === productId);
          if (!item) return prevItems;

          if (quantity <= 0) {
            return prevItems.filter((i) => i.productId !== productId);
          }

          const maxStock = item.stockQuantity ?? Infinity;
          let finalQuantity = quantity;

          if (maxStock !== Infinity && quantity > maxStock) {
            finalQuantity = maxStock;
          }

          return prevItems.map((i) =>
            i.productId === productId ? { ...i, quantity: finalQuantity } : i
          );
        });
      }
    } catch (error: any) {
      if (__DEV__) {
        console.error('Error updating cart quantity:', error);
      }
      throw error;
    }
  };

  const clearCart = async () => {
    try {
      if (user?.id) {
        await cartApi.clearCart(user.id);
        setItems([]);
      } else {
        setItems([]);
      }
    } catch (error: any) {
      if (__DEV__) {
        console.error('Error clearing cart:', error);
      }
      throw error;
    }
  };

  const refreshCart = async () => {
    if (user?.id) {
      try {
        const cartItems = await cartApi.getCart(user.id);
        setItems(cartItems);
      } catch (error) {
        if (__DEV__) {
          console.error('Error refreshing cart:', error);
        }
      }
    }
  };

  const getTotal = () => {
    return items.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getItemCount = () => {
    return items.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        loading,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getTotal,
        getItemCount,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};



