import { facultyAchievementRepository } from '../repositories/facultyAchievement.repository';
import { auditLogRepository } from '../repositories/auditLog.repository';
import { BaseService } from './base.service';
import {
  CreateFacultyAchievementInput,
  IFacultyAchievement,
  IFacultyAchievementResponse,
  FacultyAchievementFilters,
  FacultyAchievementSort,
  UpdateFacultyAchievementInput,
} from '../types/facultyAchievement.types';
import { toFacultyAchievementResponse } from '../utils/facultyAchievement.mapper';
import { logger } from '../utils/logger';
import { PaginationOptions } from '../database/utils/queryHelpers';
import { PaginatedResult } from '../repositories/base.repository';
import {
  CreateFacultyAchievementBody,
  UpdateFacultyAchievementBody,
} from '../validations/facultyAchievement.validation';

export class FacultyAchievementService extends BaseService<
  IFacultyAchievement,
  IFacultyAchievementResponse,
  CreateFacultyAchievementInput,
  UpdateFacultyAchievementInput
> {
  constructor() {
    super(facultyAchievementRepository);
  }

  protected toResponse(document: IFacultyAchievement): IFacultyAchievementResponse {
    return toFacultyAchievementResponse(document);
  }

  protected buildCreateData(input: CreateFacultyAchievementBody): Partial<IFacultyAchievement> {
    return {
      ...input,
      photos: input.photos ?? [],
    };
  }

  protected buildUpdateData(input: UpdateFacultyAchievementBody): Partial<IFacultyAchievement> {
    return input;
  }

  async listFacultyAchievements(
    filters: FacultyAchievementFilters,
    pagination: PaginationOptions,
    sort: FacultyAchievementSort,
  ): Promise<PaginatedResult<IFacultyAchievementResponse>> {
    logger.info('Listing faculty achievements', { filters, pagination, sort });

    const result = await facultyAchievementRepository.findWithFilters(filters, pagination, sort);

    return {
      items: result.items.map((record) => this.toResponse(record)),
      meta: result.meta,
    };
  }

  async createFacultyAchievement(
    input: CreateFacultyAchievementBody,
    userId: string,
  ): Promise<IFacultyAchievementResponse> {
    logger.info('Creating faculty achievement', { facultyName: input.facultyName, userId });

    const created = await this.create(
      {
        ...input,
        approvedBy: userId,
      } as CreateFacultyAchievementInput,
      userId,
    );

    await auditLogRepository.create({
      userId,
      action: 'CREATE',
      module: 'FacultyAchievement',
      description: `Faculty achievement created for ${input.facultyName}`,
    });

    return created;
  }

  async updateFacultyAchievement(
    id: string,
    input: UpdateFacultyAchievementBody,
    userId: string,
  ): Promise<IFacultyAchievementResponse> {
    logger.info('Updating faculty achievement', { facultyAchievementId: id, userId });

    const updated = await this.update(id, input, userId);

    await auditLogRepository.create({
      userId,
      action: 'UPDATE',
      module: 'FacultyAchievement',
      description: `Faculty achievement ${id} updated`,
    });

    return updated;
  }

  async deleteFacultyAchievement(id: string, userId: string): Promise<void> {
    logger.info('Soft deleting faculty achievement', { facultyAchievementId: id, userId });

    await this.delete(id, userId);

    await auditLogRepository.create({
      userId,
      action: 'DELETE',
      module: 'FacultyAchievement',
      description: `Faculty achievement ${id} soft deleted`,
    });
  }
}

export const facultyAchievementService = new FacultyAchievementService();
