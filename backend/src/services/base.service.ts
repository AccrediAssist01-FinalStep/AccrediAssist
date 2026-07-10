import { FilterQuery } from 'mongoose';
import { PaginationOptions } from '../database/utils/queryHelpers';
import { BaseRepository, PaginatedResult } from '../repositories/base.repository';
import { IBaseDocument } from '../types/base.types';
import { NotFoundError } from '../utils/errors';

export abstract class BaseService<
  TDocument extends IBaseDocument,
  TResponse,
  TCreateInput = Partial<TDocument>,
  TUpdateInput = Partial<TDocument>,
> {
  constructor(protected readonly repository: BaseRepository<TDocument>) {}

  protected abstract toResponse(document: TDocument): TResponse;

  protected abstract buildCreateData(input: TCreateInput): Partial<TDocument>;

  protected abstract buildUpdateData(input: TUpdateInput): Partial<TDocument>;

  async getById(id: string): Promise<TResponse> {
    const document = await this.repository.findById(id);
    if (!document) {
      throw new NotFoundError('Record not found');
    }
    return this.toResponse(document);
  }

  async list(
    filters: FilterQuery<TDocument> = {},
    pagination?: PaginationOptions,
  ): Promise<TResponse[] | PaginatedResult<TResponse>> {
    const result = await this.repository.findAll(filters, pagination);

    if (Array.isArray(result)) {
      return result.map((document) => this.toResponse(document));
    }

    return {
      items: result.items.map((document) => this.toResponse(document)),
      meta: result.meta,
    };
  }

  async create(input: TCreateInput, userId?: string): Promise<TResponse> {
    const document = await this.repository.create(this.buildCreateData(input), userId);
    return this.toResponse(document);
  }

  async update(id: string, input: TUpdateInput, userId?: string): Promise<TResponse> {
    const document = await this.repository.update(id, this.buildUpdateData(input), userId);
    if (!document) {
      throw new NotFoundError('Record not found');
    }
    return this.toResponse(document);
  }

  async delete(id: string, userId?: string): Promise<void> {
    const document = await this.repository.softDelete(id, userId);
    if (!document) {
      throw new NotFoundError('Record not found');
    }
  }
}
