import { SmartSearchCollection } from '../config/search-collections.config';
import { SEARCH_COLLECTION_CONFIG } from '../config/search-execution.config';

const formatValue = (value: unknown): string => {
  if (value === undefined || value === null || value === '') {
    return '';
  }

  if (Array.isArray(value)) {
    return value.join(', ');
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return String(value);
};

export const buildSearchSummary = (
  collection: SmartSearchCollection,
  record: Record<string, unknown>,
): string => {
  const config = SEARCH_COLLECTION_CONFIG[collection];
  const parts = config.summaryFields
    .map((field) => formatValue(record[field]))
    .filter(Boolean);

  return parts.join(' · ') || `${collection} record`;
};
