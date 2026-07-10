import { logger } from '../utils/logger';
import { BadRequestError } from '../utils/errors';
import { groupFilter } from './group.filter';
import { whatsappService } from './whatsapp.service';
import { WhatsAppGroupDetectionResult, WhatsAppJoinedGroup } from './types';

type WASocket = import('@whiskeysockets/baileys').WASocket;
type GroupMetadata = import('@whiskeysockets/baileys').GroupMetadata;

type SocketProvider = () => WASocket | null;

export class GroupService {
  constructor(private getActiveSocket: SocketProvider = () => whatsappService.getSocket()) {}

  async fetchJoinedGroups(): Promise<WhatsAppJoinedGroup[]> {
    const socket = this.getActiveSocket();

    if (!whatsappService.isConnected() || !socket) {
      throw new BadRequestError('WhatsApp is not connected');
    }

    if (typeof socket.groupFetchAllParticipating !== 'function') {
      throw new BadRequestError('WhatsApp group fetch is unavailable');
    }

    const participatingGroups = await socket.groupFetchAllParticipating();
    const joinedGroups = Object.values(participatingGroups).map((metadata) =>
      this.mapGroupMetadata(metadata),
    );

    logger.info('Fetched joined WhatsApp groups', {
      totalJoined: joinedGroups.length,
      monitored: joinedGroups.filter((group) => group.isAllowed).length,
      unknown: joinedGroups.filter((group) => !group.isAllowed).length,
    });

    return joinedGroups.sort((left, right) => left.name.localeCompare(right.name));
  }

  async getGroupDetectionStatus(): Promise<WhatsAppGroupDetectionResult> {
    const configuration = groupFilter.getConfiguration();
    const isConnected = whatsappService.isConnected();
    const joinedGroups = isConnected ? await this.fetchJoinedGroups() : [];

    const monitoredGroups = joinedGroups.filter((group) => group.isAllowed);
    const unknownGroups = joinedGroups.filter((group) => !group.isAllowed);
    const missingAllowedGroups = configuration.allowedGroups.filter(
      (allowedGroup) =>
        !joinedGroups.some(
          (joinedGroup) =>
            groupFilter.normalizeGroupName(joinedGroup.name) ===
            groupFilter.normalizeGroupName(allowedGroup),
        ),
    );

    return {
      isConnected,
      configuration,
      joinedGroups,
      monitoredGroups,
      unknownGroups,
      missingAllowedGroups,
    };
  }

  shouldMonitorChat(jid: string, groupName?: string): boolean {
    return groupFilter.shouldMonitorChat(jid, groupName);
  }

  private mapGroupMetadata(metadata: GroupMetadata): WhatsAppJoinedGroup {
    const groupName = metadata.subject?.trim() || 'Unknown Group';

    return {
      id: metadata.id,
      name: groupName,
      isAllowed: groupFilter.isAllowedGroup(groupName),
    };
  }
}

export const groupService = new GroupService();
