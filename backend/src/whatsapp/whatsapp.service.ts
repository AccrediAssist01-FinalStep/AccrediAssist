import { logger } from '../utils/logger';
import { isBaileysAvailable as checkBaileysAvailability } from './baileys.loader';
import { sessionService } from './session.service';
import { groupFilter } from './group.filter';
import { messageListener } from './message.listener';
import { mediaService } from './media.service';
import { reconnectService } from './reconnect.service';
import { baileysConfig, whatsappConfig } from './whatsapp.config';
import { WhatsAppConnectionStatus, WhatsAppModuleStatus } from './types';

export class WhatsAppService {
  private status: WhatsAppConnectionStatus = WhatsAppConnectionStatus.DISCONNECTED;

  getStatus(): WhatsAppConnectionStatus {
    return this.status;
  }

  getAllowedGroups(): string[] {
    return groupFilter.getAllowedGroups();
  }

  async initialize(): Promise<WhatsAppModuleStatus> {
    await sessionService.ensureSessionDirectory();
    messageListener.stop();
    reconnectService.reset();

    this.status = WhatsAppConnectionStatus.DISCONNECTED;
    logger.info('WhatsApp module initialized (connection disabled in this phase)');

    return this.getModuleStatus();
  }

  async getModuleStatus(): Promise<WhatsAppModuleStatus> {
    return {
      status: this.status,
      sessionPath: sessionService.getSessionDirectory(),
      allowedGroups: groupFilter.getAllowedGroups(),
      hasStoredSession: await sessionService.hasStoredSession(),
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
    return checkBaileysAvailability();
  }
}

export const whatsappService = new WhatsAppService();

export { messageListener, mediaService, reconnectService, sessionService, groupFilter };
