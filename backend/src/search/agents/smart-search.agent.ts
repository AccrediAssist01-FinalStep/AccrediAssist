import { GeminiProvider, geminiProvider } from '../../ai/providers/gemini.provider';
import { renderPromptTemplateByName } from '../../ai/utils/prompt-template.util';
import { BadRequestError } from '../../utils/errors';
import {
  DEFAULT_SMART_SEARCH_COLLECTIONS,
  formatCollectionsForPrompt,
} from '../config/search-collections.config';
import {
  SmartSearchAgentResponse,
  SmartSearchQueryInput,
} from '../interfaces/smart-search.interface';

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

  async parseQuery(_input: SmartSearchQueryInput): Promise<SmartSearchAgentResponse> {
    throw new BadRequestError('Smart search query parsing is not implemented yet');
  }
}

export const smartSearchAgent = new SmartSearchAgent();
