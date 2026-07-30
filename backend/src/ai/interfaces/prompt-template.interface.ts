export type PromptTemplateName =
  | 'extraction'
  | 'classification'
  | 'validation'
  | 'report-summary'
  | 'smart-search'
  | 'pdf-document'
  | 'news-detection'
  | 'ai-event-report';

export interface PromptTemplateMetadata {
  id: string;
  name: PromptTemplateName;
  version: string;
  lastUpdated: string;
  userTemplateFile?: string;
}

export interface PromptTemplate {
  id: string;
  name: PromptTemplateName;
  version: string;
  lastUpdated: string;
  system: string;
  userTemplate?: string;
}

export type PromptTemplateVariables = Record<string, string>;
