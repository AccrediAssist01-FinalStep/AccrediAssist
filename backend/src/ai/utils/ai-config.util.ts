import { env } from '../../config/env';
import { AiConfig } from '../interfaces/ai-config.interface';

export const getAiConfig = (): AiConfig => ({
  provider: env.AI_PROVIDER,
  apiKey: env.GEMINI_API_KEY,
  model: env.GEMINI_MODEL,
});

export const isGeminiConfigured = (): boolean => Boolean(env.GEMINI_API_KEY);
