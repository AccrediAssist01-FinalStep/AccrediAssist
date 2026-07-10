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

export interface WhatsAppStatusResponse {
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
  lastDisconnectedAt?: Date;
  lastConnectedAt?: Date;
}

export interface WhatsAppJoinedGroup {
  id: string;
  name: string;
  isAllowed: boolean;
}

export interface WhatsAppGroupDetectionResult {
  isConnected: boolean;
  configuration: {
    allowedGroups: string[];
    source: 'WHATSAPP_ALLOWED_GROUPS';
  };
  joinedGroups: WhatsAppJoinedGroup[];
  monitoredGroups: WhatsAppJoinedGroup[];
  unknownGroups: WhatsAppJoinedGroup[];
  missingAllowedGroups: string[];
}
