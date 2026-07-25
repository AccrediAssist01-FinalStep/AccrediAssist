import { SmartSearchAgentResponse } from '../interfaces/smart-search.interface';
import {
  SmartSearchApiResponse,
  SmartSearchUnderstanding,
  SmartSearchUnderstandingSource,
} from '../interfaces/smart-search-response.interface';
import { SearchExecutionResult } from '../interfaces/search-execution.interface';
import { SmartSearchCollection } from '../config/search-collections.config';
import { SmartSearchSort } from '../config/search-fields.config';

export const buildSmartSearchUnderstanding = (
  parsed: {
    collection: SmartSearchCollection | '';
    filters: Record<string, unknown>;
    sort: SmartSearchSort;
    confidence: number | null;
  },
  source: SmartSearchUnderstandingSource,
  agentMeta?: Pick<SmartSearchAgentResponse, 'model' | 'provider'>,
): SmartSearchUnderstanding => ({
  collection: parsed.collection,
  filters: parsed.filters,
  sort: parsed.sort,
  confidence: parsed.confidence,
  source,
  ...(agentMeta?.model ? { model: agentMeta.model } : {}),
  ...(agentMeta?.provider ? { provider: agentMeta.provider } : {}),
});

export const buildSmartSearchApiResponse = (params: {
  query?: string;
  understanding: SmartSearchUnderstanding;
  execution: SearchExecutionResult;
}): SmartSearchApiResponse => ({
  query: params.query,
  understanding: params.understanding,
  results: {
    items: params.execution.items,
    meta: params.execution.meta,
  },
});
