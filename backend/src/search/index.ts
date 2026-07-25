export type {
  SearchExecuteRequest,
  SearchExecuteResponse,
  SearchExecutionResult,
} from './interfaces/search-execution.interface';
export {
  SEARCH_COLLECTION_CONFIG,
  FULL_TEXT_FILTER_KEYS,
} from './config/search-execution.config';
export { buildSearchMongoFilter, buildFullTextFilter, buildRegexFullTextFilter } from './utils/search-filter.util';
export { buildSearchSortSpec } from './utils/search-sort.util';
export { buildSearchProjection } from './utils/search-projection.util';
export { buildSearchSummary } from './utils/search-summary.util';
export { searchService, SearchService } from './services/search.service';
export { searchRepository, SearchRepository } from './repositories/search.repository';
export { smartSearchAgent, SmartSearchAgent } from './agents/smart-search.agent';
export {
  SMART_SEARCH_COLLECTIONS,
  DEFAULT_SMART_SEARCH_COLLECTIONS,
  formatCollectionsForPrompt,
} from './config/search-collections.config';
export type { SmartSearchCollection } from './config/search-collections.config';
export {
  SMART_SEARCH_SORT_VALUES,
  SMART_SEARCH_COLLECTION_FIELDS,
  SMART_SEARCH_COLLECTION_ALIASES,
} from './config/search-fields.config';
export type { SmartSearchSort } from './config/search-fields.config';
export {
  smartSearchResultSchema,
  normalizeSmartSearchResult,
  normalizeSmartSearchCollection,
  normalizeSmartSearchSort,
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
