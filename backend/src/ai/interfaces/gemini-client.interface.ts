export interface GeminiMediaPart {
  url?: string;
  mimeType: string;
  inlineData?: string;
}

export interface GeminiGenerateContentParams {
  model: string;
  contents: string | unknown;
  config?: {
    systemInstruction?: string;
    temperature?: number;
    responseMimeType?: string;
  };
}

export interface GeminiGenerateContentResponse {
  text?: string;
}

export interface GeminiGenerativeClient {
  models: {
    generateContent: (
      params: GeminiGenerateContentParams,
    ) => Promise<GeminiGenerateContentResponse>;
  };
}
