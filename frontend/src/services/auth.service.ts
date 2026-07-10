import apiClient from '@/lib/api-client';
import type { ApiResponse, User } from '@/types';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export const authService = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const { data } = await apiClient.post<ApiResponse<LoginResponse>>(
      '/auth/login',
      credentials,
    );
    return data.data!;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  getProfile: async (): Promise<User> => {
    const { data } = await apiClient.get<ApiResponse<User>>('/auth/profile');
    return data.data!;
  },
};
