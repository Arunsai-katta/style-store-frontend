import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Cart, CartItem } from '@/types';
import { cartAPI } from '@/services/api';
import toast from 'react-hot-toast';

interface CartState {
  cart: Cart | null;
  isLoading: boolean;
  
  // Actions
  setCart: (cart: Cart | null) => void;
  fetchCart: () => Promise<void>;
  addItem: (data: { productId: string; colorVariantId: string; size: string; quantity?: number }) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => Promise<void>;
  syncCart: (items: any[]) => Promise<void>;
  getItemCount: () => number;
  getCartTotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cart: null,
      isLoading: false,

      setCart: (cart) => set({ cart }),

      fetchCart: async () => {
        try {
          const response = await cartAPI.getCart();
          set({ cart: response.data.cart });
        } catch (error) {
          console.error('Fetch cart error:', error);
        }
      },

      addItem: async (data) => {
        set({ isLoading: true });
        try {
          const response = await cartAPI.addItem(data);
          set({ cart: response.data.cart, isLoading: false });
          toast.success('Added to cart');
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      updateQuantity: async (itemId, quantity) => {
        try {
          const response = await cartAPI.updateQuantity(itemId, quantity);
          set({ cart: response.data.cart });
        } catch (error) {
          throw error;
        }
      },

      removeItem: async (itemId) => {
        try {
          const response = await cartAPI.removeItem(itemId);
          set({ cart: response.data.cart });
          toast.success('Item removed');
        } catch (error) {
          throw error;
        }
      },

      clearCart: async () => {
        try {
          await cartAPI.clearCart();
          set({ cart: null });
        } catch (error) {
          throw error;
        }
      },

      applyCoupon: async (code) => {
        try {
          const response = await cartAPI.applyCoupon(code);
          set({ cart: response.data.cart });
          toast.success('Coupon applied');
        } catch (error) {
          throw error;
        }
      },

      removeCoupon: async () => {
        try {
          const response = await cartAPI.removeCoupon();
          set({ cart: response.data.cart });
          toast.success('Coupon removed');
        } catch (error) {
          throw error;
        }
      },

      syncCart: async (items) => {
        try {
          const response = await cartAPI.syncCart(items);
          set({ cart: response.data.cart });
        } catch (error) {
          console.error('Sync cart error:', error);
        }
      },

      getItemCount: () => {
        return get().cart?.totals?.totalItems || 0;
      },

      getCartTotal: () => {
        return get().cart?.totals?.total || 0;
      },
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({ cart: state.cart }),
    }
  )
);
