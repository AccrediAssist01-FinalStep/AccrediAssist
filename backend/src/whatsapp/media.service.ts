import { logger } from '../utils/logger';

export class MediaService {
  async processIncomingMedia(): Promise<never> {
    logger.warn('WhatsApp media processing is not implemented yet');
    throw new Error('WhatsApp media processing is not implemented yet');
  }
}

export const mediaService = new MediaService();
