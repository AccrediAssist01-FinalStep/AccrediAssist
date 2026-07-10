import { auditLogRepository } from '../repositories/auditLog.repository';
import {
  AuditLogFilters,
  AuditLogSort,
  IAuditLogResponse,
} from '../types/auditLog.types';
import { toAuditLogResponse } from '../utils/auditLog.mapper';
import { logger } from '../utils/logger';
import { PaginationOptions } from '../database/utils/queryHelpers';
import { PaginatedResult } from '../repositories/base.repository';

export class AuditLogService {
  async listAuditLogs(
    filters: AuditLogFilters,
    pagination: PaginationOptions,
    sort: AuditLogSort,
  ): Promise<PaginatedResult<IAuditLogResponse>> {
    logger.info('Listing audit logs', { filters, pagination, sort });

    const result = await auditLogRepository.findWithFilters(filters, pagination, sort);

    return {
      items: result.items.map((record) => toAuditLogResponse(record)),
      meta: result.meta,
    };
  }
}

export const auditLogService = new AuditLogService();
