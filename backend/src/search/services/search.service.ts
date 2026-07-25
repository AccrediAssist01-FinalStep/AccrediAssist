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

    return {
      queryUnderstanding: true,
      databaseSearch: true,
      integrated: true,
      geminiConfigured: isGeminiConfigured(),
      geminiModel: providerStatus.model,
      supportedCollections: DEFAULT_SMART_SEARCH_COLLECTIONS,
    };
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

    if (!isGeminiConfigured()) {
      throw new BadRequestError('Smart search is unavailable because Gemini is not configured');
    }

    logger.info('Global search requested', { userId, query });

    let parsed;

    try {
      parsed = await this.agent.parseQuery({
        query,
        department: input.department,
        collections: input.collection ? [input.collection] : undefined,
      });
    } catch (error) {
      if (error instanceof ValidationError || error instanceof BadRequestError) {
        throw error;
      }

      if (error instanceof InternalServerError || isGeminiAvailabilityError(error)) {
        throw new BadRequestError('Smart search query understanding is temporarily unavailable');
      }

      throw error;
    }

    const collection = input.collection ?? parsed.result.collection;

    if (!collection) {
      throw new ValidationError('Could not determine a search collection for the query');
    }

    const appliedFilters = mergeSearchFilters(parsed.result.filters, input.filters ?? {});
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

    const response = toGlobalSearchApiData(
      query,
      buildSmartSearchUnderstanding(parsed.result, 'gemini', {
        model: parsed.model,
        provider: parsed.provider,
      }),
      appliedFilters,
      execution,
    );

    await this.historyService.recordSearch(
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

    await this.historyService.recordSearch(
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
