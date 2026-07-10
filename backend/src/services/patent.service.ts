import { patentRepository } from '../repositories/patent.repository';
import { auditLogRepository } from '../repositories/auditLog.repository';
import { BaseService } from './base.service';
import {
  CreatePatentInput,
  IPatent,
  IPatentResponse,
  PatentFilters,
  PatentSort,
  UpdatePatentInput,
} from '../types/patent.types';
import { toPatentResponse } from '../utils/patent.mapper';
import { logger } from '../utils/logger';
import { PaginationOptions } from '../database/utils/queryHelpers';
import { PaginatedResult } from '../repositories/base.repository';
import { CreatePatentBody, UpdatePatentBody } from '../validations/patent.validation';

export class PatentService extends BaseService<
  IPatent,
  IPatentResponse,
  CreatePatentInput,
  UpdatePatentInput
> {
  constructor() {
    super(patentRepository);
  }

  protected toResponse(document: IPatent): IPatentResponse {
    return toPatentResponse(document);
  }

  protected buildCreateData(input: CreatePatentBody): Partial<IPatent> {
    return {
      ...input,
      inventors: input.inventors ?? [],
    };
  }

  protected buildUpdateData(input: UpdatePatentBody): Partial<IPatent> {
    return input;
  }

  async listPatents(
    filters: PatentFilters,
    pagination: PaginationOptions,
    sort: PatentSort,
  ): Promise<PaginatedResult<IPatentResponse>> {
    logger.info('Listing patents', { filters, pagination, sort });

    const result = await patentRepository.findWithFilters(filters, pagination, sort);

    return {
      items: result.items.map((record) => this.toResponse(record)),
      meta: result.meta,
    };
  }

  async createPatent(input: CreatePatentBody, userId: string): Promise<IPatentResponse> {
    logger.info('Creating patent', { patentTitle: input.patentTitle, userId });

    const created = await this.create(input, userId);

    await auditLogRepository.create({
      userId,
      action: 'CREATE',
      module: 'Patent',
      description: `Patent created: ${input.patentTitle}`,
    });

    return created;
  }

  async updatePatent(
    id: string,
    input: UpdatePatentBody,
    userId: string,
  ): Promise<IPatentResponse> {
    logger.info('Updating patent', { patentId: id, userId });

    const updated = await this.update(id, input, userId);

    await auditLogRepository.create({
      userId,
      action: 'UPDATE',
      module: 'Patent',
      description: `Patent ${id} updated`,
    });

    return updated;
  }

  async deletePatent(id: string, userId: string): Promise<void> {
    logger.info('Soft deleting patent', { patentId: id, userId });

    await this.delete(id, userId);

    await auditLogRepository.create({
      userId,
      action: 'DELETE',
      module: 'Patent',
      description: `Patent ${id} soft deleted`,
    });
  }
}

export const patentService = new PatentService();
