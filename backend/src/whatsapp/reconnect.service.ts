import { logger } from '../utils/logger';

export class ReconnectService {
  private shouldReconnect = false;

  markDisconnected(shouldReconnect: boolean): void {
    this.shouldReconnect = shouldReconnect;
    logger.info('WhatsApp reconnect state updated', { shouldReconnect });
  }

  shouldAttemptReconnect(): boolean {
    return this.shouldReconnect;
  }

  reset(): void {
    this.shouldReconnect = false;
  }
}

export const reconnectService = new ReconnectService();
