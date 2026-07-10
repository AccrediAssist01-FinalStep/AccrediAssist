import { whatsappConfig } from './whatsapp.config';

export class GroupFilter {
  getAllowedGroups(): string[] {
    return [...whatsappConfig.allowedGroups];
  }

  isAllowedGroup(groupName: string): boolean {
    const normalizedGroupName = groupName.trim().toLowerCase();

    if (!normalizedGroupName) {
      return false;
    }

    return whatsappConfig.allowedGroups.some(
      (allowedGroup) => allowedGroup.trim().toLowerCase() === normalizedGroupName,
    );
  }
}

export const groupFilter = new GroupFilter();
