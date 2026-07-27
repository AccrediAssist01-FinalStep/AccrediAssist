import { isGeminiConfigured } from '../../ai';
import { logger } from '../../utils/logger';
import { ReportPipelineContext, ReportAiSummary } from '../interfaces/report-data.interface';

/**
 * Generates AI executive summaries via Gemini.
 * Implementation deferred — returns placeholder structure only.
 */
export class AiSummaryService {
  isAvailable(): boolean {
    return isGeminiConfigured();
  }

  async summarize(context: ReportPipelineContext): Promise<ReportAiSummary> {
    logger.info('AI summary generation planned (not yet implemented)', {
      reportType: context.reportType,
      geminiConfigured: this.isAvailable(),
    });

    const placeholder: ReportAiSummary = {
      executiveSummary: '',
      keyHighlights: [],
      recommendations: [],
      generatedAt: new Date(),
    };

    return placeholder;
  }

  async summarizeForContext(context: ReportPipelineContext): Promise<ReportPipelineContext> {
    const aiSummary = await this.summarize(context);
    return { ...context, aiSummary };
  }
}

export const aiSummaryService = new AiSummaryService();
