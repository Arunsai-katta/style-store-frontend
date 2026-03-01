import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';
import { User } from '@/types';
import { authAPI } from '@/services/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;

  // Actions
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<void>;
  adminLogin: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; phone?: string; password: string; otp: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isAdmin: false,

      setUser: (user) => {
        set({
          user,
          isAuthenticated: !!user,
          isAdmin: user?.role === 'admin'
        });
      },

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const response = await authAPI.login({ email, password });
          const { user, token } = response.data;

          Cookies.set('token', token, { expires: 7 });
          set({
            user,
            isAuthenticated: true,
            isAdmin: user.role === 'admin',
            isLoading: false
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      adminLogin: async (email, password) => {
        set({ isLoading: true });
        try {
          const response = await authAPI.adminLogin({ email, password });
          const { user, token } = response.data;

          Cookies.set('token', token, { expires: 7 });
          set({
            user,
            isAuthenticated: true,
            isAdmin: true,
            isLoading: false
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (data) => {
        set({ isLoading: true });
        try {
          const response = await authAPI.register(data);
          const { user, token } = response.data;

          Cookies.set('token', token, { expires: 7 });
          set({
            user,
            isAuthenticated: true,
            isAdmin: false,
            isLoading: false
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          await authAPI.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          Cookies.remove('token');
          set({
            user: null,
            isAuthenticated: false,
            isAdmin: false,
            isLoading: false
          });
        }
      },

      updateUser: async (data) => {
        const response = await authAPI.updateDetails(data);
        set({ user: response.data.user });
      },

      checkAuth: async () => {
        const token = Cookies.get('token');
        if (!token) {
          set({ isAuthenticated: false, user: null, isAdmin: false });
          return;
        }

        try {
          const response = await authAPI.getMe();
          set({
            user: response.data.user,
            isAuthenticated: true,
            isAdmin: response.data.user.role === 'admin'
          });
        } catch (error) {
          Cookies.remove('token');
          set({
            user: null,
            isAuthenticated: false,
            isAdmin: false
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated, isAdmin: state.isAdmin }),
    }
  )
);
