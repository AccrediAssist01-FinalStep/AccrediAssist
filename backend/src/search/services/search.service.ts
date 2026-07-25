import { isGeminiConfigured } from '../../ai/utils/ai-config.util';
import { BadRequestError } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { smartSearchAgent, SmartSearchAgent } from '../agents/smart-search.agent';
import {
  DEFAULT_SMART_SEARCH_COLLECTIONS,
  SmartSearchCollection,
} from '../config/search-collections.config';
import {
  SearchExecuteRequest,
  SearchExecuteResponse,
} from '../interfaces/search-execution.interface';
import {
  SearchModuleStatus,
  SearchRequest,
  SearchResponse,
} from '../interfaces/search.interface';
import { searchRepository, SearchRepository } from '../repositories/search.repository';

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
      geminiConfigured: isGeminiConfigured(),
      geminiModel: providerStatus.model,
      supportedCollections: DEFAULT_SMART_SEARCH_COLLECTIONS,
    };
  }

  getSupportedCollections(): readonly SmartSearchCollection[] {
    return DEFAULT_SMART_SEARCH_COLLECTIONS;
  }

  async executeStructuredSearch(
    input: SearchExecuteRequest,
    userId: string,
  ): Promise<SearchExecuteResponse> {
    if (!input.collection) {
      throw new BadRequestError('Search collection is required');
    }

    logger.info('Structured search requested', {
      userId,
      collection: input.collection,
    });

    const result = await this.repository.execute(input);

    return {
      collection: input.collection,
      filters: input.filters ?? {},
      sort: input.sort || undefined,
      items: result.items,
      meta: result.meta,
    };
  }

  async search(input: SearchRequest, userId: string): Promise<SearchResponse> {
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

    const executed = await this.repository.execute({
      collection: parsed.result.collection,
      filters: parsed.result.filters,
      sort: parsed.result.sort,
      department: input.department,
    });

    return {
      query,
      collection: parsed.result.collection,
      filters: parsed.result.filters,
      sort: parsed.result.sort || undefined,
      confidence: parsed.result.confidence,
      items: executed.items,
      meta: executed.meta,
    };
  }
}

export const searchService = new SearchService();
