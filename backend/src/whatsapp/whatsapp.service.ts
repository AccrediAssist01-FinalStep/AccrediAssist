import { Boom } from '@hapi/boom';
import pino from 'pino';
import { logger } from '../utils/logger';
import { loadBaileys, type BaileysModule } from './baileys.loader';
import { sessionService } from './session.service';
import { groupFilter } from './group.filter';
import { messageListener } from './message.listener';
import { reconnectService } from './reconnect.service';
import { pendingReviewWorkflowService } from '../services/pendingReviewWorkflow.service';
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
  private autoReconnectEnabled = false;
  private intentionalDisconnect = false;
  private connectionGeneration = 0;
  private requiresQrAuthenticationFlag = false;
  private staleSessionRetryAttempted = false;
  private onConnectedCallback?: () => void;
  private onDisconnectedCallback?: () => void;

  setConnectionCallbacks(callbacks: {
    onConnected?: () => void;
    onDisconnected?: () => void;
  }): void {
    this.onConnectedCallback = callbacks.onConnected;
    this.onDisconnectedCallback = callbacks.onDisconnected;
  }

  getStatus(): WhatsAppConnectionStatus {
    return this.status;
  }

  setStatus(status: WhatsAppConnectionStatus): void {
    this.status = status;
  }

  getQrCode(): string | null {
    return this.qrCode;
  }

  isConnected(): boolean {
    return this.status === WhatsAppConnectionStatus.CONNECTED;
  }

  getSocket(): WASocket | null {
    return this.socket;
  }

  isAutoReconnectEnabled(): boolean {
    return this.autoReconnectEnabled;
  }

  requiresQrAuthentication(): boolean {
    return this.requiresQrAuthenticationFlag;
  }

  enableAutoReconnect(enabled: boolean): void {
    this.autoReconnectEnabled = enabled;
    if (!enabled) {
      reconnectService.cancel();
    }
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

  async startConnection(options: WhatsAppConnectOptions = {}): Promise<WhatsAppModuleStatus> {
    if (this.isConnected()) {
      return this.getModuleStatus();
    }

    if (
      this.status === WhatsAppConnectionStatus.CONNECTING ||
      this.status === WhatsAppConnectionStatus.RECONNECTING ||
      this.status === WhatsAppConnectionStatus.AWAITING_QR
    ) {
      return this.getModuleStatus();
    }

    await this.createSocket(options);
    return this.getModuleStatus();
  }

  async connect(options: WhatsAppConnectOptions = {}): Promise<WhatsAppModuleStatus> {
    if (this.isConnected()) {
      return this.getModuleStatus();
    }

    if (
      this.status === WhatsAppConnectionStatus.CONNECTING ||
      this.status === WhatsAppConnectionStatus.RECONNECTING ||
      this.status === WhatsAppConnectionStatus.AWAITING_QR
    ) {
      await this.waitForConnection(options.connectionTimeoutMs ?? 120_000);
      return this.getModuleStatus();
    }

    await this.createSocket(options);

    try {
      await this.waitForConnection(options.connectionTimeoutMs ?? 120_000);
    } catch (error) {
      await this.disconnect();
      throw error;
    }

    return this.getModuleStatus();
  }

  async disconnect(options: WhatsAppDisconnectOptions = {}): Promise<void> {
    this.connectionGeneration += 1;
    this.intentionalDisconnect = true;
    reconnectService.cancel();
    messageListener.stop();
    this.cancelConnectionWait();

    if (!this.socket) {
      this.status = WhatsAppConnectionStatus.DISCONNECTED;
      this.qrCode = null;
      this.intentionalDisconnect = false;
      return;
    }

    const activeSocket = this.socket;
    this.socket = null;
    this.qrCode = null;
    this.status = WhatsAppConnectionStatus.DISCONNECTED;

    try {
      if (options.logout) {
        await activeSocket.logout('AccrediAssist logout');
        reconnectService.reset();
        logger.info('WhatsApp session logged out');
      } else {
        await activeSocket.end(undefined);
        logger.info('WhatsApp connection closed');
      }
    } catch (error) {
      logger.warn('WhatsApp disconnect encountered an error', { error });
    } finally {
      this.intentionalDisconnect = false;
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

  private async createSocket(options: WhatsAppConnectOptions): Promise<void> {
    const generationAtStart = ++this.connectionGeneration;
    await sessionService.ensureSessionDirectory();
    messageListener.stop();

    const baileys = await loadBaileys();
    const { state, saveCreds } = await sessionService.loadAuthState();
    const hasStoredSession = await sessionService.hasStoredSession();

    const { version, isLatest } = await baileys.fetchLatestWaWebVersion();
    const browser = baileys.Browsers.macOS('Chrome');

    this.status = hasStoredSession
      ? WhatsAppConnectionStatus.CONNECTING
      : WhatsAppConnectionStatus.AWAITING_QR;
    this.qrCode = null;

    logger.info('Starting WhatsApp connection', {
      hasStoredSession,
      sessionPath: sessionService.getSessionDirectory(),
      waVersion: version.join('.'),
      waVersionIsLatest: isLatest,
      browser,
    });

    const socket = baileys.default({
      auth: state,
      logger: baileysLogger,
      version,
      browser,
      syncFullHistory: baileysConfig.syncFullHistory,
      markOnlineOnConnect: baileysConfig.markOnlineOnConnect,
      printQRInTerminal: false,
    });

    socket.ev.on('creds.update', saveCreds);
    socket.ev.on('connection.update', (update) => {
      this.handleConnectionUpdate(update, baileys, options);
    });

    if (generationAtStart !== this.connectionGeneration) {
      try {
        await socket.end(undefined);
      } catch {
        // ignore cleanup errors for stale sockets
      }
      return;
    }

    this.socket = socket;
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
      if (this.status !== WhatsAppConnectionStatus.RECONNECTING) {
        this.status = WhatsAppConnectionStatus.CONNECTING;
      }
    }

    if (connection === 'open') {
      this.status = WhatsAppConnectionStatus.CONNECTED;
      this.qrCode = null;
      this.requiresQrAuthenticationFlag = false;
      this.staleSessionRetryAttempted = false;
      reconnectService.reset();
      this.onConnectedCallback?.();
      logger.info('WhatsApp connected successfully');
      if (this.socket) {
        pendingReviewWorkflowService.registerWhatsAppMessageHandler();
        void messageListener.start(this.socket);
      }
      this.resolveConnectionWait();
    }

    if (connection === 'close') {
      const wasConnected = this.status === WhatsAppConnectionStatus.CONNECTED;
      const statusCode = (lastDisconnect?.error as Boom | undefined)?.output?.statusCode;
      const isLoggedOut = statusCode === baileys.DisconnectReason.loggedOut;
      const isConnectionReplaced = statusCode === baileys.DisconnectReason.connectionReplaced;
      const isRestartRequired = statusCode === baileys.DisconnectReason.restartRequired;
      const isStaleSessionError = isLoggedOut || isConnectionReplaced;
      const shouldReconnect = !isLoggedOut && !isConnectionReplaced;

      messageListener.stop();
      reconnectService.markDisconnected(shouldReconnect);
      this.onDisconnectedCallback?.();

      if (isLoggedOut || isConnectionReplaced) {
        this.requiresQrAuthenticationFlag = true;
        reconnectService.reset();
      }

      logger.warn('WhatsApp connection closed', { statusCode, shouldReconnect, wasConnected });

      this.socket = null;

      // After a successful QR scan Baileys closes with restartRequired (515) and expects
      // a fresh socket using the credentials saved during pairing.
      if (
        !wasConnected &&
        isRestartRequired &&
        shouldReconnect &&
        !this.intentionalDisconnect
      ) {
        this.status = WhatsAppConnectionStatus.RECONNECTING;
        logger.info(
          'WhatsApp pairing restart required after QR scan; reconnecting with saved credentials',
        );
        void this.createSocket(options);
        return;
      }

      // Saved credentials can be invalid after a partial pairing or device unlink (401/440).
      if (
        !wasConnected &&
        isStaleSessionError &&
        !this.intentionalDisconnect &&
        !this.staleSessionRetryAttempted
      ) {
        this.staleSessionRetryAttempted = true;
        this.status = WhatsAppConnectionStatus.AWAITING_QR;
        logger.info(
          'Stored WhatsApp session is invalid; clearing credentials and requesting a new QR scan',
          { statusCode },
        );
        void sessionService.clearStoredSession().then(() => {
          void this.createSocket(options);
        });
        return;
      }

      if (!wasConnected && statusCode === 405) {
        this.rejectConnectionWait(
          new Error(
            'WhatsApp rejected the connection (405). Stop the backend server (npm run dev) before running whatsapp:connect — only one process can pair at a time.',
          ),
        );
        this.status = WhatsAppConnectionStatus.DISCONNECTED;
        return;
      }

      if (!wasConnected) {
        this.rejectConnectionWait(
          new Error(
            shouldReconnect
              ? 'WhatsApp connection closed before authentication completed'
              : 'WhatsApp session logged out or replaced',
          ),
        );
      }

      this.status = WhatsAppConnectionStatus.DISCONNECTED;

      if (
        shouldReconnect &&
        this.autoReconnectEnabled &&
        !this.intentionalDisconnect
      ) {
        if (!wasConnected) {
          this.status = WhatsAppConnectionStatus.RECONNECTING;
        }
        reconnectService.scheduleReconnect();
      }
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
