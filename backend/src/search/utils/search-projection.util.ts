import { SmartSearchCollection } from '../config/search-collections.config';
import { SEARCH_COLLECTION_CONFIG } from '../config/search-execution.config';

export const buildSearchProjection = (
  collection: SmartSearchCollection,
  fields?: string[],
): Record<string, 1> => {
  const config = SEARCH_COLLECTION_CONFIG[collection];
  const selectedFields = fields?.length ? fields : [...config.defaultProjection];
  const projection: Record<string, 1> = { _id: 1 };

  for (const field of selectedFields) {
    projection[field] = 1;
  }

  return projection;
};
