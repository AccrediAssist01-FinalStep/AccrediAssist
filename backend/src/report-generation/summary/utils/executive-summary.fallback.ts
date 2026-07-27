import { getGenerationReportTypeDefinition } from '../../config/report-types.config';
import type { GenerationReportType } from '../../config/report-types.config';
import type { ReportAggregationResult } from '../../aggregation/interfaces/aggregation.interface';
import type { ValidatedExecutiveSummary } from '../interfaces/executive-summary.interface';

const formatGrowth = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return 'Growth data is not available for the selected period.';
  if (value > 0) return `Records increased by ${value}% compared to the previous equivalent period.`;
  if (value < 0) return `Records decreased by ${Math.abs(value)}% compared to the previous equivalent period.`;
  return 'Record volume remained unchanged compared to the previous equivalent period.';
};

/**
 * Rule-based fallback when Gemini is unavailable or validation fails.
 * Uses only aggregated statistics — no generative inference.
 */
export const buildFallbackExecutiveSummary = (
  reportType: GenerationReportType,
  aggregation: ReportAggregationResult,
  reason: string,
): ValidatedExecutiveSummary => {
  const definition = getGenerationReportTypeDefinition(reportType);
  const overall = aggregation.statistics.overall;
  const period =
    aggregation.metadata.resolvedDateRange.label ??
    'the selected reporting scope';

  const moduleLines = Object.entries(aggregation.statistics.byModule)
    .filter(([, stats]) => stats && stats.totalCount > 0)
    .map(([, stats]) => `${stats!.label}: ${stats!.totalCount} record(s)`);

  const executiveSummary = [
    `This ${definition.label} executive summary was prepared for ${period} based on ${overall.totalRecords} institutional record(s) aggregated from approved AccrediAssist data sources.`,
    moduleLines.length > 0
      ? `Contributing modules include ${moduleLines.join('; ')}.`
      : 'No module-specific records were identified for the applied filters.',
    formatGrowth(overall.growthPercentage),
    `Automated narrative generation was unavailable (${reason}); this summary presents verified statistical findings only.`,
  ].join(' ');

  const strengths: string[] = [];
  const observations: string[] = [];
  const recommendations: string[] = [];
  const keyHighlights: string[] = [];

  if (overall.totalRecords > 0) {
    keyHighlights.push(`${overall.totalRecords} total records included in this report scope.`);
  }

  for (const [, stats] of Object.entries(aggregation.statistics.byModule)) {
    if (!stats || stats.totalCount === 0) continue;
    keyHighlights.push(`${stats.label}: ${stats.totalCount} record(s).`);
    if (stats.growthPercentage !== null && stats.growthPercentage > 0) {
      strengths.push(`${stats.label} shows positive growth of ${stats.growthPercentage}% versus the prior period.`);
    }
    if (stats.departmentWiseCount[0]) {
      observations.push(
        `${stats.label}: highest departmental contribution from ${stats.departmentWiseCount[0].label} (${stats.departmentWiseCount[0].count} records).`,
      );
    }
  }

  aggregation.summary.topDepartments.slice(0, 3).forEach((dept) => {
    observations.push(`Department ${dept.label} contributed ${dept.count} records across modules.`);
  });

  if (overall.totalRecords === 0) {
    recommendations.push(
      'No records match the current filters. Verify department, date range, and academic year selections before finalizing the report.',
    );
  } else {
    recommendations.push(
      'Continue periodic review of aggregated metrics to maintain accreditation readiness and data completeness.',
    );
  }

  if (strengths.length === 0 && overall.totalRecords > 0) {
    strengths.push('Institutional records are consolidated and available for formal reporting.');
  }

  return {
    executiveSummary,
    strengths: strengths.slice(0, 8),
    observations: observations.slice(0, 8),
    recommendations: recommendations.slice(0, 8),
    keyHighlights: keyHighlights.slice(0, 10),
    generatedAt: new Date(),
    source: 'fallback',
  };
};
