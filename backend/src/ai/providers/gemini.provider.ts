import { GoogleGenAI } from '@google/genai';
import { BadRequestError, InternalServerError, ValidationError } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { logPipelineStage, PIPELINE_STAGES } from '../utils/pipeline-stage-logger.util';
import { AiModuleStatus } from '../interfaces/ai-config.interface';
import { AiProvider } from '../interfaces/ai-provider.interface';
import {
  AiJsonResponse,
  AiTextResponse,
  GenerateJsonOptions,
  GenerateTextOptions,
} from '../interfaces/ai-response.interface';
import {
  GeminiGenerateContentParams,
  GeminiGenerativeClient,
} from '../interfaces/gemini-client.interface';
import { getAiConfig, isGeminiConfigured } from '../utils/ai-config.util';

const MAX_ATTEMPTS = 2;

const stripMarkdownJson = (text: string): string => {
  const trimmed = text.trim();
  const fencedMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);

  return fencedMatch ? fencedMatch[1].trim() : trimmed;
};

interface GeminiInvokeOptions {
  prompt: string;
  systemInstruction?: string;
  temperature?: number;
  responseMimeType: 'application/json' | 'text/plain';
}

export class GeminiProvider implements AiProvider {
  readonly providerName = 'gemini' as const;

  private client: GeminiGenerativeClient | null = null;
  private initialized = false;

  constructor(private readonly injectedClient?: GeminiGenerativeClient) {
    if (injectedClient) {
      this.client = injectedClient;
      this.initialized = true;
    }
  }

  async initialize(): Promise<AiModuleStatus> {
    if (!this.initialized) {
      const config = getAiConfig();

      if (isGeminiConfigured()) {
        this.client = new GoogleGenAI({ apiKey: config.apiKey }) as GeminiGenerativeClient;
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
    if (this.injectedClient) {
      return this.client !== null;
    }

    return isGeminiConfigured() && this.client !== null;
  }

  getModel(): string {
    return getAiConfig().model;
  }

  getClient(): GeminiGenerativeClient | null {
    return this.client;
  }

  async generateText(options: GenerateTextOptions): Promise<AiTextResponse> {
    const result = await this.invokeGemini({
      prompt: options.prompt,
      systemInstruction: options.systemInstruction,
      temperature: options.temperature,
      responseMimeType: 'text/plain',
    });

    return {
      type: 'text',
      content: result.text,
      model: result.model,
      provider: 'gemini',
    };
  }

  async generateJSON<T = Record<string, unknown>>(
    options: GenerateJsonOptions,
  ): Promise<AiJsonResponse<T>> {
    const result = await this.invokeGemini({
      prompt: options.prompt,
      systemInstruction: options.systemInstruction,
      temperature: options.temperature,
      responseMimeType: 'application/json',
    });

    let data: T;

    try {
      data = JSON.parse(stripMarkdownJson(result.text)) as T;
    } catch {
      logger.error('Gemini returned invalid JSON', { response: result.text });
      throw new ValidationError('Gemini returned invalid JSON');
    }

    return {
      type: 'json',
      data,
      model: result.model,
      provider: 'gemini',
    };
  }

  private async invokeGemini(options: GeminiInvokeOptions): Promise<{ text: string; model: string }> {
    await this.initialize();
    this.ensureConfigured();

    const config = getAiConfig();
    const requestParams: GeminiGenerateContentParams = {
      model: config.model,
      contents: options.prompt,
      config: {
        systemInstruction: options.systemInstruction,
        temperature: options.temperature,
        responseMimeType: options.responseMimeType,
      },
    };

    let lastError: unknown;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      try {
        logPipelineStage(PIPELINE_STAGES.GEMINI_REQUEST, {
          attempt,
          model: config.model,
          responseMimeType: options.responseMimeType,
          promptLength: options.prompt.length,
        });

        const response = await this.client!.models.generateContent(requestParams);
        const text = response.text?.trim();

        if (!text) {
          throw new InternalServerError('Gemini response did not include text content');
        }

        logPipelineStage(PIPELINE_STAGES.GEMINI_RESPONSE, {
          attempt,
          model: config.model,
          responseLength: text.length,
          responsePreview: text.slice(0, 180),
        });

        return {
          text,
          model: config.model,
        };
      } catch (error) {
        lastError = error;

        logger.error('Gemini API request failed', {
          attempt,
          model: config.model,
          error: error instanceof Error ? error.message : String(error),
        });

        if (attempt < MAX_ATTEMPTS) {
          logger.warn('Retrying Gemini API request', { attempt: attempt + 1 });
        }
      }
    }

    const message =
      lastError instanceof Error ? lastError.message : 'Gemini API request failed after retry';

    throw new InternalServerError(message);
  }

  private ensureConfigured(): void {
    if (!this.isConfigured()) {
      throw new BadRequestError('Gemini is not configured. Set GEMINI_API_KEY in the environment.');
    }
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
