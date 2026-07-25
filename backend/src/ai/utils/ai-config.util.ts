import { env } from '../../config/env';
import { AiConfig, AiProviderName } from '../interfaces/ai-config.interface';

export const getAiConfig = (): AiConfig => ({
  provider: (process.env.AI_PROVIDER as AiProviderName | undefined) ?? env.AI_PROVIDER,
  apiKey: process.env.GEMINI_API_KEY ?? env.GEMINI_API_KEY,
  model: process.env.GEMINI_MODEL ?? env.GEMINI_MODEL,
});

export const isGeminiConfigured = (): boolean => {
  const apiKey = getAiConfig().apiKey;
  return Boolean(apiKey?.trim());
};
