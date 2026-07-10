export enum WhatsAppConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  AWAITING_QR = 'awaiting_qr',
}

export interface WhatsAppIncomingMessage {
  groupName: string;
  sender: string;
  message: string;
  timestamp: Date;
  media: string | null;
}

export interface WhatsAppModuleStatus {
  status: WhatsAppConnectionStatus;
  sessionPath: string;
  allowedGroups: string[];
  hasStoredSession: boolean;
  isConnected: boolean;
  hasQrCode: boolean;
}

export interface WhatsAppConnectOptions {
  displayQrInTerminal?: boolean;
  connectionTimeoutMs?: number;
}

export interface WhatsAppDisconnectOptions {
  logout?: boolean;
}
