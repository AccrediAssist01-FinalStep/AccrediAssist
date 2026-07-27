import { logger } from '../../../utils/logger';
import {
  AGGREGATION_MODULE_KEYS,
  AggregationFilters,
  AggregationModuleKey,
  ReportAggregationResult,
} from '../interfaces/aggregation.interface';
import { aggregationRepository, AggregationRepository } from '../repositories/aggregation.repository';
import { normalizeFilters } from '../utils/aggregation-filter.util';
import { resolveDateRange } from '../utils/aggregation-date.util';
import {
  buildSummaryHighlights,
  calculateGrowthPercentage,
  mergeTopBuckets,
  toModuleChartData,
} from '../utils/aggregation-stats.util';

/**
 * Single source of truth for report data aggregation across all institutional modules.
 */
export class AggregationService {
  constructor(private readonly repository: AggregationRepository = aggregationRepository) {}

  resolveModules(filters: AggregationFilters): AggregationModuleKey[] {
    if (filters.modules?.length) {
      return filters.modules;
    }
    return [...AGGREGATION_MODULE_KEYS];
  }

  async aggregate(filters: AggregationFilters = {}): Promise<ReportAggregationResult> {
    const normalized = normalizeFilters(filters);
    const modules = this.resolveModules(normalized);
    const startedAt = Date.now();

    logger.info('Starting report data aggregation', {
      modules,
      filters: normalized,
    });

    const moduleStats = await this.repository.aggregateModules(modules, normalized);
    const queryDurationMs = Date.now() - startedAt;

    const moduleTotals = modules.reduce(
      (acc, key) => {
        acc[key] = moduleStats.find((item) => item.module === key)?.totalCount ?? 0;
        return acc;
      },
      {} as Record<AggregationModuleKey, number>,
    );

    const overallTotal = moduleStats.reduce((sum, item) => sum + item.totalCount, 0);
    const overallPrevious = moduleStats.reduce((sum, item) => sum + item.previousPeriodCount, 0);

    const byModule = moduleStats.reduce<ReportAggregationResult['statistics']['byModule']>(
      (acc, stats) => {
        acc[stats.module] = stats;
        return acc;
      },
      {},
    );

    const chartsByModule = moduleStats.reduce<ReportAggregationResult['charts']['byModule']>(
      (acc, stats) => {
        acc[stats.module] = toModuleChartData(stats);
        return acc;
      },
      {},
    );

    const recordsByModule = moduleStats.reduce<ReportAggregationResult['records']['byModule']>(
      (acc, stats) => {
        if (!stats.latestRecords.length) {
          return acc;
        }
        acc[stats.module] = stats.latestRecords;
        return acc;
      },
      {},
    );

    const result: ReportAggregationResult = {
      metadata: {
        generatedAt: new Date().toISOString(),
        filters: normalized,
        resolvedDateRange: resolveDateRange(normalized),
        modules,
        queryDurationMs,
      },
      statistics: {
        overall: {
          totalRecords: overallTotal,
          moduleTotals,
          growthPercentage: calculateGrowthPercentage(overallTotal, overallPrevious),
        },
        byModule,
      },
      charts: {
        byModule: chartsByModule,
      },
      records: {
        byModule: recordsByModule,
      },
      summary: {
        highlights: buildSummaryHighlights(moduleStats, overallTotal),
        topDepartments: mergeTopBuckets(moduleStats, (stats) => stats.departmentWiseCount),
        topCategories: mergeTopBuckets(moduleStats, (stats) => stats.categoryWiseCount),
        moduleCount: modules.length,
      },
    };

    logger.info('Report data aggregation completed', {
      modules,
      totalRecords: overallTotal,
      queryDurationMs,
    });

    return result;
  }

  async aggregateModule(
    module: AggregationModuleKey,
    filters: AggregationFilters = {},
  ): Promise<ReportAggregationResult> {
    return this.aggregate({ ...filters, modules: [module] });
  }
}

export const aggregationService = new AggregationService();
