import { PipelineStage } from 'mongoose';
import { getModuleConfig, MODULE_MODELS } from '../config/module-aggregation.config';
import type {
  AggregationFilters,
  AggregationModuleKey,
  ModuleAggregationConfig,
  ModuleStatistics,
} from '../interfaces/aggregation.interface';
import { resolveDateRange } from '../utils/aggregation-date.util';
import {
  buildBaseFieldMatch,
  buildDateMatchStage,
  buildPreviousPeriodMatchStage,
  normalizeFilters,
} from '../utils/aggregation-filter.util';
import {
  calculateGrowthPercentage,
  extractFacetCount,
  mapLabelCountBuckets,
  mapMonthlyBuckets,
  mapPerformerBuckets,
  mapYearlyBuckets,
} from '../utils/aggregation-stats.util';

interface ModuleAggregationResult {
  total: Array<{ count: number }>;
  previousTotal: Array<{ count: number }>;
  monthly: Array<{ _id: { year: number; month: number }; count: number }>;
  yearly: Array<{ _id: number; count: number }>;
  byDepartment: Array<{ _id: string | null; count: number }>;
  byCategory: Array<{ _id: string | null; count: number }>;
  topPerformers: Array<{ _id: string | null; count: number }>;
  latest: Record<string, unknown>[];
}

export class AggregationRepository {
  async aggregateModule(
    config: ModuleAggregationConfig,
    rawFilters: AggregationFilters,
  ): Promise<ModuleStatistics> {
    const filters = normalizeFilters(rawFilters);
    const dateRange = resolveDateRange(filters);
    const model = MODULE_MODELS[config.key];
    const pipeline = this.buildModulePipeline(config, filters, dateRange);

    const [result] = await model.aggregate<ModuleAggregationResult>(pipeline);

    const totalCount = extractFacetCount(result?.total ?? []);
    const previousPeriodCount = extractFacetCount(result?.previousTotal ?? []);

    return {
      module: config.key,
      label: config.label,
      totalCount,
      monthlyCount: mapMonthlyBuckets(result?.monthly ?? []),
      yearlyCount: mapYearlyBuckets(result?.yearly ?? []),
      departmentWiseCount: config.departmentField
        ? mapLabelCountBuckets(result?.byDepartment ?? [])
        : [],
      categoryWiseCount: config.categoryField
        ? mapLabelCountBuckets(result?.byCategory ?? [])
        : [],
      topPerformers: config.performerField && !config.statsOnly
        ? mapPerformerBuckets(result?.topPerformers ?? [])
        : [],
      latestRecords: config.statsOnly ? [] : (result?.latest ?? []),
      previousPeriodCount,
      growthPercentage: calculateGrowthPercentage(totalCount, previousPeriodCount),
    };
  }

  private withCurrentDateMatch(
    dateMatch: Record<string, unknown> | null,
    stages: PipelineStage[],
  ): PipelineStage[] {
    return dateMatch ? [{ $match: dateMatch }, ...stages] : stages;
  }

  private buildModulePipeline(
    config: ModuleAggregationConfig,
    filters: AggregationFilters,
    dateRange: ReturnType<typeof resolveDateRange>,
  ): PipelineStage[] {
    const baseMatch = buildBaseFieldMatch(config, filters);
    const dateMatch = buildDateMatchStage(dateRange);
    const previousMatch = buildPreviousPeriodMatchStage(dateRange);

    return [
      { $match: baseMatch },
      {
        $addFields: {
          normalizedDate: { $ifNull: [`$${config.dateField}`, '$createdAt'] },
        },
      },
      {
        $facet: {
          total: this.withCurrentDateMatch(dateMatch, [{ $count: 'count' }]),
          previousTotal: previousMatch
            ? [{ $match: previousMatch }, { $count: 'count' }]
            : [{ $match: { _id: null } }, { $count: 'count' }],
          monthly: this.withCurrentDateMatch(dateMatch, [
            {
              $group: {
                _id: {
                  year: { $year: '$normalizedDate' },
                  month: { $month: '$normalizedDate' },
                },
                count: { $sum: 1 },
              },
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
          ]),
          yearly: this.withCurrentDateMatch(dateMatch, [
            {
              $group: {
                _id: { $year: '$normalizedDate' },
                count: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
          ]),
          byDepartment: config.departmentField
            ? this.withCurrentDateMatch(dateMatch, [
                { $group: { _id: `$${config.departmentField}`, count: { $sum: 1 } } },
                { $sort: { count: -1 } },
              ])
            : [{ $match: { _id: null } }],
          byCategory: config.categoryField
            ? this.withCurrentDateMatch(dateMatch, [
                { $group: { _id: `$${config.categoryField}`, count: { $sum: 1 } } },
                { $sort: { count: -1 } },
              ])
            : [{ $match: { _id: null } }],
          topPerformers:
            config.performerField && !config.statsOnly
              ? this.withCurrentDateMatch(dateMatch, [
                  { $group: { _id: `$${config.performerField}`, count: { $sum: 1 } } },
                  { $sort: { count: -1 } },
                  { $limit: config.topLimit },
                ])
              : [{ $match: { _id: null } }],
          latest: config.statsOnly
            ? [{ $match: { _id: null } }]
            : this.withCurrentDateMatch(dateMatch, [
                { $sort: { normalizedDate: -1, createdAt: -1 } },
                ...(filters.recordLimit && filters.recordLimit > 0
                  ? [{ $limit: filters.recordLimit }]
                  : config.latestLimit > 0
                    ? [{ $limit: config.latestLimit }]
                    : []),
                { $project: { ...config.latestFields } },
              ]),
        },
      } as PipelineStage,
    ];
  }

  async aggregateModules(
    moduleKeys: AggregationModuleKey[],
    filters: AggregationFilters,
  ): Promise<ModuleStatistics[]> {
    return Promise.all(
      moduleKeys.map((key) => this.aggregateModule(getModuleConfig(key), filters)),
    );
  }
}

export const aggregationRepository = new AggregationRepository();
