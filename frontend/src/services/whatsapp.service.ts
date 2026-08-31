import axios from 'axios';
import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types';

export type WhatsAppConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'awaiting_qr';

export interface WhatsAppStatus {
  status: WhatsAppConnectionStatus;
  isConnected: boolean;
  isDisconnected: boolean;
  hasStoredSession: boolean;
  hasQrCode: boolean;
  allowedGroups: string[];
  autoReconnectEnabled: boolean;
  reconnectAttempts: number;
  isReconnectScheduled: boolean;
  managerStarted: boolean;
  requiresQrAuthentication: boolean;
  reconnectExhausted: boolean;
  isMessageListenerActive: boolean;
  lastConnectedAt?: string;
  lastDisconnectedAt?: string;
}

export interface WhatsAppQrPayload {
  qrCode: string | null;
  hasQrCode: boolean;
  status: WhatsAppConnectionStatus;
  isConnected: boolean;
}

export const getWhatsAppApiErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return 'The backend is unavailable. Check that the server is running and try again.';
    }

    const status = error.response.status;
    if (status === 401) {
      return 'Your session expired. Please sign in again.';
    }
    if (status === 403) {
      return 'You do not have permission to manage WhatsApp.';
    }

    const payload = error.response.data as { message?: unknown } | undefined;
    if (typeof payload?.message === 'string' && payload.message.trim().length > 0) {
      return payload.message.trim().slice(0, 180);
    }

    return 'WhatsApp could not complete this request. Please try again.';
  }

  return 'WhatsApp could not complete this request. Please try again.';
};

export const whatsappService = {
  getStatus: async (): Promise<WhatsAppStatus> => {
    const { data } = await apiClient.get<ApiResponse<WhatsAppStatus>>('/whatsapp/status');
    if (!data.data) {
      throw new Error('WhatsApp status is unavailable.');
    }
    return data.data;
  },

  getQr: async (): Promise<WhatsAppQrPayload> => {
    const { data } = await apiClient.get<ApiResponse<WhatsAppQrPayload>>('/whatsapp/qr');
    if (!data.data) {
      throw new Error('WhatsApp QR data is unavailable.');
    }
    return data.data;
  },

  connect: async (): Promise<WhatsAppStatus> => {
    const { data } = await apiClient.post<ApiResponse<WhatsAppStatus>>('/whatsapp/connect');
    if (!data.data) {
      throw new Error('WhatsApp connection could not be started.');
    }
    return data.data;
  },
};
