import { logger } from '../utils/logger';

export class MessageListener {
  private listening = false;

  isListening(): boolean {
    return this.listening;
  }

  start(): void {
    logger.info('WhatsApp message listener is not active yet');
    this.listening = false;
  }

  stop(): void {
    this.listening = false;
  }
}

export const messageListener = new MessageListener();
