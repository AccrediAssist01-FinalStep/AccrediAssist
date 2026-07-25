import { isGeminiConfigured } from '../../ai/utils/ai-config.util';
import { BadRequestError } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { buildPaginationMeta } from '../../database/utils/queryHelpers';
import { smartSearchAgent, SmartSearchAgent } from '../agents/smart-search.agent';
import {
  DEFAULT_SMART_SEARCH_COLLECTIONS,
  SmartSearchCollection,
} from '../config/search-collections.config';
import {
  SearchModuleStatus,
  SearchRequest,
  SearchResponse,
} from '../interfaces/search.interface';

export class SearchService {
  constructor(private readonly agent: SmartSearchAgent = smartSearchAgent) {}

  getModuleStatus(): SearchModuleStatus {
    const providerStatus = this.agent.getProvider().getStatus();

    return {
      queryUnderstanding: true,
      databaseSearch: false,
      geminiConfigured: isGeminiConfigured(),
      geminiModel: providerStatus.model,
      supportedCollections: DEFAULT_SMART_SEARCH_COLLECTIONS,
    };
  }

  getSupportedCollections(): readonly SmartSearchCollection[] {
    return DEFAULT_SMART_SEARCH_COLLECTIONS;
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

    return {
      query,
      collection: parsed.result.collection || undefined,
      filters: parsed.result.filters,
      sort: parsed.result.sort || undefined,
      confidence: parsed.result.confidence,
      items: [],
      meta: buildPaginationMeta(0, { page: 1, limit: 20 }),
    };
  }
}

export const searchService = new SearchService();
