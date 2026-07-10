import fs from 'fs/promises';
import path from 'path';
import { whatsappConfig } from './whatsapp.config';
import { logger } from '../utils/logger';

const CREDENTIALS_FILE = 'creds.json';

export class SessionService {
  getSessionDirectory(): string {
    return whatsappConfig.sessionPath;
  }

  async ensureSessionDirectory(): Promise<string> {
    const sessionPath = this.getSessionDirectory();
    await fs.mkdir(sessionPath, { recursive: true });
    logger.info('WhatsApp session directory ready', { sessionPath });
    return sessionPath;
  }

  async hasStoredSession(): Promise<boolean> {
    try {
      const credentialsPath = path.join(this.getSessionDirectory(), CREDENTIALS_FILE);
      await fs.access(credentialsPath);
      return true;
    } catch {
      return false;
    }
  }
}

export const sessionService = new SessionService();
