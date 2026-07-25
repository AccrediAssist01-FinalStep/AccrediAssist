import { AiModuleStatus } from './ai-config.interface';

export interface AiProvider {
  readonly providerName: 'gemini';
  initialize(): Promise<AiModuleStatus>;
  isConfigured(): boolean;
  getModel(): string;
  extractInformation(): Promise<never>;
  classifyRecord(): Promise<never>;
  validateRecord(): Promise<never>;
  detectDuplicate(): Promise<never>;
  interpretSearchQuery(): Promise<never>;
  generateReport(): Promise<never>;
  processCommunication(): Promise<never>;
}
