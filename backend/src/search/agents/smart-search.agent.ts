import { GeminiProvider, geminiProvider } from '../../ai/providers/gemini.provider';
import { renderPromptTemplateByName } from '../../ai/utils/prompt-template.util';
import { BadRequestError, ValidationError } from '../../utils/errors';
import {
  DEFAULT_SMART_SEARCH_COLLECTIONS,
  formatCollectionsForPrompt,
} from '../config/search-collections.config';
import {
  SmartSearchAgentResponse,
  SmartSearchQueryInput,
} from '../interfaces/smart-search.interface';
import { normalizeSmartSearchResult } from '../utils/smart-search-result.util';

export class SmartSearchAgent {
  constructor(private readonly provider: GeminiProvider = geminiProvider) {}

  getProvider(): GeminiProvider {
    return this.provider;
  }

  async buildPrompt(input: SmartSearchQueryInput): Promise<{
    system: string;
    userPrompt: string;
  }> {
    const collections = input.collections ?? DEFAULT_SMART_SEARCH_COLLECTIONS;

    return renderPromptTemplateByName('smart-search', {
      query: input.query,
      department: input.department ?? 'all',
      collections: formatCollectionsForPrompt(collections),
    });
  }

  async parseQuery(input: SmartSearchQueryInput): Promise<SmartSearchAgentResponse> {
    const query = input.query.trim();

    if (!query) {
      throw new BadRequestError('Search query is required');
    }

    if (!this.provider.isConfigured()) {
      throw new BadRequestError('Gemini is not configured for smart search');
    }

    const renderedPrompt = await this.buildPrompt(input);

    const response = await this.provider.generateJSON<Record<string, unknown>>({
      prompt: renderedPrompt.userPrompt,
      systemInstruction: renderedPrompt.system,
      temperature: 0.1,
    });

    const normalized = normalizeSmartSearchResult(response.data);

    if (!normalized.collection && Object.keys(normalized.filters).length === 0) {
      throw new ValidationError('Gemini could not interpret the search query');
    }

    return {
      result: normalized,
      model: response.model,
      provider: 'gemini',
    };
  }
}

export const smartSearchAgent = new SmartSearchAgent();
