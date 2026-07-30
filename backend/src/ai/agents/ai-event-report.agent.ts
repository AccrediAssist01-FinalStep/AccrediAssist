import { GeminiProvider, geminiProvider } from '../providers/gemini.provider';
import { EventReportSessionMessage } from '../../types/eventReportSession.types';
import { renderPromptTemplateByName } from '../utils/prompt-template.util';
import { normalizeAiEventReportResult } from '../utils/ai-event-report-result.util';
import {
  buildConversationTimeline,
  resolveSessionMediaParts,
} from '../utils/session-media.util';

export interface AiEventReportAgentResponse {
  result: ReturnType<typeof normalizeAiEventReportResult>;
  model: string;
  provider: 'gemini';
}

export class AiEventReportAgent {
  constructor(private readonly provider: GeminiProvider = geminiProvider) {}

  async analyzeSession(
    groupName: string,
    messages: EventReportSessionMessage[],
  ): Promise<AiEventReportAgentResponse> {
    await this.provider.initialize();

    const mediaParts = await resolveSessionMediaParts(messages);
    const renderedPrompt = await renderPromptTemplateByName('ai-event-report', {
      groupName,
      messageCount: String(messages.length),
      conversationTimeline: buildConversationTimeline(messages),
    });

    const response = await this.provider.generateJSON<Record<string, unknown>>({
      prompt: renderedPrompt.userPrompt,
      systemInstruction: renderedPrompt.system,
      temperature: 0.2,
      mediaParts,
    });

    return {
      result: normalizeAiEventReportResult(response.data),
      model: response.model,
      provider: 'gemini',
    };
  }
}

export const aiEventReportAgent = new AiEventReportAgent();
