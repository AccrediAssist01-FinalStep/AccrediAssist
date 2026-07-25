import { FilterQuery, Types } from 'mongoose';
import { SearchHistory } from '../../models/SearchHistory';
import { BaseRepository, PaginatedResult } from '../../repositories/base.repository';
import {
  buildPaginationMeta,
  getPagination,
  PaginationOptions,
  withActiveFilter,
} from '../../database/utils/queryHelpers';
import {
  CreateSearchHistoryInput,
  ISearchHistory,
  ISearchHistoryResponse,
  SearchHistorySort,
} from '../../types/searchHistory.types';

const toSearchHistoryResponse = (record: ISearchHistory): ISearchHistoryResponse => ({
  _id: record._id,
  userId: record.userId,
  query: record.query,
  resultCount: record.resultCount,
  searchedAt: record.createdAt,
  createdAt: record.createdAt,
});

export class SearchHistoryRepository extends BaseRepository<ISearchHistory> {
  constructor() {
    super(SearchHistory);
  }

  async createEntry(input: CreateSearchHistoryInput): Promise<ISearchHistoryResponse> {
    const record = await this.create({
      userId: new Types.ObjectId(input.userId),
      query: input.query,
      resultCount: input.resultCount,
    } as Partial<ISearchHistory>);

    return toSearchHistoryResponse(record);
  }

  async findForUser(
    userId: string,
    pagination: PaginationOptions,
    sort: SearchHistorySort = { sortBy: 'createdAt', sortOrder: 'desc' },
  ): Promise<PaginatedResult<ISearchHistoryResponse>> {
    const query = withActiveFilter<ISearchHistory>({
      userId: new Types.ObjectId(userId),
    } as FilterQuery<ISearchHistory>);
    const pageOptions = getPagination(pagination);
    const sortOrder = sort.sortOrder === 'asc' ? 1 : -1;

    const [records, total] = await Promise.all([
      this.model
        .find(query)
        .sort({ [sort.sortBy]: sortOrder })
        .skip(pageOptions.skip)
        .limit(pageOptions.limit)
        .exec(),
      this.model.countDocuments(query).exec(),
    ]);

    return {
      items: records.map(toSearchHistoryResponse),
      meta: buildPaginationMeta(total, pageOptions),
    };
  }

  async clearForUser(userId: string): Promise<number> {
    const result = await this.model.updateMany(
      withActiveFilter({
        userId: new Types.ObjectId(userId),
        isDeleted: { $ne: true },
      }),
      { isDeleted: true },
    );

    return result.modifiedCount;
  }
}

export const searchHistoryRepository = new SearchHistoryRepository();
