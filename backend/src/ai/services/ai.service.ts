import { AiModuleStatus } from '../interfaces/ai-config.interface';
import { AiProvider } from '../interfaces/ai-provider.interface';
import { geminiProvider } from '../providers/gemini.provider';
import { getAiConfig } from '../utils/ai-config.util';
import { BadRequestError } from '../../utils/errors';

export class AiService {
  private provider: AiProvider = geminiProvider;

  async initialize(): Promise<AiModuleStatus> {
    const config = getAiConfig();

    if (config.provider !== 'gemini') {
      throw new BadRequestError(`Unsupported AI provider: ${config.provider}`);
    }

    return this.provider.initialize();
  }

  getProvider(): AiProvider {
    return this.provider;
  }

  getStatus(): AiModuleStatus {
    return geminiProvider.getStatus();
  }
}

export const aiService = new AiService();
