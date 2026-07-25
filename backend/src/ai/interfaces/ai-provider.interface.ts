import { AiModuleStatus } from './ai-config.interface';
import {
  AiJsonResponse,
  AiTextResponse,
  GenerateJsonOptions,
  GenerateTextOptions,
} from './ai-response.interface';

export interface AiProvider {
  readonly providerName: 'gemini';
  initialize(): Promise<AiModuleStatus>;
  isConfigured(): boolean;
  getModel(): string;
  generateText(options: GenerateTextOptions): Promise<AiTextResponse>;
  generateJSON<T = Record<string, unknown>>(
    options: GenerateJsonOptions,
  ): Promise<AiJsonResponse<T>>;
  extractInformation(): Promise<never>;
  classifyRecord(): Promise<never>;
  validateRecord(): Promise<never>;
  detectDuplicate(): Promise<never>;
  interpretSearchQuery(): Promise<never>;
  generateReport(): Promise<never>;
  processCommunication(): Promise<never>;
}
