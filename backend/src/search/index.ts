export { searchService, SearchService } from './services/search.service';
export { smartSearchAgent, SmartSearchAgent } from './agents/smart-search.agent';
export {
  SMART_SEARCH_COLLECTIONS,
  DEFAULT_SMART_SEARCH_COLLECTIONS,
  formatCollectionsForPrompt,
} from './config/search-collections.config';
export type { SmartSearchCollection } from './config/search-collections.config';
export {
  smartSearchResultSchema,
  normalizeSmartSearchResult,
} from './utils/smart-search-result.util';
export type {
  SmartSearchQueryInput,
  SmartSearchParsedFilters,
  SmartSearchAgentResponse,
} from './interfaces/smart-search.interface';
export type {
  SearchRequest,
  SearchResponse,
  SearchResultItem,
  SearchModuleStatus,
} from './interfaces/search.interface';
