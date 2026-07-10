import { internshipRepository } from '../repositories/internship.repository';
import { auditLogRepository } from '../repositories/auditLog.repository';
import { BaseService } from './base.service';
import {
  CreateInternshipInput,
  IInternship,
  IInternshipResponse,
  InternshipFilters,
  InternshipSort,
  UpdateInternshipInput,
} from '../types/internship.types';
import { toInternshipResponse } from '../utils/internship.mapper';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';
import { PaginationOptions } from '../database/utils/queryHelpers';
import { PaginatedResult } from '../repositories/base.repository';
import {
  CreateInternshipBody,
  UpdateInternshipBody,
} from '../validations/internship.validation';

export class InternshipService extends BaseService<
  IInternship,
  IInternshipResponse,
  CreateInternshipInput,
  UpdateInternshipInput
> {
  constructor() {
    super(internshipRepository);
  }

  protected toResponse(document: IInternship): IInternshipResponse {
    return toInternshipResponse(document);
  }

  protected buildCreateData(input: CreateInternshipBody): Partial<IInternship> {
    return input;
  }

  protected buildUpdateData(input: UpdateInternshipBody): Partial<IInternship> {
    return input;
  }

  async listInternships(
    filters: InternshipFilters,
    pagination: PaginationOptions,
    sort: InternshipSort,
  ): Promise<PaginatedResult<IInternshipResponse>> {
    logger.info('Listing internships', { filters, pagination, sort });

    const result = await internshipRepository.findWithFilters(filters, pagination, sort);

    return {
      items: result.items.map((record) => this.toResponse(record)),
      meta: result.meta,
    };
  }

  async createInternship(input: CreateInternshipBody, userId: string): Promise<IInternshipResponse> {
    logger.info('Creating internship', {
      studentName: input.studentName,
      company: input.company,
      userId,
    });

    const created = await this.create(
      {
        ...input,
        approvedBy: userId,
      } as CreateInternshipInput,
      userId,
    );

    await auditLogRepository.create({
      userId,
      action: 'CREATE',
      module: 'Internship',
      description: `Internship created for ${input.studentName} at ${input.company}`,
    });

    return created;
  }

  async updateInternship(
    id: string,
    input: UpdateInternshipBody,
    userId: string,
  ): Promise<IInternshipResponse> {
    logger.info('Updating internship', { internshipId: id, userId });

    const existing = await internshipRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Record not found');
    }

    const startDate = input.startDate ?? existing.startDate;
    const endDate = input.endDate ?? existing.endDate;
    if (startDate && endDate && endDate < startDate) {
      throw new BadRequestError('End date must be on or after start date');
    }

    const updated = await this.update(id, input, userId);

    await auditLogRepository.create({
      userId,
      action: 'UPDATE',
      module: 'Internship',
      description: `Internship ${id} updated`,
    });

    return updated;
  }

  async deleteInternship(id: string, userId: string): Promise<void> {
    logger.info('Soft deleting internship', { internshipId: id, userId });

    await this.delete(id, userId);

    await auditLogRepository.create({
      userId,
      action: 'DELETE',
      module: 'Internship',
      description: `Internship ${id} soft deleted`,
    });
  }
}

export const internshipService = new InternshipService();
