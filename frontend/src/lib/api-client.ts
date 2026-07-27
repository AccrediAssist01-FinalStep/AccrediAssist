import axios, { AxiosError } from 'axios';
import { API_BASE_URL } from '@/constants';
import { parseAuthError } from '@/lib/auth-utils';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    if (typeof window !== 'undefined') {
      const isLoginRequest = error.config?.url?.includes('/auth/login');

      if (!error.response && !isLoginRequest) {
        return Promise.reject(parseAuthError(error));
      }

      if (error.response?.status === 401 && !isLoginRequest) {
        localStorage.removeItem('token');
        document.cookie = 'auth-token=; path=/; max-age=0';

        const currentPath = window.location.pathname;
        if (!currentPath.startsWith('/login')) {
          const loginUrl = new URL('/login', window.location.origin);
          loginUrl.searchParams.set('expired', '1');
          if (currentPath !== '/') {
            loginUrl.searchParams.set('redirect', currentPath);
          }
          window.location.href = loginUrl.toString();
        }
      }

      if (isLoginRequest) {
        return Promise.reject(parseAuthError(error));
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
