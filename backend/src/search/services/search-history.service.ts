import { PaginationOptions } from '../../database/utils/queryHelpers';
import { PaginatedResult } from '../../repositories/base.repository';
import { ISearchHistoryResponse } from '../../types/searchHistory.types';
import {
  searchHistoryRepository,
  SearchHistoryRepository,
} from '../repositories/search-history.repository';

export class SearchHistoryService {
  constructor(private readonly repository: SearchHistoryRepository = searchHistoryRepository) {}

  async recordSearch(
    userId: string,
    query: string,
    resultCount: number,
  ): Promise<ISearchHistoryResponse> {
    return this.repository.createEntry({
      userId,
      query: query.trim(),
      resultCount,
    });
  }

  async getHistory(
    userId: string,
    pagination: PaginationOptions = {},
  ): Promise<PaginatedResult<ISearchHistoryResponse>> {
    return this.repository.findForUser(userId, pagination);
  }

  async clearHistory(userId: string): Promise<{ deletedCount: number }> {
    const deletedCount = await this.repository.clearForUser(userId);

    return { deletedCount };
  }
}

export const searchHistoryService = new SearchHistoryService();
