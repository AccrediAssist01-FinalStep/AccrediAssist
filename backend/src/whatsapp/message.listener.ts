import { logger } from '../utils/logger';
import { loadBaileys } from './baileys.loader';
import { groupFilter } from './group.filter';
import {
  BaileysMessageUtils,
  extractTextFromMessage,
  resolveMessageTimestamp,
  resolveSenderLabel,
  toStandardMessage,
  toStandardMessageJson,
} from './message.mapper';
import { WhatsAppIncomingMessage } from './types';

type WASocket = import('@whiskeysockets/baileys').WASocket;
type WAMessage = import('@whiskeysockets/baileys').proto.IWebMessageInfo;
type MessagesUpsertEvent = {
  messages: WAMessage[];
  type: 'append' | 'notify';
};

export type WhatsAppChatClassification = 'private' | 'unknown' | 'allowed';
export type IncomingMessageHandler = (message: WhatsAppIncomingMessage) => void | Promise<void>;

export class MessageListener {
  private listening = false;
  private socket: WASocket | null = null;
  private groupNameCache = new Map<string, string>();
  private upsertHandler: ((event: MessagesUpsertEvent) => void) | null = null;
  private receivedMessages: WhatsAppIncomingMessage[] = [];
  private baileysUtils: BaileysMessageUtils | null = null;
  private onMessage: IncomingMessageHandler = (message) => {
    logger.info('WhatsApp text message received', toStandardMessageJson(message));
  };

  isListening(): boolean {
    return this.listening;
  }

  setMessageHandler(handler: IncomingMessageHandler): void {
    this.onMessage = handler;
  }

  getReceivedMessages(): WhatsAppIncomingMessage[] {
    return [...this.receivedMessages];
  }

  clearReceivedMessages(): void {
    this.receivedMessages = [];
  }

  classifyChat(jid: string, groupName?: string): WhatsAppChatClassification {
    if (groupFilter.isPrivateChat(jid)) {
      return 'private';
    }

    if (!groupName || groupFilter.isUnknownGroup(groupName)) {
      return 'unknown';
    }

    return 'allowed';
  }

  shouldProcess(jid: string, groupName?: string): boolean {
    return this.classifyChat(jid, groupName) === 'allowed';
  }

  async start(socket: WASocket, utils?: BaileysMessageUtils): Promise<void> {
    this.stop();
    this.socket = socket;
    this.baileysUtils = utils ?? (await this.loadBaileysUtils());
    await this.refreshGroupCache(socket);

    this.upsertHandler = (event) => {
      void this.handleMessagesUpsert(event);
    };

    socket.ev.on('messages.upsert', this.upsertHandler);
    this.listening = true;
    logger.info('WhatsApp message listener started');
  }

  stop(): void {
    if (this.socket && this.upsertHandler) {
      this.socket.ev.off('messages.upsert', this.upsertHandler);
    }

    this.listening = false;
    this.socket = null;
    this.upsertHandler = null;
    this.baileysUtils = null;
    this.groupNameCache.clear();
    logger.info('WhatsApp message listener stopped');
  }

  private async handleMessagesUpsert(event: MessagesUpsertEvent): Promise<void> {
    if (event.type !== 'notify') {
      return;
    }

    for (const message of event.messages) {
      await this.processMessage(message);
    }
  }

  private async processMessage(message: WAMessage): Promise<void> {
    const remoteJid = message.key.remoteJid;

    if (!remoteJid || message.key.fromMe) {
      return;
    }

    if (groupFilter.isPrivateChat(remoteJid)) {
      return;
    }

    const groupName = await this.resolveGroupName(remoteJid);
    if (!groupName || !this.shouldProcess(remoteJid, groupName)) {
      return;
    }

    const text = extractTextFromMessage(message, this.baileysUtils ?? (await this.loadBaileysUtils()));
    if (!text) {
      return;
    }

    const standardMessage = toStandardMessage({
      groupName,
      sender: resolveSenderLabel(message),
      text,
      timestamp: resolveMessageTimestamp(message),
    });

    this.receivedMessages.push(standardMessage);
    await this.onMessage(standardMessage);
  }

  private async refreshGroupCache(socket: WASocket): Promise<void> {
    if (typeof socket.groupFetchAllParticipating !== 'function') {
      return;
    }

    try {
      const participatingGroups = await socket.groupFetchAllParticipating();
      for (const metadata of Object.values(participatingGroups)) {
        if (metadata.id && metadata.subject) {
          this.groupNameCache.set(metadata.id, metadata.subject.trim());
        }
      }
    } catch (error) {
      logger.warn('Failed to preload WhatsApp group names for message listener', { error });
    }
  }

  private async resolveGroupName(groupJid: string): Promise<string | null> {
    const cachedName = this.groupNameCache.get(groupJid);
    if (cachedName) {
      return cachedName;
    }

    const socket = this.socket;
    if (!socket || typeof socket.groupMetadata !== 'function') {
      return null;
    }

    try {
      const metadata = await socket.groupMetadata(groupJid);
      const groupName = metadata.subject?.trim();

      if (groupName) {
        this.groupNameCache.set(groupJid, groupName);
        return groupName;
      }
    } catch (error) {
      logger.warn('Failed to resolve WhatsApp group name', { groupJid, error });
    }

    return null;
  }

  private async loadBaileysUtils(): Promise<BaileysMessageUtils> {
    if (this.baileysUtils) {
      return this.baileysUtils;
    }

    const baileys = await loadBaileys();
    this.baileysUtils = {
      extractMessageContent: baileys.extractMessageContent,
      getContentType: baileys.getContentType,
    };

    return this.baileysUtils;
  }
}

export const messageListener = new MessageListener();
