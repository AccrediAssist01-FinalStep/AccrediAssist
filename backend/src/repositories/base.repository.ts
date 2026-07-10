import { FilterQuery, Model } from 'mongoose';
import {
  buildPaginationMeta,
  getPagination,
  PaginationOptions,
  PaginationResult,
  withActiveFilter,
} from '../database/utils/queryHelpers';
import { IBaseDocument } from '../types/base.types';
import { PaginationMeta } from '../types/api.types';

export interface PaginatedResult<T> {
  items: T[];
  meta: PaginationMeta;
}

export abstract class BaseRepository<T extends IBaseDocument> {
  constructor(protected readonly model: Model<T>) {}

  async findById(id: string): Promise<T | null> {
    return this.model
      .findOne(withActiveFilter<T>({ _id: id } as FilterQuery<T>))
      .exec();
  }

  async findAll(
    filters: FilterQuery<T> = {},
    pagination?: PaginationOptions,
  ): Promise<T[] | PaginatedResult<T>> {
    const query = withActiveFilter(filters);

    if (!pagination) {
      return this.model.find(query).sort({ createdAt: -1 }).exec();
    }

    const pageOptions = getPagination(pagination);
    const [items, total] = await Promise.all([
      this.model
        .find(query)
        .sort({ createdAt: -1 })
        .skip(pageOptions.skip)
        .limit(pageOptions.limit)
        .exec(),
      this.model.countDocuments(query).exec(),
    ]);

    return {
      items,
      meta: buildPaginationMeta(total, pageOptions),
    };
  }

  async create(data: Partial<T>, createdBy?: string): Promise<T> {
    const document = new this.model({
      ...data,
      ...(createdBy ? { createdBy } : {}),
    });
    return document.save();
  }

  async update(id: string, data: Partial<T>, updatedBy?: string): Promise<T | null> {
    return this.model
      .findOneAndUpdate(
        withActiveFilter<T>({ _id: id } as FilterQuery<T>),
        { ...data, ...(updatedBy ? { updatedBy } : {}) },
        { new: true, runValidators: true },
      )
      .exec();
  }

  async softDelete(id: string, updatedBy?: string): Promise<T | null> {
    return this.model
      .findOneAndUpdate(
        withActiveFilter<T>({ _id: id } as FilterQuery<T>),
        { isDeleted: true, ...(updatedBy ? { updatedBy } : {}) },
        { new: true },
      )
      .exec();
  }

  async count(filters: FilterQuery<T> = {}): Promise<number> {
    return this.model.countDocuments(withActiveFilter(filters)).exec();
  }

  async exists(id: string): Promise<boolean> {
    const document = await this.findById(id);
    return document !== null;
  }

  protected getPagination(options: PaginationOptions = {}): PaginationResult {
    return getPagination(options);
  }
}
