import { SmartSearchCollection } from '../config/search-collections.config';
import { SEARCH_COLLECTION_CONFIG } from '../config/search-execution.config';
import { SmartSearchSort } from '../config/search-fields.config';

export type SearchSortSpec = Record<string, 1 | -1 | { $meta: 'textScore' }>;

export const buildSearchSortSpec = (
  collection: SmartSearchCollection,
  sort: SmartSearchSort = '',
  useTextScore = false,
): SearchSortSpec => {
  const config = SEARCH_COLLECTION_CONFIG[collection];
  const sortSpec: SearchSortSpec = {};

  if (useTextScore) {
    sortSpec.score = { $meta: 'textScore' };
  }

  const primaryField = config.dateField;
  sortSpec[primaryField] = sort === 'oldest' ? 1 : -1;
  sortSpec[config.defaultSortField] = sort === 'oldest' ? 1 : -1;

  return sortSpec;
};
