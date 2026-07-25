import { WhatsAppIncomingMessage } from '../../whatsapp/types';
import { ExtractionAgentResponse } from '../interfaces/extraction.interface';
import { GeminiProvider, geminiProvider } from '../providers/gemini.provider';
import { normalizeExtractionResult } from '../utils/extraction-result.util';
import { renderPromptTemplateByName } from '../utils/prompt-template.util';

const buildMediaMetadataSummary = (message: WhatsAppIncomingMessage): string => {
  if (!message.mediaMetadata) {
    return 'none';
  }

  return JSON.stringify({
    mediaType: message.mediaMetadata.mediaType,
    fileName: message.mediaMetadata.fileName,
    mimeType: message.mediaMetadata.mimeType,
    secureUrl: message.mediaMetadata.secureUrl ?? null,
  });
};

const mergeMediaReferences = (
  extracted: string[] | null,
  message: WhatsAppIncomingMessage,
): string[] | null => {
  const references = new Set<string>();

  for (const value of extracted ?? []) {
    references.add(value);
  }

  if (message.media) {
    references.add(message.media);
  }

  if (message.mediaMetadata?.secureUrl) {
    references.add(message.mediaMetadata.secureUrl);
  }

  return references.size > 0 ? [...references] : null;
};

export class ExtractionAgent {
  constructor(private readonly provider: GeminiProvider = geminiProvider) {}

  async extract(message: WhatsAppIncomingMessage): Promise<ExtractionAgentResponse> {
    const renderedPrompt = await renderPromptTemplateByName('extraction', {
      groupName: message.groupName,
      senderName: message.sender,
      timestamp: message.timestamp.toISOString(),
      message: message.message,
      media: message.media ?? 'none',
      mediaMetadata: buildMediaMetadataSummary(message),
    });

    const response = await this.provider.generateJSON<Record<string, unknown>>({
      prompt: renderedPrompt.userPrompt,
      systemInstruction: renderedPrompt.system,
      temperature: 0.1,
    });

    const normalized = normalizeExtractionResult(response.data);

    return {
      result: {
        ...normalized,
        mediaReferences: mergeMediaReferences(normalized.mediaReferences, message),
      },
      model: response.model,
      provider: 'gemini',
    };
  }
}

export const extractionAgent = new ExtractionAgent();
