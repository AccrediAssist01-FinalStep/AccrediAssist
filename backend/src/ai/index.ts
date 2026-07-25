export { aiService, AiService } from './services/ai.service';
export { geminiProvider, GeminiProvider } from './providers/gemini.provider';
export { getAiConfig, isGeminiConfigured } from './utils/ai-config.util';
export {
  getPromptTemplateMetadata,
  listPromptTemplates,
  loadPromptTemplate,
  renderPromptTemplate,
  renderPromptTemplateByName,
} from './utils/prompt-template.util';
export { getPromptTemplatesDirectory } from './utils/prompt-template-config.util';
export type { AiConfig, AiModuleStatus, AiProviderName } from './interfaces/ai-config.interface';
export type { AiProvider } from './interfaces/ai-provider.interface';
export type {
  AiGenerationMeta,
  AiJsonResponse,
  AiTextResponse,
  GenerateJsonOptions,
  GenerateTextOptions,
} from './interfaces/ai-response.interface';
export type {
  GeminiGenerativeClient,
  GeminiGenerateContentParams,
  GeminiGenerateContentResponse,
} from './interfaces/gemini-client.interface';
export type {
  PromptTemplate,
  PromptTemplateMetadata,
  PromptTemplateName,
  PromptTemplateVariables,
} from './interfaces/prompt-template.interface';
