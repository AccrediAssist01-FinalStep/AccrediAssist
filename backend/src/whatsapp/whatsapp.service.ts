import { Boom } from '@hapi/boom';
import pino from 'pino';
import { logger } from '../utils/logger';
import { loadBaileys, type BaileysModule } from './baileys.loader';
import { sessionService } from './session.service';
import { groupFilter } from './group.filter';
import { messageListener } from './message.listener';
import { reconnectService } from './reconnect.service';
import { baileysConfig, whatsappConfig } from './whatsapp.config';
import { displayQrInTerminal } from './qr.display';
import {
  WhatsAppConnectionStatus,
  WhatsAppConnectOptions,
  WhatsAppDisconnectOptions,
  WhatsAppModuleStatus,
} from './types';

type WASocket = import('@whiskeysockets/baileys').WASocket;
type ConnectionUpdate = Partial<{
  connection: 'close' | 'open' | 'connecting';
  lastDisconnect?: { error?: Error };
  qr?: string;
}>;

const baileysLogger = pino({ level: 'silent' });

export class WhatsAppService {
  private status: WhatsAppConnectionStatus = WhatsAppConnectionStatus.DISCONNECTED;
  private socket: WASocket | null = null;
  private qrCode: string | null = null;
  private connectionWaitPromise: Promise<void> | null = null;
  private connectionTimeout: NodeJS.Timeout | null = null;
  private connectionResolver: (() => void) | null = null;
  private connectionRejecter: ((error: Error) => void) | null = null;

  getStatus(): WhatsAppConnectionStatus {
    return this.status;
  }

  getQrCode(): string | null {
    return this.qrCode;
  }

  isConnected(): boolean {
    return this.status === WhatsAppConnectionStatus.CONNECTED;
  }

  getAllowedGroups(): string[] {
    return groupFilter.getAllowedGroups();
  }

  async initialize(): Promise<WhatsAppModuleStatus> {
    await sessionService.ensureSessionDirectory();
    messageListener.stop();
    reconnectService.reset();

    if (!this.socket) {
      this.status = WhatsAppConnectionStatus.DISCONNECTED;
    }

    logger.info('WhatsApp module initialized');
    return this.getModuleStatus();
  }

  async connect(options: WhatsAppConnectOptions = {}): Promise<WhatsAppModuleStatus> {
    if (this.isConnected()) {
      return this.getModuleStatus();
    }

    if (this.status === WhatsAppConnectionStatus.CONNECTING) {
      await this.waitForConnection(options.connectionTimeoutMs ?? 120_000);
      return this.getModuleStatus();
    }

    await sessionService.ensureSessionDirectory();
    messageListener.stop();

    const baileys = await loadBaileys();
    const { state, saveCreds } = await sessionService.loadAuthState();
    const hasStoredSession = await sessionService.hasStoredSession();

    this.status = hasStoredSession
      ? WhatsAppConnectionStatus.CONNECTING
      : WhatsAppConnectionStatus.AWAITING_QR;
    this.qrCode = null;

    logger.info('Starting WhatsApp connection', {
      hasStoredSession,
      sessionPath: sessionService.getSessionDirectory(),
    });

    const socket = baileys.default({
      auth: state,
      logger: baileysLogger,
      browser: baileysConfig.browser,
      syncFullHistory: baileysConfig.syncFullHistory,
      markOnlineOnConnect: baileysConfig.markOnlineOnConnect,
      printQRInTerminal: false,
    });

    socket.ev.on('creds.update', saveCreds);
    socket.ev.on('connection.update', (update) => {
      this.handleConnectionUpdate(update, baileys, options);
    });

    this.socket = socket;

    try {
      await this.waitForConnection(options.connectionTimeoutMs ?? 120_000);
    } catch (error) {
      await this.disconnect();
      throw error;
    }

    return this.getModuleStatus();
  }

  async disconnect(options: WhatsAppDisconnectOptions = {}): Promise<void> {
    this.cancelConnectionWait();

    if (!this.socket) {
      this.status = WhatsAppConnectionStatus.DISCONNECTED;
      this.qrCode = null;
      return;
    }

    const activeSocket = this.socket;
    this.socket = null;
    this.qrCode = null;
    this.status = WhatsAppConnectionStatus.DISCONNECTED;

    try {
      if (options.logout) {
        await activeSocket.logout('AccrediAssist logout');
        logger.info('WhatsApp session logged out');
      } else {
        await activeSocket.end(undefined);
        logger.info('WhatsApp connection closed');
      }
    } catch (error) {
      logger.warn('WhatsApp disconnect encountered an error', { error });
    }
  }

  async getModuleStatus(): Promise<WhatsAppModuleStatus> {
    return {
      status: this.status,
      sessionPath: sessionService.getSessionDirectory(),
      allowedGroups: groupFilter.getAllowedGroups(),
      hasStoredSession: await sessionService.hasStoredSession(),
      isConnected: this.isConnected(),
      hasQrCode: Boolean(this.qrCode),
    };
  }

  getConfiguration() {
    return {
      sessionPath: whatsappConfig.sessionPath,
      allowedGroups: whatsappConfig.allowedGroups,
      baileys: baileysConfig,
    };
  }

  async isBaileysAvailable(): Promise<boolean> {
    const baileys = await loadBaileys();
    return typeof baileys.default === 'function';
  }

  private handleConnectionUpdate(
    update: ConnectionUpdate,
    baileys: BaileysModule,
    options: WhatsAppConnectOptions,
  ): void {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      this.qrCode = qr;
      this.status = WhatsAppConnectionStatus.AWAITING_QR;
      logger.info('WhatsApp QR code generated');

      if (options.displayQrInTerminal !== false) {
        displayQrInTerminal(qr);
      }
    }

    if (connection === 'connecting') {
      this.status = WhatsAppConnectionStatus.CONNECTING;
    }

    if (connection === 'open') {
      this.status = WhatsAppConnectionStatus.CONNECTED;
      this.qrCode = null;
      reconnectService.reset();
      logger.info('WhatsApp connected successfully');
      this.resolveConnectionWait();
    }

    if (connection === 'close') {
      const statusCode = (lastDisconnect?.error as Boom | undefined)?.output?.statusCode;
      const shouldReconnect =
        statusCode !== baileys.DisconnectReason.loggedOut &&
        statusCode !== baileys.DisconnectReason.connectionReplaced;

      reconnectService.markDisconnected(shouldReconnect);
      logger.warn('WhatsApp connection closed', { statusCode, shouldReconnect });

      if (this.status !== WhatsAppConnectionStatus.CONNECTED) {
        this.rejectConnectionWait(
          new Error(
            shouldReconnect
              ? 'WhatsApp connection closed before authentication completed'
              : 'WhatsApp session logged out or replaced',
          ),
        );
      }

      this.socket = null;
      this.status = WhatsAppConnectionStatus.DISCONNECTED;
    }
  }

  private waitForConnection(timeoutMs: number): Promise<void> {
    if (this.isConnected()) {
      return Promise.resolve();
    }

    if (this.connectionWaitPromise) {
      return this.connectionWaitPromise;
    }

    this.connectionWaitPromise = new Promise<void>((resolve, reject) => {
      this.connectionResolver = resolve;
      this.connectionRejecter = reject;

      this.connectionTimeout = setTimeout(() => {
        this.rejectConnectionWait(new Error('WhatsApp connection timed out'));
      }, timeoutMs);
    }).finally(() => {
      this.connectionWaitPromise = null;
      this.connectionResolver = null;
      this.connectionRejecter = null;

      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
      }
    });

    return this.connectionWaitPromise;
  }

  private cancelConnectionWait(): void {
    this.connectionResolver = null;
    this.connectionRejecter = null;
    this.connectionWaitPromise = null;

    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
  }

  private resolveConnectionWait(): void {
    this.connectionResolver?.();
    this.connectionResolver = null;
    this.connectionRejecter = null;

    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
  }

  private rejectConnectionWait(error: Error): void {
    const reject = this.connectionRejecter;
    this.connectionResolver = null;
    this.connectionRejecter = null;
    this.connectionWaitPromise = null;

    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }

    reject?.(error);
  }
}

export const whatsappService = new WhatsAppService();

export { messageListener, sessionService, groupFilter };
