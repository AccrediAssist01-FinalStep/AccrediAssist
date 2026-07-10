import { completedEventReportRepository } from '../repositories/completedEventReport.repository';
import { auditLogRepository } from '../repositories/auditLog.repository';
import { BaseService } from './base.service';
import {
  CompletedEventReportFilters,
  CompletedEventReportSort,
  CreateCompletedEventReportInput,
  ICompletedEventReport,
  ICompletedEventReportResponse,
  UpdateCompletedEventReportInput,
} from '../types/completedEventReport.types';
import { toCompletedEventReportResponse } from '../utils/completedEventReport.mapper';
import { logger } from '../utils/logger';
import { PaginationOptions } from '../database/utils/queryHelpers';
import { PaginatedResult } from '../repositories/base.repository';
import {
  CreateCompletedEventReportBody,
  UpdateCompletedEventReportBody,
} from '../validations/completedEventReport.validation';

export class CompletedEventReportService extends BaseService<
  ICompletedEventReport,
  ICompletedEventReportResponse,
  CreateCompletedEventReportInput,
  UpdateCompletedEventReportInput
> {
  constructor() {
    super(completedEventReportRepository);
  }

  protected toResponse(document: ICompletedEventReport): ICompletedEventReportResponse {
    return toCompletedEventReportResponse(document);
  }

  protected buildCreateData(
    input: CreateCompletedEventReportInput,
  ): Partial<ICompletedEventReport> {
    return {
      ...input,
      photoUrls: input.photoUrls ?? [],
    };
  }

  protected buildUpdateData(
    input: UpdateCompletedEventReportBody,
  ): Partial<ICompletedEventReport> {
    return input;
  }

  async listCompletedEventReports(
    filters: CompletedEventReportFilters,
    pagination: PaginationOptions,
    sort: CompletedEventReportSort,
  ): Promise<PaginatedResult<ICompletedEventReportResponse>> {
    logger.info('Listing completed event reports', { filters, pagination, sort });

    const result = await completedEventReportRepository.findWithFilters(
      filters,
      pagination,
      sort,
    );

    return {
      items: result.items.map((record) => this.toResponse(record)),
      meta: result.meta,
    };
  }

  async createCompletedEventReport(
    input: CreateCompletedEventReportBody,
    userId: string,
  ): Promise<ICompletedEventReportResponse> {
    logger.info('Creating completed event report', { eventTitle: input.eventTitle, userId });

    const created = await this.create(
      {
        ...input,
        approvedBy: userId,
      } as CreateCompletedEventReportInput,
      userId,
    );

    await auditLogRepository.create({
      userId,
      action: 'CREATE',
      module: 'CompletedEventReport',
      description: `Completed event report created: ${input.eventTitle}`,
    });

    return created;
  }

  async updateCompletedEventReport(
    id: string,
    input: UpdateCompletedEventReportBody,
    userId: string,
  ): Promise<ICompletedEventReportResponse> {
    logger.info('Updating completed event report', { completedEventReportId: id, userId });

    const updated = await this.update(id, input, userId);

    await auditLogRepository.create({
      userId,
      action: 'UPDATE',
      module: 'CompletedEventReport',
      description: `Completed event report ${id} updated`,
    });

    return updated;
  }

  async deleteCompletedEventReport(id: string, userId: string): Promise<void> {
    logger.info('Soft deleting completed event report', { completedEventReportId: id, userId });

    await this.delete(id, userId);

    await auditLogRepository.create({
      userId,
      action: 'DELETE',
      module: 'CompletedEventReport',
      description: `Completed event report ${id} soft deleted`,
    });
  }
}

export const completedEventReportService = new CompletedEventReportService();
