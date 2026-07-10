import { logger } from '../utils/logger';

export class ReconnectService {
  async scheduleReconnect(): Promise<void> {
    logger.info('WhatsApp reconnect handling is not implemented yet');
  }

  reset(): void {
    logger.debug('WhatsApp reconnect state reset');
  }
}

export const reconnectService = new ReconnectService();
