import { create } from 'zustand';
import { userAPI } from '@/services/api';
import { Product } from '@/types';

interface WishlistState {
    items: string[];
    isLoading: boolean;
    isInitialized: boolean;
    fetchWishlist: () => Promise<void>;
    addItem: (productId: string) => Promise<void>;
    removeItem: (productId: string) => Promise<void>;
    isInWishlist: (productId: string) => boolean;
    clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
    items: [],
    isLoading: false,
    isInitialized: false,

    fetchWishlist: async () => {
        set({ isLoading: true });
        try {
            const response = await userAPI.getWishlist();
            const wishlistIds = response.data.wishlist.map((p: Product) => p._id);
            set({ items: wishlistIds, isInitialized: true });
        } catch (error) {
            console.error('Failed to fetch wishlist:', error);
        } finally {
            set({ isLoading: false });
        }
    },

    addItem: async (productId: string) => {
        try {
            if (!get().items.includes(productId)) {
                await userAPI.addToWishlist(productId);
                set((state) => ({ items: [...state.items, productId] }));
            }
        } catch (error) {
            console.error('Failed to add to wishlist:', error);
            throw error;
        }
    },

    removeItem: async (productId: string) => {
        try {
            if (get().items.includes(productId)) {
                await userAPI.removeFromWishlist(productId);
                set((state) => ({ items: state.items.filter((id) => id !== productId) }));
            }
        } catch (error) {
            console.error('Failed to remove from wishlist:', error);
            throw error;
        }
    },

    isInWishlist: (productId: string) => {
        return get().items.includes(productId);
    },

    clearWishlist: () => {
        set({ items: [], isInitialized: false });
    },
}));
