import { geminiProvider } from '../../../ai/providers/gemini.provider';
import type { AiProvider } from '../../../ai/interfaces/ai-provider.interface';
import { isGeminiConfigured } from '../../../ai';
import { logger } from '../../../utils/logger';
import type { GenerationReportType } from '../../config/report-types.config';
import type { ReportAggregationResult } from '../../aggregation/interfaces/aggregation.interface';
import type {
  ExecutiveSummaryGenerationResult,
  ValidatedExecutiveSummary,
} from '../interfaces/executive-summary.interface';
import { buildFallbackExecutiveSummary } from '../utils/executive-summary.fallback';
import { buildExecutiveSummaryPrompt } from '../utils/summary-prompt.util';
import {
  toValidatedSummary,
  validateExecutiveSummaryResponse,
} from '../utils/executive-summary.validator';

/** Temperature 0 for deterministic, reproducible summaries */
const SUMMARY_TEMPERATURE = 0;

export class ExecutiveSummaryService {
  constructor(private readonly provider: AiProvider = geminiProvider) {}

  isAvailable(): boolean {
    return isGeminiConfigured();
  }

  async generate(
    reportType: GenerationReportType,
    aggregation: ReportAggregationResult,
  ): Promise<ExecutiveSummaryGenerationResult> {
    if (!this.isAvailable()) {
      logger.warn('Executive summary falling back — Gemini not configured', { reportType });
      return {
        summary: buildFallbackExecutiveSummary(reportType, aggregation, 'Gemini not configured'),
        usedFallback: true,
      };
    }

    try {
      const { systemInstruction, prompt } = await buildExecutiveSummaryPrompt(
        reportType,
        aggregation,
      );

      await this.provider.initialize();

      const response = await this.provider.generateJSON<Record<string, unknown>>({
        prompt,
        systemInstruction,
        temperature: SUMMARY_TEMPERATURE,
      });

      const validated = validateExecutiveSummaryResponse(response.data);

      const summary: ValidatedExecutiveSummary = toValidatedSummary(
        validated,
        'gemini',
        response.model,
      );

      logger.info('Executive summary generated via Gemini', {
        reportType,
        model: response.model,
      });

      return { summary, usedFallback: false };
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'AI generation failed';
      logger.error('Executive summary generation failed — using fallback', {
        reportType,
        reason,
      });

      return {
        summary: buildFallbackExecutiveSummary(reportType, aggregation, reason),
        usedFallback: true,
      };
    }
  }
}

export const executiveSummaryService = new ExecutiveSummaryService();
