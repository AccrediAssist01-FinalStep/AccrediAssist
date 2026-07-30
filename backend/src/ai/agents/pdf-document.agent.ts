import { WhatsAppIncomingMessage } from '../../whatsapp/types';
import { PdfDocumentAgentResponse } from '../interfaces/pdf-document.interface';
import { GeminiProvider, geminiProvider } from '../providers/gemini.provider';
import { resolveGeminiMediaParts } from '../utils/gemini-media.util';
import { isPdfMessage } from '../utils/media-detection.util';
import { normalizePdfDocumentResult } from '../utils/pdf-document-result.util';
import { renderPromptTemplateByName } from '../utils/prompt-template.util';

export class PdfDocumentAgent {
  constructor(private readonly provider: GeminiProvider = geminiProvider) {}

  async extract(message: WhatsAppIncomingMessage): Promise<PdfDocumentAgentResponse | null> {
    if (!isPdfMessage(message)) {
      return null;
    }

    const mediaParts = await resolveGeminiMediaParts(message);
    if (mediaParts.length === 0) {
      return null;
    }

    const renderedPrompt = await renderPromptTemplateByName('pdf-document', {
      groupName: message.groupName,
      senderName: message.sender,
      message: message.message || 'none',
      media: message.media ?? message.mediaMetadata?.secureUrl ?? 'attached',
    });

    const response = await this.provider.generateJSON<Record<string, unknown>>({
      prompt: renderedPrompt.userPrompt,
      systemInstruction: renderedPrompt.system,
      temperature: 0.1,
      mediaParts,
    });

    return {
      result: normalizePdfDocumentResult(response.data),
      model: response.model,
      provider: 'gemini',
    };
  }
}

export const pdfDocumentAgent = new PdfDocumentAgent();
