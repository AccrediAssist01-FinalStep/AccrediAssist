export type AiProviderName = 'gemini';

export interface AiConfig {
  provider: AiProviderName;
  apiKey?: string;
  model: string;
}

export interface AiModuleStatus {
  provider: AiProviderName;
  configured: boolean;
  model: string;
  initialized: boolean;
}
