import { WhatsAppIncomingMessage } from '../../whatsapp/types';
import { NewsDetectionAgentResponse } from '../interfaces/news-detection.interface';
import { GeminiProvider, geminiProvider } from '../providers/gemini.provider';
import { resolveGeminiMediaParts } from '../utils/gemini-media.util';
import { normalizeNewsDetectionResult } from '../utils/news-detection-result.util';
import { renderPromptTemplateByName } from '../utils/prompt-template.util';

export class NewsDetectionAgent {
  constructor(private readonly provider: GeminiProvider = geminiProvider) {}

  async analyze(message: WhatsAppIncomingMessage): Promise<NewsDetectionAgentResponse | null> {
    const mediaParts = await resolveGeminiMediaParts(message);
    if (mediaParts.length === 0) {
      return null;
    }

    const renderedPrompt = await renderPromptTemplateByName('news-detection', {
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
      result: normalizeNewsDetectionResult(response.data),
      model: response.model,
      provider: 'gemini',
    };
  }
}

export const newsDetectionAgent = new NewsDetectionAgent();
