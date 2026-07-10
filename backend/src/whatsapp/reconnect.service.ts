import { logger } from '../utils/logger';
import { reconnectConfig } from './whatsapp.config';

type ReconnectHandler = () => Promise<void>;

export class ReconnectService {
  private shouldReconnect = false;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectHandler: ReconnectHandler | null = null;
  private attempts = 0;

  setReconnectHandler(handler: ReconnectHandler): void {
    this.reconnectHandler = handler;
  }

  markDisconnected(shouldReconnect: boolean): void {
    this.shouldReconnect = shouldReconnect;
    logger.info('WhatsApp reconnect state updated', { shouldReconnect });
  }

  shouldAttemptReconnect(): boolean {
    return this.shouldReconnect;
  }

  isScheduled(): boolean {
    return this.reconnectTimer !== null;
  }

  getAttemptCount(): number {
    return this.attempts;
  }

  scheduleReconnect(): void {
    if (!this.shouldReconnect || !this.reconnectHandler || this.reconnectTimer) {
      return;
    }

    if (this.attempts >= reconnectConfig.maxAttempts) {
      logger.error('WhatsApp reconnect attempts exhausted', {
        attempts: this.attempts,
        maxAttempts: reconnectConfig.maxAttempts,
      });
      this.shouldReconnect = false;
      return;
    }

    this.attempts += 1;
    const delayMs = Math.min(
      reconnectConfig.baseDelayMs * this.attempts,
      reconnectConfig.maxDelayMs,
    );

    logger.info('Scheduling WhatsApp reconnect', {
      attempt: this.attempts,
      delayMs,
    });

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      void this.executeReconnect();
    }, delayMs);
  }

  cancel(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  reset(): void {
    this.cancel();
    this.shouldReconnect = false;
    this.attempts = 0;
  }

  private async executeReconnect(): Promise<void> {
    if (!this.reconnectHandler || !this.shouldReconnect) {
      return;
    }

    try {
      await this.reconnectHandler();
    } catch (error) {
      logger.warn('WhatsApp reconnect attempt failed', { error, attempt: this.attempts });
      this.scheduleReconnect();
    }
  }
}

export const reconnectService = new ReconnectService();
