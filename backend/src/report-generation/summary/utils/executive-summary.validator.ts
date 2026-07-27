import {
  executiveSummaryResponseSchema,
  type ExecutiveSummaryResponse,
  type ValidatedExecutiveSummary,
} from '../interfaces/executive-summary.interface';

const sanitizeString = (value: string, maxLength: number): string =>
  value.replace(/\s+/g, ' ').trim().slice(0, maxLength);

const sanitizeList = (items: string[], maxItems: number, maxLength: number): string[] =>
  items
    .map((item) => sanitizeString(item, maxLength))
    .filter(Boolean)
    .slice(0, maxItems);

export const validateExecutiveSummaryResponse = (
  data: unknown,
): ExecutiveSummaryResponse => {
  const parsed = executiveSummaryResponseSchema.parse(data);

  return {
    executiveSummary: sanitizeString(parsed.executiveSummary, 6000),
    strengths: sanitizeList(parsed.strengths, 8, 500),
    observations: sanitizeList(parsed.observations, 8, 500),
    recommendations: sanitizeList(parsed.recommendations, 8, 500),
    keyHighlights: sanitizeList(parsed.keyHighlights, 10, 400),
  };
};

export const toValidatedSummary = (
  response: ExecutiveSummaryResponse,
  source: ValidatedExecutiveSummary['source'],
  model?: string,
): ValidatedExecutiveSummary => ({
  ...response,
  model,
  generatedAt: new Date(),
  source,
});
