import { groupFilter } from './group.filter';

export type WhatsAppChatClassification = 'private' | 'unknown' | 'allowed';

export class MessageListener {
  private listening = false;

  isListening(): boolean {
    return this.listening;
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

  start(): void {
    this.listening = false;
  }

  stop(): void {
    this.listening = false;
  }
}

export const messageListener = new MessageListener();
