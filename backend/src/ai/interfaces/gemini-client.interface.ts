export interface GeminiGenerateContentParams {
  model: string;
  contents: string;
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
