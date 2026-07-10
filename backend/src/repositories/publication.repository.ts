import { FilterQuery } from 'mongoose';
import { Publication } from '../models/Publication';
import { BaseRepository, PaginatedResult } from './base.repository';
import {
  buildPaginationMeta,
  getPagination,
  PaginationOptions,
  withActiveFilter,
} from '../database/utils/queryHelpers';
import { IPublication, PublicationFilters, PublicationSort } from '../types/publication.types';

export class PublicationRepository extends BaseRepository<IPublication> {
  constructor() {
    super(Publication);
  }

  private buildFilterQuery(filters: PublicationFilters = {}): FilterQuery<IPublication> {
    const query: FilterQuery<IPublication> = {};

    if (filters.facultyName) {
      query.facultyName = { $regex: filters.facultyName, $options: 'i' };
    }

    if (filters.journal) {
      query.journal = { $regex: filters.journal, $options: 'i' };
    }

    if (filters.conference) {
      query.conference = { $regex: filters.conference, $options: 'i' };
    }

    if (filters.fromDate || filters.toDate) {
      query.publicationDate = {};
      if (filters.fromDate) {
        query.publicationDate.$gte = filters.fromDate;
      }
      if (filters.toDate) {
        query.publicationDate.$lte = filters.toDate;
      }
    }

    if (filters.search) {
      const searchRegex = { $regex: filters.search, $options: 'i' };
      query.$or = [
        { facultyName: searchRegex },
        { paperTitle: searchRegex },
        { journal: searchRegex },
        { conference: searchRegex },
        { doi: searchRegex },
        { authors: searchRegex },
      ];
    }

    return query;
  }

  async findWithFilters(
    filters: PublicationFilters = {},
    pagination: PaginationOptions,
    sort: PublicationSort,
  ): Promise<PaginatedResult<IPublication>> {
    const query = withActiveFilter(this.buildFilterQuery(filters));
    const pageOptions = getPagination(pagination);
    const sortOrder = sort.sortOrder === 'asc' ? 1 : -1;

    const [items, total] = await Promise.all([
      this.model
        .find(query)
        .sort({ [sort.sortBy]: sortOrder })
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
}

export const publicationRepository = new PublicationRepository();
