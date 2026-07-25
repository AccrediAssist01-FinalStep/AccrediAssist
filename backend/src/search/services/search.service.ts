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
  SearchRequest,
  SearchResponse,
} from '../interfaces/search.interface';

export class SearchService {
  constructor(private readonly agent: SmartSearchAgent = smartSearchAgent) {}

  getModuleStatus(): SearchModuleStatus {
    const providerStatus = this.agent.getProvider().getStatus();

    return {
      implemented: false,
      geminiConfigured: isGeminiConfigured(),
      geminiModel: providerStatus.model,
      supportedCollections: DEFAULT_SMART_SEARCH_COLLECTIONS,
    };
  }

  getSupportedCollections(): readonly SmartSearchCollection[] {
    return DEFAULT_SMART_SEARCH_COLLECTIONS;
  }

  async search(_input: SearchRequest, userId: string): Promise<SearchResponse> {
    logger.info('Smart search requested', { userId });

    throw new BadRequestError('Smart search is not implemented yet');
  }
}

export const searchService = new SearchService();
