export interface AiGenerationMeta {
  model: string;
  provider: 'gemini';
}

export interface AiTextResponse extends AiGenerationMeta {
  type: 'text';
  content: string;
}

export interface AiJsonResponse<T = Record<string, unknown>> extends AiGenerationMeta {
  type: 'json';
  data: T;
}

export interface GenerateTextOptions {
  prompt: string;
  systemInstruction?: string;
  temperature?: number;
}

export interface GenerateJsonOptions {
  prompt: string;
  systemInstruction?: string;
  temperature?: number;
}
