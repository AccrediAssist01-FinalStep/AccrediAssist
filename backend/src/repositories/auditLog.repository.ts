import { AuditLog } from '../models/AuditLog';
import { CreateAuditLogInput } from '../types/auditLog.types';

export class AuditLogRepository {
  async create(data: CreateAuditLogInput): Promise<void> {
    await AuditLog.create({
      userId: data.userId,
      action: data.action,
      module: data.module,
      description: data.description,
      ipAddress: data.ipAddress,
      timestamp: data.timestamp ?? new Date(),
    });
  }
}

export const auditLogRepository = new AuditLogRepository();
