import { isGeminiConfigured } from '../../ai/utils/ai-config.util';
import { BadRequestError } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { smartSearchAgent, SmartSearchAgent } from '../agents/smart-search.agent';
import {
  DEFAULT_SMART_SEARCH_COLLECTIONS,
  SmartSearchCollection,
} from '../config/search-collections.config';
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
  buildSmartSearchApiResponse,
  buildSmartSearchUnderstanding,
} from '../utils/search-response.util';

export class SearchService {
  constructor(
    private readonly agent: SmartSearchAgent = smartSearchAgent,
    private readonly repository: SearchRepository = searchRepository,
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

    return buildSmartSearchApiResponse({
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
  }

  async search(input: SmartSearchRequestOptions, userId: string): Promise<SmartSearchApiResponse> {
    const query = input.query.trim();

    if (!query) {
      throw new BadRequestError('Search query is required');
    }

    logger.info('Smart search requested', { userId, query });

    const parsed = await this.agent.parseQuery({
      query,
      department: input.department,
      collections: input.collection ? [input.collection] : undefined,
    });

    if (!parsed.result.collection) {
      throw new BadRequestError('Could not determine a search collection for the query');
    }

    const execution = await this.repository.execute({
      collection: parsed.result.collection,
      filters: parsed.result.filters,
      sort: parsed.result.sort,
      department: input.department,
      fields: input.fields,
      pagination: {
        page: input.page,
        limit: input.limit,
      },
    });

    return buildSmartSearchApiResponse({
      query,
      understanding: buildSmartSearchUnderstanding(parsed.result, 'gemini', {
        model: parsed.model,
        provider: parsed.provider,
      }),
      execution,
    });
  }
}

export const searchService = new SearchService();
