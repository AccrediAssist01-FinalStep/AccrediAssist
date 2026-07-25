import { FilterQuery } from 'mongoose';
import {
  buildPaginationMeta,
  getPagination,
  PaginationOptions,
  withActiveFilter,
} from '../../database/utils/queryHelpers';
import { BadRequestError } from '../../utils/errors';
import { SmartSearchCollection } from '../config/search-collections.config';
import { SEARCH_COLLECTION_CONFIG } from '../config/search-execution.config';
import { SmartSearchSort } from '../config/search-fields.config';
import {
  SearchExecuteRequest,
  SearchExecutionResult,
} from '../interfaces/search-execution.interface';
import { SearchResultItem } from '../interfaces/search.interface';
import {
  buildFullTextFilter,
  buildRegexFullTextFilter,
  buildSearchMongoFilter,
} from '../utils/search-filter.util';
import { buildSearchProjection } from '../utils/search-projection.util';
import { buildSearchSortSpec } from '../utils/search-sort.util';
import { buildSearchSummary } from '../utils/search-summary.util';

const isTextIndexError = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : String(error);
  return /text index|no text index|\$text/i.test(message);
};

export class SearchRepository {
  async execute(request: SearchExecuteRequest): Promise<SearchExecutionResult> {
    const collection = request.collection;
    const config = SEARCH_COLLECTION_CONFIG[collection];

    if (!config) {
      throw new BadRequestError(`Unsupported search collection: ${collection}`);
    }

    const pagination = getPagination(request.pagination);
    const { filter, useTextSearch, textTerm } = buildSearchMongoFilter(
      collection,
      request.filters ?? {},
      request.department,
    );
    const projection = buildSearchProjection(collection, request.fields);
    const sortSpec = buildSearchSortSpec(collection, request.sort, useTextSearch);

    const baseFilter = withActiveFilter(filter as FilterQuery<Record<string, unknown>>);

    if (useTextSearch && textTerm) {
      try {
        return await this.runQuery(
          config.model,
          { ...baseFilter, ...buildFullTextFilter(textTerm) },
          collection,
          sortSpec,
          projection,
          pagination,
          true,
        );
      } catch (error) {
        if (!isTextIndexError(error)) {
          throw error;
        }
      }

      return this.runQuery(
        config.model,
        {
          ...baseFilter,
          ...buildRegexFullTextFilter(collection, textTerm),
        },
        collection,
        buildSearchSortSpec(collection, request.sort, false),
        projection,
        pagination,
        false,
      );
    }

    return this.runQuery(
      config.model,
      baseFilter,
      collection,
      sortSpec,
      projection,
      pagination,
      false,
    );
  }

  private async runQuery(
    model: (typeof SEARCH_COLLECTION_CONFIG)[SmartSearchCollection]['model'],
    query: FilterQuery<Record<string, unknown>>,
    collection: SmartSearchCollection,
    sortSpec: ReturnType<typeof buildSearchSortSpec>,
    projection: Record<string, 1>,
    pagination: ReturnType<typeof getPagination>,
    includeTextScore: boolean,
  ): Promise<SearchExecutionResult> {
    const findProjection: Record<string, 1 | { $meta: 'textScore' }> = { ...projection };

    if (includeTextScore) {
      findProjection.score = { $meta: 'textScore' };
    }

    const [records, total] = await Promise.all([
      model
        .find(query, findProjection)
        .sort(sortSpec)
        .skip(pagination.skip)
        .limit(pagination.limit)
        .lean()
        .exec(),
      model.countDocuments(query).exec(),
    ]);

    const items: SearchResultItem[] = records.map((record) => {
      const normalized = record as Record<string, unknown>;
      const scoreValue = normalized.score;

      return {
        collection,
        recordId: String(normalized._id),
        summary: buildSearchSummary(collection, normalized),
        score: typeof scoreValue === 'number' ? scoreValue : undefined,
        data: Object.fromEntries(
          Object.entries(normalized).filter(([key]) => key !== 'score'),
        ),
      };
    });

    return {
      items,
      meta: buildPaginationMeta(total, pagination),
    };
  }
}

export const searchRepository = new SearchRepository();
