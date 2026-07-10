import { whatsappConfig } from './whatsapp.config';

export interface AllowedGroupConfiguration {
  allowedGroups: string[];
  source: 'WHATSAPP_ALLOWED_GROUPS';
}

export class GroupFilter {
  getAllowedGroups(): string[] {
    return [...whatsappConfig.allowedGroups];
  }

  getConfiguration(): AllowedGroupConfiguration {
    return {
      allowedGroups: this.getAllowedGroups(),
      source: 'WHATSAPP_ALLOWED_GROUPS',
    };
  }

  normalizeGroupName(groupName: string): string {
    return groupName.trim().toLowerCase();
  }

  isGroupChat(jid: string): boolean {
    return jid.endsWith('@g.us');
  }

  isPrivateChat(jid: string): boolean {
    return !this.isGroupChat(jid);
  }

  isAllowedGroup(groupName: string): boolean {
    const normalizedGroupName = this.normalizeGroupName(groupName);

    if (!normalizedGroupName) {
      return false;
    }

    return whatsappConfig.allowedGroups.some(
      (allowedGroup) => this.normalizeGroupName(allowedGroup) === normalizedGroupName,
    );
  }

  isUnknownGroup(groupName: string): boolean {
    return !this.isAllowedGroup(groupName);
  }

  shouldMonitorChat(jid: string, groupName?: string): boolean {
    if (this.isPrivateChat(jid)) {
      return false;
    }

    if (!groupName) {
      return false;
    }

    return this.isAllowedGroup(groupName);
  }
}

export const groupFilter = new GroupFilter();
