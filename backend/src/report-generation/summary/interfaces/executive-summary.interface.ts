import { z } from 'zod';

/** Raw JSON shape expected from Gemini — validated before exposure */
export const executiveSummaryResponseSchema = z.object({
  executiveSummary: z.string().trim().min(1).max(6000),
  strengths: z.array(z.string().trim().min(1).max(500)).min(0).max(8),
  observations: z.array(z.string().trim().min(1).max(500)).min(0).max(8),
  recommendations: z.array(z.string().trim().min(1).max(500)).min(0).max(8),
  keyHighlights: z.array(z.string().trim().min(1).max(400)).min(0).max(10),
});

export type ExecutiveSummaryResponse = z.infer<typeof executiveSummaryResponseSchema>;

export type ExecutiveSummarySource = 'gemini' | 'fallback';

/** Validated executive summary returned to callers — never includes raw Gemini output */
export interface ValidatedExecutiveSummary extends ExecutiveSummaryResponse {
  model?: string;
  generatedAt: Date;
  source: ExecutiveSummarySource;
}

export interface ExecutiveSummaryGenerationResult {
  summary: ValidatedExecutiveSummary;
  /** Internal flag — not exposed via API */
  usedFallback: boolean;
}
