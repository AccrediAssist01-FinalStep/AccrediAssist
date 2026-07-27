import fs from 'fs/promises';
import path from 'path';
import { whatsappConfig } from './whatsapp.config';
import { loadBaileys } from './baileys.loader';
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

  async loadAuthState() {
    const baileys = await loadBaileys();
    const sessionPath = await this.ensureSessionDirectory();
    return baileys.useMultiFileAuthState(sessionPath);
  }

  async clearStoredSession(): Promise<void> {
    const sessionPath = this.getSessionDirectory();

    try {
      const entries = await fs.readdir(sessionPath);
      await Promise.all(
        entries.map((entry) => fs.rm(path.join(sessionPath, entry), { recursive: true, force: true })),
      );
      logger.info('WhatsApp stored session cleared', { sessionPath });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }
}

export const sessionService = new SessionService();
