import { placementRepository } from '../repositories/placement.repository';
import { auditLogRepository } from '../repositories/auditLog.repository';
import { BaseService } from './base.service';
import {
  CreatePlacementInput,
  IPlacement,
  IPlacementResponse,
  PlacementFilters,
  PlacementSort,
  UpdatePlacementInput,
} from '../types/placement.types';
import { toPlacementResponse } from '../utils/placement.mapper';
import { logger } from '../utils/logger';
import { PaginationOptions } from '../database/utils/queryHelpers';
import { PaginatedResult } from '../repositories/base.repository';
import {
  CreatePlacementBody,
  UpdatePlacementBody,
} from '../validations/placement.validation';

export class PlacementService extends BaseService<
  IPlacement,
  IPlacementResponse,
  CreatePlacementInput,
  UpdatePlacementInput
> {
  constructor() {
    super(placementRepository);
  }

  protected toResponse(document: IPlacement): IPlacementResponse {
    return toPlacementResponse(document);
  }

  protected buildCreateData(input: CreatePlacementBody): Partial<IPlacement> {
    return input;
  }

  protected buildUpdateData(input: UpdatePlacementBody): Partial<IPlacement> {
    return input;
  }

  async listPlacements(
    filters: PlacementFilters,
    pagination: PaginationOptions,
    sort: PlacementSort,
  ): Promise<PaginatedResult<IPlacementResponse>> {
    logger.info('Listing placements', { filters, pagination, sort });

    const result = await placementRepository.findWithFilters(filters, pagination, sort);

    return {
      items: result.items.map((record) => this.toResponse(record)),
      meta: result.meta,
    };
  }

  async createPlacement(input: CreatePlacementBody, userId: string): Promise<IPlacementResponse> {
    logger.info('Creating placement', { studentName: input.studentName, company: input.company, userId });

    const created = await this.create(
      {
        ...input,
        approvedBy: userId,
      } as CreatePlacementInput,
      userId,
    );

    await auditLogRepository.create({
      userId,
      action: 'CREATE',
      module: 'Placement',
      description: `Placement created for ${input.studentName} at ${input.company}`,
    });

    return created;
  }

  async updatePlacement(
    id: string,
    input: UpdatePlacementBody,
    userId: string,
  ): Promise<IPlacementResponse> {
    logger.info('Updating placement', { placementId: id, userId });

    const updated = await this.update(id, input, userId);

    await auditLogRepository.create({
      userId,
      action: 'UPDATE',
      module: 'Placement',
      description: `Placement ${id} updated`,
    });

    return updated;
  }

  async deletePlacement(id: string, userId: string): Promise<void> {
    logger.info('Soft deleting placement', { placementId: id, userId });

    await this.delete(id, userId);

    await auditLogRepository.create({
      userId,
      action: 'DELETE',
      module: 'Placement',
      description: `Placement ${id} soft deleted`,
    });
  }
}

export const placementService = new PlacementService();
