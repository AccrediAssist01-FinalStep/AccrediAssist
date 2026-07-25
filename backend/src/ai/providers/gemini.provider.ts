import { GoogleGenAI } from '@google/genai';
import { BadRequestError } from '../../utils/errors';
import { AiModuleStatus } from '../interfaces/ai-config.interface';
import { AiProvider } from '../interfaces/ai-provider.interface';
import { getAiConfig, isGeminiConfigured } from '../utils/ai-config.util';

export class GeminiProvider implements AiProvider {
  readonly providerName = 'gemini' as const;

  private client: GoogleGenAI | null = null;
  private initialized = false;

  async initialize(): Promise<AiModuleStatus> {
    if (!this.initialized) {
      const config = getAiConfig();

      if (isGeminiConfigured()) {
        this.client = new GoogleGenAI({ apiKey: config.apiKey });
      }

      this.initialized = true;
    }

    return this.getStatus();
  }

  getStatus(): AiModuleStatus {
    const config = getAiConfig();

    return {
      provider: config.provider,
      configured: this.isConfigured(),
      model: config.model,
      initialized: this.initialized,
    };
  }

  isConfigured(): boolean {
    return isGeminiConfigured() && this.client !== null;
  }

  getModel(): string {
    return getAiConfig().model;
  }

  getClient(): GoogleGenAI | null {
    return this.client;
  }

  private notImplemented(methodName: string): never {
    throw new BadRequestError(`Gemini provider ${methodName} is not implemented yet`);
  }

  async extractInformation(): Promise<never> {
    return this.notImplemented('extractInformation');
  }

  async classifyRecord(): Promise<never> {
    return this.notImplemented('classifyRecord');
  }

  async validateRecord(): Promise<never> {
    return this.notImplemented('validateRecord');
  }

  async detectDuplicate(): Promise<never> {
    return this.notImplemented('detectDuplicate');
  }

  async interpretSearchQuery(): Promise<never> {
    return this.notImplemented('interpretSearchQuery');
  }

  async generateReport(): Promise<never> {
    return this.notImplemented('generateReport');
  }

  async processCommunication(): Promise<never> {
    return this.notImplemented('processCommunication');
  }
}

export const geminiProvider = new GeminiProvider();
