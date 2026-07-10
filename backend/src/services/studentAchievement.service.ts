import { studentAchievementRepository } from '../repositories/studentAchievement.repository';
import { auditLogRepository } from '../repositories/auditLog.repository';
import { BaseService } from './base.service';
import {
  CreateStudentAchievementInput,
  IStudentAchievement,
  IStudentAchievementResponse,
  StudentAchievementFilters,
  StudentAchievementSort,
  UpdateStudentAchievementInput,
} from '../types/studentAchievement.types';
import { toStudentAchievementResponse } from '../utils/studentAchievement.mapper';
import { logger } from '../utils/logger';
import { PaginationOptions } from '../database/utils/queryHelpers';
import { PaginatedResult } from '../repositories/base.repository';
import {
  CreateStudentAchievementBody,
  UpdateStudentAchievementBody,
} from '../validations/studentAchievement.validation';

export class StudentAchievementService extends BaseService<
  IStudentAchievement,
  IStudentAchievementResponse,
  CreateStudentAchievementInput,
  UpdateStudentAchievementInput
> {
  constructor() {
    super(studentAchievementRepository);
  }

  protected toResponse(document: IStudentAchievement): IStudentAchievementResponse {
    return toStudentAchievementResponse(document);
  }

  protected buildCreateData(input: CreateStudentAchievementBody): Partial<IStudentAchievement> {
    return {
      ...input,
      photos: input.photos ?? [],
    };
  }

  protected buildUpdateData(input: UpdateStudentAchievementBody): Partial<IStudentAchievement> {
    return input;
  }

  async listStudentAchievements(
    filters: StudentAchievementFilters,
    pagination: PaginationOptions,
    sort: StudentAchievementSort,
  ): Promise<PaginatedResult<IStudentAchievementResponse>> {
    logger.info('Listing student achievements', { filters, pagination, sort });

    const result = await studentAchievementRepository.findWithFilters(filters, pagination, sort);

    return {
      items: result.items.map((record) => this.toResponse(record)),
      meta: result.meta,
    };
  }

  async createStudentAchievement(
    input: CreateStudentAchievementBody,
    userId: string,
  ): Promise<IStudentAchievementResponse> {
    logger.info('Creating student achievement', { studentName: input.studentName, userId });

    const created = await this.create(
      {
        ...input,
        approvedBy: userId,
      } as CreateStudentAchievementInput,
      userId,
    );

    await auditLogRepository.create({
      userId,
      action: 'CREATE',
      module: 'StudentAchievement',
      description: `Student achievement created for ${input.studentName}`,
    });

    return created;
  }

  async updateStudentAchievement(
    id: string,
    input: UpdateStudentAchievementBody,
    userId: string,
  ): Promise<IStudentAchievementResponse> {
    logger.info('Updating student achievement', { studentAchievementId: id, userId });

    const updated = await this.update(id, input, userId);

    await auditLogRepository.create({
      userId,
      action: 'UPDATE',
      module: 'StudentAchievement',
      description: `Student achievement ${id} updated`,
    });

    return updated;
  }

  async deleteStudentAchievement(id: string, userId: string): Promise<void> {
    logger.info('Soft deleting student achievement', { studentAchievementId: id, userId });

    await this.delete(id, userId);

    await auditLogRepository.create({
      userId,
      action: 'DELETE',
      module: 'StudentAchievement',
      description: `Student achievement ${id} soft deleted`,
    });
  }
}

export const studentAchievementService = new StudentAchievementService();
