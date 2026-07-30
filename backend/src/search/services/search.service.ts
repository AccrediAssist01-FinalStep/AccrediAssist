import { isGeminiConfigured } from '../../ai/utils/ai-config.util';
import {
  BadRequestError,
  InternalServerError,
  ValidationError,
} from '../../utils/errors';
import { logger } from '../../utils/logger';
import { smartSearchAgent, SmartSearchAgent } from '../agents/smart-search.agent';
import {
  DEFAULT_SMART_SEARCH_COLLECTIONS,
  SmartSearchCollection,
} from '../config/search-collections.config';
import {
  GlobalSearchApiData,
  GlobalSearchRequestOptions,
} from '../interfaces/global-search.interface';
import {
  SearchModuleStatus,
} from '../interfaces/search.interface';
import {
  SmartSearchApiResponse,
  SmartSearchRequestOptions,
  StructuredSearchRequestOptions,
} from '../interfaces/smart-search-response.interface';
import { searchRepository, SearchRepository } from '../repositories/search.repository';
import {
  searchHistoryService,
  SearchHistoryService,
} from './search-history.service';
import {
  buildGlobalSearchHistoryQuery,
  buildQueryFallbackFilters,
  inferCollectionFromFilters,
  inferCollectionFromQuery,
  mergeSearchFilters,
  resolveSearchSort,
  toGlobalSearchApiData,
} from '../utils/global-search.util';
import { buildStructuredSearchHistoryQuery } from '../utils/search-history.util';
import {
  buildSmartSearchApiResponse,
  buildSmartSearchUnderstanding,
} from '../utils/search-response.util';

const isGeminiAvailabilityError = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : String(error);
  return /404|429|quota|not found|unavailable|not configured/i.test(message);
};

export class SearchService {
  constructor(
    private readonly agent: SmartSearchAgent = smartSearchAgent,
    private readonly repository: SearchRepository = searchRepository,
    private readonly historyService: SearchHistoryService = searchHistoryService,
  ) {}

  getModuleStatus(): SearchModuleStatus {
    const providerStatus = this.agent.getProvider().getStatus();
    const geminiConfigured = this.agent.getProvider().isConfigured();

    return {
      queryUnderstanding: geminiConfigured,
      databaseSearch: true,
      integrated: geminiConfigured && isGeminiConfigured(),
      geminiConfigured,
      geminiModel: providerStatus.model,
      supportedCollections: DEFAULT_SMART_SEARCH_COLLECTIONS,
    };
  }

  private async recordSearchHistorySafely(
    userId: string,
    query: string,
    resultCount: number,
  ): Promise<void> {
    try {
      await this.historyService.recordSearch(userId, query, resultCount);
    } catch (error) {
      logger.warn('Failed to record search history', {
        userId,
        query,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  getSupportedCollections(): readonly SmartSearchCollection[] {
    return DEFAULT_SMART_SEARCH_COLLECTIONS;
  }

  async globalSearch(
    input: GlobalSearchRequestOptions,
    userId: string,
  ): Promise<GlobalSearchApiData> {
    const query = input.query.trim();

    if (!query) {
      throw new BadRequestError('Search query is required');
    }

    logger.info('Global search requested', { userId, query });

    let parsed: Awaited<ReturnType<SmartSearchAgent['parseQuery']>>;

    if (input.collection) {
      parsed = {
        result: {
          collection: input.collection,
          filters: mergeSearchFilters(
            buildQueryFallbackFilters(query, input.collection),
            input.filters ?? {},
            input.collection,
          ),
          sort: input.sort ?? '',
          confidence: null,
        },
        model: '',
        provider: 'gemini',
      };
    } else {
      if (!isGeminiConfigured()) {
        throw new BadRequestError('Smart search is unavailable because Gemini is not configured');
      }

      try {
        parsed = await this.agent.parseQuery({
          query,
          department: input.department,
        });
      } catch (error) {
        if (error instanceof ValidationError || error instanceof BadRequestError) {
          const fallbackCollection = inferCollectionFromQuery(query);

          if (fallbackCollection) {
            parsed = {
              result: {
                collection: fallbackCollection,
                filters: buildQueryFallbackFilters(query, fallbackCollection),
                sort: input.sort ?? 'latest',
                confidence: null,
              },
              model: '',
              provider: 'gemini',
            };
          } else {
            throw error;
          }
        } else if (error instanceof InternalServerError || isGeminiAvailabilityError(error)) {
          throw new BadRequestError('Smart search query understanding is temporarily unavailable');
        } else {
          throw error;
        }
      }
    }

    const collection =
      input.collection ??
      parsed.result.collection ??
      inferCollectionFromFilters(mergeSearchFilters(parsed.result.filters, input.filters ?? {})) ??
      inferCollectionFromQuery(query);

    if (!collection) {
      throw new ValidationError(
        'Could not determine a search collection for the query. Try mentioning placements, internships, achievements, publications, patents, events, or news.',
      );
    }

    const appliedFilters = mergeSearchFilters(parsed.result.filters, input.filters ?? {}, collection);
    const appliedSort = resolveSearchSort(parsed.result.sort, input.sort);

    const execution = await this.repository.execute({
      collection,
      filters: appliedFilters,
      sort: appliedSort,
      department: input.department,
      fields: input.fields,
      pagination: {
        page: input.page,
        limit: input.limit,
      },
    });

    const understandingSource = input.collection ? 'structured' : 'gemini';

    const response = toGlobalSearchApiData(
      query,
      buildSmartSearchUnderstanding(parsed.result, understandingSource, {
        model: parsed.model,
        provider: parsed.provider,
      }),
      appliedFilters,
      execution,
    );

    await this.recordSearchHistorySafely(
      userId,
      buildGlobalSearchHistoryQuery(query),
      execution.meta.total,
    );

    return response;
  }

  async executeStructuredSearch(
    input: StructuredSearchRequestOptions,
    userId: string,
  ): Promise<SmartSearchApiResponse> {
    if (!input.collection) {
      throw new BadRequestError('Search collection is required');
    }

    logger.info('Structured search requested', {
      userId,
      collection: input.collection,
    });

    const execution = await this.repository.execute({
      collection: input.collection,
      filters: input.filters ?? {},
      sort: input.sort,
      department: input.department,
      fields: input.fields,
      pagination: {
        page: input.page,
        limit: input.limit,
      },
    });

    const response = buildSmartSearchApiResponse({
      understanding: buildSmartSearchUnderstanding(
        {
          collection: input.collection,
          filters: input.filters ?? {},
          sort: input.sort ?? '',
          confidence: null,
        },
        'structured',
      ),
      execution,
    });

    await this.recordSearchHistorySafely(
      userId,
      buildStructuredSearchHistoryQuery(input.collection, input.filters ?? {}),
      execution.meta.total,
    );

    return response;
  }

  async search(input: SmartSearchRequestOptions, userId: string): Promise<GlobalSearchApiData> {
    return this.globalSearch(input, userId);
  }
}

export const searchService = new SearchService();
