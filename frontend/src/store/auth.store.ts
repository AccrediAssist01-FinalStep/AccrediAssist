import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';
import { authService, LoginCredentials } from '@/services/auth.service';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  clearError: () => void;
}

const setAuthCookie = (token: string): void => {
  document.cookie = `auth-token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
};

const clearAuthCookie = (): void => {
  document.cookie = 'auth-token=; path=/; max-age=0';
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const { token, user } = await authService.login(credentials);
          localStorage.setItem('token', token);
          setAuthCookie(token);
          set({ user, token, isAuthenticated: true, isLoading: false });
        } catch (error: unknown) {
          const message =
            error instanceof Error
              ? error.message
              : 'Login failed. Please check your credentials.';
          set({ error: message, isLoading: false, isAuthenticated: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          if (get().token) {
            await authService.logout();
          }
        } catch {
          // Continue logout even if API call fails
        } finally {
          localStorage.removeItem('token');
          clearAuthCookie();
          set({ user: null, token: null, isAuthenticated: false, error: null });
        }
      },

      fetchProfile: async () => {
        const token = get().token ?? localStorage.getItem('token');
        if (!token) return;

        set({ isLoading: true });
        try {
          const user = await authService.getProfile();
          set({ user, token, isAuthenticated: true, isLoading: false });
        } catch {
          localStorage.removeItem('token');
          clearAuthCookie();
          set({ user: null, token: null, isAuthenticated: false, isLoading: false });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
