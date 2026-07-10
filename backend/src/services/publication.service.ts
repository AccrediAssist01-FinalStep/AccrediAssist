import { publicationRepository } from '../repositories/publication.repository';
import { auditLogRepository } from '../repositories/auditLog.repository';
import { BaseService } from './base.service';
import {
  CreatePublicationInput,
  IPublication,
  IPublicationResponse,
  PublicationFilters,
  PublicationSort,
  UpdatePublicationInput,
} from '../types/publication.types';
import { toPublicationResponse } from '../utils/publication.mapper';
import { logger } from '../utils/logger';
import { PaginationOptions } from '../database/utils/queryHelpers';
import { PaginatedResult } from '../repositories/base.repository';
import {
  CreatePublicationBody,
  UpdatePublicationBody,
} from '../validations/publication.validation';

export class PublicationService extends BaseService<
  IPublication,
  IPublicationResponse,
  CreatePublicationInput,
  UpdatePublicationInput
> {
  constructor() {
    super(publicationRepository);
  }

  protected toResponse(document: IPublication): IPublicationResponse {
    return toPublicationResponse(document);
  }

  protected buildCreateData(input: CreatePublicationBody): Partial<IPublication> {
    return {
      ...input,
      authors: input.authors ?? [],
    };
  }

  protected buildUpdateData(input: UpdatePublicationBody): Partial<IPublication> {
    return input;
  }

  async listPublications(
    filters: PublicationFilters,
    pagination: PaginationOptions,
    sort: PublicationSort,
  ): Promise<PaginatedResult<IPublicationResponse>> {
    logger.info('Listing publications', { filters, pagination, sort });

    const result = await publicationRepository.findWithFilters(filters, pagination, sort);

    return {
      items: result.items.map((record) => this.toResponse(record)),
      meta: result.meta,
    };
  }

  async createPublication(
    input: CreatePublicationBody,
    userId: string,
  ): Promise<IPublicationResponse> {
    logger.info('Creating publication', { paperTitle: input.paperTitle, userId });

    const created = await this.create(input, userId);

    await auditLogRepository.create({
      userId,
      action: 'CREATE',
      module: 'Publication',
      description: `Publication created: ${input.paperTitle}`,
    });

    return created;
  }

  async updatePublication(
    id: string,
    input: UpdatePublicationBody,
    userId: string,
  ): Promise<IPublicationResponse> {
    logger.info('Updating publication', { publicationId: id, userId });

    const updated = await this.update(id, input, userId);

    await auditLogRepository.create({
      userId,
      action: 'UPDATE',
      module: 'Publication',
      description: `Publication ${id} updated`,
    });

    return updated;
  }

  async deletePublication(id: string, userId: string): Promise<void> {
    logger.info('Soft deleting publication', { publicationId: id, userId });

    await this.delete(id, userId);

    await auditLogRepository.create({
      userId,
      action: 'DELETE',
      module: 'Publication',
      description: `Publication ${id} soft deleted`,
    });
  }
}

export const publicationService = new PublicationService();
