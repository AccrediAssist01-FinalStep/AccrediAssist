import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';
import type { User } from '@/types';
import { authService, LoginCredentials } from '@/services/auth.service';
import { parseAuthError, type ParsedAuthError } from '@/lib/auth-utils';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitializing: boolean;
  error: ParsedAuthError | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  clearError: () => void;
  initialize: () => Promise<void>;
}

const TOKEN_KEY = 'token';
const AUTH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60;

const setAuthCookie = (token: string): void => {
  const secure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `auth-token=${token}; path=/; max-age=${AUTH_COOKIE_MAX_AGE}; SameSite=Lax${secure}`;
};

const clearAuthCookie = (): void => {
  document.cookie = 'auth-token=; path=/; max-age=0';
};

const persistToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
  setAuthCookie(token);
};

const clearPersistedAuth = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  clearAuthCookie();
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      isInitializing: true,
      error: null,

      initialize: async () => {
        const token = get().token ?? localStorage.getItem(TOKEN_KEY);
        if (!token) {
          set({ isInitializing: false });
          return;
        }

        persistToken(token);
        await get().fetchProfile();
        set({ isInitializing: false });
      },

      login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const { token, user } = await authService.login(credentials);
          persistToken(token);
          set({ user, token, isAuthenticated: true, isLoading: false, error: null });
        } catch (error: unknown) {
          const parsed = parseAuthError(error);
          set({ error: parsed, isLoading: false, isAuthenticated: false });
          throw parsed;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await authService.logout();
        } catch {
          // Continue client-side logout
        } finally {
          clearPersistedAuth();
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      fetchProfile: async () => {
        const token = get().token ?? localStorage.getItem(TOKEN_KEY);
        if (!token) {
          set({ isAuthenticated: false, isInitializing: false });
          return;
        }

        set({ isLoading: true });
        try {
          persistToken(token);
          const user = await authService.getProfile();
          set({ user, token, isAuthenticated: true, isLoading: false, error: null });
        } catch (error) {
          clearPersistedAuth();
          const parsed = parseAuthError(error);
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: parsed.code === 'network' ? parsed : null,
          });
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

export const getStoredToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
};

export const isAxiosAuthError = (error: unknown): boolean => axios.isAxiosError(error);
