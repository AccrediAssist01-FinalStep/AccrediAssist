export { aiService, AiService } from './services/ai.service';
export { aiPipelineService, AiPipelineService } from './services/ai-pipeline.service';
export { geminiProvider, GeminiProvider } from './providers/gemini.provider';
export { extractionAgent, ExtractionAgent } from './agents/extraction.agent';
export { classificationAgent, ClassificationAgent } from './agents/classification.agent';
export { validationAgent, ValidationAgent } from './agents/validation.agent';
export { duplicateDetectionAgent, DuplicateDetectionAgent } from './agents/duplicate-detection.agent';
export { smartSearchAgent, SmartSearchAgent } from '../search/agents/smart-search.agent';
export { duplicateDetectionRepository, DuplicateDetectionRepository } from './repositories/duplicate-detection.repository';
export { getAiConfig, isGeminiConfigured } from './utils/ai-config.util';
export {
  calculateSimilarityScore,
  DEFAULT_DUPLICATE_THRESHOLD,
  getDuplicateThreshold,
  toComparableFields,
} from './utils/duplicate-similarity.util';
export {
  calculatePipelineConfidenceScore,
  getConfidenceThreshold,
  resolvePendingRecordStatus,
} from './utils/pipeline-status.util';
export {
  isRecordCategory,
  mapClassificationToRecordCategory,
} from './utils/category-mapper.util';
export {
  EXTRACTION_RESULT_KEYS,
  extractionResultSchema,
  normalizeExtractionResult,
} from './utils/extraction-result.util';
export {
  CLASSIFICATION_CATEGORIES,
  CLASSIFICATION_RESULT_KEYS,
  classificationResultSchema,
  isClassificationCategory,
  normalizeClassificationResult,
} from './utils/classification-result.util';
export {
  VALIDATION_ERROR_CODES,
  VALIDATION_RESULT_KEYS,
  VALIDATION_STATUSES,
  hasValidationErrorCode,
  normalizeValidationResult,
  validationResultSchema,
} from './utils/validation-result.util';
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
export type {
  ExtractionAgentResponse,
  ExtractionResult,
} from './interfaces/extraction.interface';
export type {
  ClassificationAgentResponse,
  ClassificationCategory,
  ClassificationInput,
  ClassificationResult,
} from './interfaces/classification.interface';
export type {
  ValidationAgentResponse,
  ValidationErrorCode,
  ValidationInput,
  ValidationIssue,
  ValidationResult,
  ValidationStatus,
} from './interfaces/validation.interface';
export type {
  DuplicateCollectionName,
  DuplicateDetectionInput,
  DuplicateDetectionResponse,
  DuplicateDetectionResult,
  DuplicateRecordCandidate,
} from './interfaces/duplicate-detection.interface';
export type {
  AiPipelineResult,
  AiPipelineStageResults,
} from './interfaces/ai-pipeline.interface';
export type {
  SmartSearchQueryInput,
  SmartSearchParsedFilters,
  SmartSearchAgentResponse,
} from '../search/interfaces/smart-search.interface';
export type {
  SearchRequest,
  SearchResponse,
  SearchResultItem,
  SearchModuleStatus,
} from '../search/interfaces/search.interface';
export type { SmartSearchCollection } from '../search/config/search-collections.config';
export {
  SMART_SEARCH_COLLECTIONS,
  DEFAULT_SMART_SEARCH_COLLECTIONS,
  formatCollectionsForPrompt,
} from '../search/config/search-collections.config';
export {
  smartSearchResultSchema,
  normalizeSmartSearchResult,
} from '../search/utils/smart-search-result.util';
export { searchService, SearchService } from '../search/services/search.service';
