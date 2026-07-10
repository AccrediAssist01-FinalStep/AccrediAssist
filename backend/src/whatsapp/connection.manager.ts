import { logger } from '../utils/logger';
import { whatsappService } from './whatsapp.service';
import { reconnectService } from './reconnect.service';
import { WhatsAppConnectionStatus, WhatsAppStatusResponse, WhatsAppQrResponse } from './types';

export class WhatsAppConnectionManager {
  private started = false;
  private lastConnectedAt?: Date;
  private lastDisconnectedAt?: Date;

  constructor() {
    whatsappService.setConnectionCallbacks({
      onConnected: () => this.recordConnected(),
      onDisconnected: () => this.recordDisconnected(),
    });

    reconnectService.setReconnectHandler(async () => {
      await this.handleReconnect();
    });
  }

  async initialize(): Promise<void> {
    await whatsappService.initialize();
  }

  async start(): Promise<void> {
    await this.initialize();
    whatsappService.enableAutoReconnect(true);
    this.started = true;

    if (!whatsappService.isConnected()) {
      logger.info('WhatsApp connection manager starting connection');
      void whatsappService.startConnection({ displayQrInTerminal: false });
    }
  }

  async stop(options: { logout?: boolean } = {}): Promise<void> {
    reconnectService.cancel();
    whatsappService.enableAutoReconnect(false);
    this.started = false;
    await whatsappService.disconnect({ logout: options.logout });
  }

  isStarted(): boolean {
    return this.started;
  }

  async getStatus(): Promise<WhatsAppStatusResponse> {
    const moduleStatus = await whatsappService.getModuleStatus();

    return {
      status: moduleStatus.status,
      isConnected: moduleStatus.isConnected,
      isDisconnected: moduleStatus.status === WhatsAppConnectionStatus.DISCONNECTED,
      hasStoredSession: moduleStatus.hasStoredSession,
      hasQrCode: moduleStatus.hasQrCode,
      allowedGroups: moduleStatus.allowedGroups,
      autoReconnectEnabled: whatsappService.isAutoReconnectEnabled(),
      reconnectAttempts: reconnectService.getAttemptCount(),
      isReconnectScheduled: reconnectService.isScheduled(),
      managerStarted: this.started,
      requiresQrAuthentication: whatsappService.requiresQrAuthentication(),
      reconnectExhausted: reconnectService.isExhausted(),
      lastConnectedAt: this.lastConnectedAt,
      lastDisconnectedAt: this.lastDisconnectedAt,
    };
  }

  async getQrCode(): Promise<WhatsAppQrResponse> {
    const status = whatsappService.getStatus();
    const qrCode = whatsappService.getQrCode();

    return {
      qrCode,
      hasQrCode: Boolean(qrCode),
      status,
      isConnected: whatsappService.isConnected(),
    };
  }

  recordConnected(): void {
    this.lastConnectedAt = new Date();
  }

  recordDisconnected(): void {
    this.lastDisconnectedAt = new Date();
  }

  private async handleReconnect(): Promise<void> {
    if (!this.started || whatsappService.isConnected()) {
      return;
    }

    logger.info('WhatsApp connection manager attempting reconnect');
    whatsappService.setStatus(WhatsAppConnectionStatus.RECONNECTING);
    await whatsappService.startConnection({ displayQrInTerminal: false });
  }
}

export const whatsappConnectionManager = new WhatsAppConnectionManager();
