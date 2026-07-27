/**
 * Charts & Analytics Engine tests.
 *
 * Run: npm run test:charts-analytics
 */

import dotenv from 'dotenv';
import { connectDatabase, disconnectDatabase } from '../database/connection';
import { CompletedEventReport } from '../models/CompletedEventReport';
import { FacultyAchievement } from '../models/FacultyAchievement';
import { Internship } from '../models/Internship';
import { Patent } from '../models/Patent';
import { PendingRecord } from '../models/PendingRecord';
import { Placement } from '../models/Placement';
import { Publication } from '../models/Publication';
import { StudentAchievement } from '../models/StudentAchievement';
import { GENERATION_REPORT_TYPES } from '../report-generation/config/report-types.config';
import { aggregationService } from '../report-generation/aggregation/services/aggregation.service';
import { dataCollectionService } from '../report-generation/services/data-collection.service';
import { chartPreparationService } from '../report-generation/services/chart-preparation.service';
import {
  CHART_DEFINITION_IDS,
  chartService,
  clearChartCache,
} from '../report-generation/charts';
import {
  toDocxExport,
  toFrontendExport,
  toPdfExport,
} from '../report-generation/charts/utils/chart-export.util';
import { getChartIdsForReportType } from '../report-generation/charts/config/report-chart.config';

dotenv.config();

const TEST_PREFIX = 'chart-analytics-test-';

const assert = (condition: boolean, message: string): void => {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
  console.log(`PASS: ${message}`);
};

const assertChartShape = (chart: {
  chartType: string;
  labels: string[];
  datasets: Array<{ label: string; data: number[] }>;
  metadata: { id: string; title: string; exportFormats: string[] };
}): void => {
  assert(typeof chart.chartType === 'string' && chart.chartType.length > 0, 'chartType is set');
  assert(Array.isArray(chart.labels), 'labels is array');
  assert(Array.isArray(chart.datasets) && chart.datasets.length > 0, 'datasets is non-empty array');
  assert(chart.datasets.every((d) => d.data.length === chart.labels.length), 'dataset length matches labels');
  assert(chart.metadata.exportFormats.includes('pdf'), 'export supports pdf');
  assert(chart.metadata.exportFormats.includes('docx'), 'export supports docx');
  assert(chart.metadata.exportFormats.includes('frontend'), 'export supports frontend');
};

const seedSampleData = async (): Promise<void> => {
  await Promise.all([
    StudentAchievement.deleteMany({ studentName: { $regex: TEST_PREFIX } }),
    FacultyAchievement.deleteMany({ facultyName: { $regex: TEST_PREFIX } }),
    Placement.deleteMany({ studentName: { $regex: TEST_PREFIX } }),
    Internship.deleteMany({ studentName: { $regex: TEST_PREFIX } }),
    Publication.deleteMany({ facultyName: { $regex: TEST_PREFIX } }),
    Patent.deleteMany({ patentTitle: { $regex: TEST_PREFIX } }),
    CompletedEventReport.deleteMany({ eventTitle: { $regex: TEST_PREFIX } }),
    PendingRecord.deleteMany({ originalMessage: { $regex: TEST_PREFIX } }),
  ]);

  await StudentAchievement.create([
    {
      studentName: `${TEST_PREFIX}Rahul`,
      department: 'Computer Engineering',
      achievementType: 'Technical',
      title: 'Hackathon Winner',
      date: new Date('2025-08-15'),
    },
    {
      studentName: `${TEST_PREFIX}Priya`,
      department: 'Computer Engineering',
      achievementType: 'Sports',
      title: 'State Athlete',
      date: new Date('2025-11-20'),
    },
  ]);

  await FacultyAchievement.create({
    facultyName: `${TEST_PREFIX}Dr. Sharma`,
    achievementType: 'Research',
    title: 'Best Paper Award',
    date: new Date('2025-07-01'),
  });

  await Placement.create([
    {
      studentName: `${TEST_PREFIX}Rahul`,
      department: 'Computer Engineering',
      company: 'TCS',
      role: 'Software Engineer',
      joiningDate: new Date('2025-06-01'),
    },
    {
      studentName: `${TEST_PREFIX}Amit`,
      department: 'Mechanical Engineering',
      company: 'L&T',
      role: 'Trainee',
      joiningDate: new Date('2025-06-15'),
    },
  ]);

  await Internship.create({
    studentName: `${TEST_PREFIX}Priya`,
    company: 'Infosys',
    role: 'Intern',
    startDate: new Date('2025-05-01'),
    endDate: new Date('2025-07-31'),
  });

  await Publication.create({
    facultyName: `${TEST_PREFIX}Dr. Sharma`,
    paperTitle: `${TEST_PREFIX} ML Paper`,
    journal: 'IEEE Access',
    publicationDate: new Date('2025-03-01'),
  });

  await Patent.create({
    patentTitle: `${TEST_PREFIX} Smart Campus`,
    inventors: [`${TEST_PREFIX}Dr. Sharma`],
    status: 'Filed',
    filingDate: new Date('2025-01-15'),
  });

  await CompletedEventReport.create({
    eventTitle: `${TEST_PREFIX} Workshop`,
    eventType: 'Workshop',
    date: new Date('2025-02-10'),
    coordinator: `${TEST_PREFIX}Dr. Sharma`,
    participants: 80,
  });

  await PendingRecord.create([
    {
      originalMessage: `${TEST_PREFIX} pending placement`,
      category: 'Placement',
      status: 'Pending',
      confidenceScore: 85,
    },
    {
      originalMessage: `${TEST_PREFIX} pending internship`,
      category: 'Internship',
      status: 'Needs Review',
      confidenceScore: 72,
    },
  ]);
};

const cleanupSampleData = async (): Promise<void> => {
  await Promise.all([
    StudentAchievement.deleteMany({ studentName: { $regex: TEST_PREFIX } }),
    FacultyAchievement.deleteMany({ facultyName: { $regex: TEST_PREFIX } }),
    Placement.deleteMany({ studentName: { $regex: TEST_PREFIX } }),
    Internship.deleteMany({ studentName: { $regex: TEST_PREFIX } }),
    Publication.deleteMany({ facultyName: { $regex: TEST_PREFIX } }),
    Patent.deleteMany({ patentTitle: { $regex: TEST_PREFIX } }),
    CompletedEventReport.deleteMany({ eventTitle: { $regex: TEST_PREFIX } }),
    PendingRecord.deleteMany({ originalMessage: { $regex: TEST_PREFIX } }),
  ]);
};

const runTests = async (): Promise<void> => {
  console.log('Running Charts & Analytics Engine tests...\n');
  clearChartCache();

  await connectDatabase();
  await seedSampleData();

  const fullAggregation = await aggregationService.aggregate({});
  assert(fullAggregation.statistics.overall.totalRecords >= 10, 'Seeded aggregation data available');

  const allCharts = chartService.generateAll(fullAggregation);
  assert(allCharts.charts.length >= 8, `Generates institutional charts (${allCharts.charts.length})`);

  for (const chartId of CHART_DEFINITION_IDS) {
    const chart = allCharts.charts.find((item) => item.metadata.id === chartId);
    if (chart) {
      assertChartShape(chart);
      console.log(`PASS: Chart definition "${chartId}" produces valid output (${chart.chartType})`);
    }
  }

  const cached = chartService.generateAll(fullAggregation);
  assert(cached.fromCache, 'Chart cache returns cached result on second call');

  const deptFiltered = await aggregationService.aggregate({
    department: 'Computer Engineering',
    modules: ['placements', 'studentAchievements'],
  });
  const filteredCharts = chartService.generateAll(deptFiltered, false);
  const placementChart = filteredCharts.charts.find((c) => c.metadata.id === 'monthly-placements');
  assert(!!placementChart, 'Department filter produces placement chart');
  if (placementChart) {
    assert(
      (placementChart.metadata.totalRecords ?? 0) <= fullAggregation.statistics.byModule.placements?.totalCount!,
      'Filtered chart reflects reduced record count',
    );
  }

  for (const reportType of GENERATION_REPORT_TYPES) {
    const collected = await dataCollectionService.collect(reportType, {});
    const reportCharts = chartService.generateForReportType(reportType, collected.aggregation!, false);
    const expectedIds = getChartIdsForReportType(reportType);
    assert(reportCharts.charts.length > 0, `${reportType} generates charts`);
    assert(
      reportCharts.charts.length <= expectedIds.length,
      `${reportType} chart count within expected scope`,
    );
    reportCharts.charts.forEach((chart) => assertChartShape(chart));
  }

  const pipelineContext = await chartPreparationService.prepareForContext({
    reportType: 'NBA',
    filters: {},
    collectedData: await dataCollectionService.collect('NBA', {}),
  });
  assert((pipelineContext.charts?.length ?? 0) > 0, 'Pipeline chart preparation produces charts');
  pipelineContext.charts?.forEach((chart) => {
    assert(chart.id.length > 0, 'Prepared chart has id');
    assert(!!chart.metadata?.exportFormats.includes('pdf'), 'Prepared chart has export metadata');
  });

  const sampleChart = allCharts.charts[0];
  const frontendExport = toFrontendExport(sampleChart);
  const pdfExport = toPdfExport(sampleChart);
  const docxExport = toDocxExport(sampleChart);
  assert(frontendExport.format === 'frontend', 'Frontend export format');
  assert(pdfExport.format === 'pdf' && pdfExport.title.length > 0, 'PDF export format');
  assert(docxExport.format === 'docx' && docxExport.tableRows.length === sampleChart.labels.length, 'DOCX export rows match labels');

  const chartTypes = new Set(allCharts.charts.map((c) => c.chartType));
  assert(chartTypes.has('bar'), 'Includes bar chart type');
  assert(chartTypes.has('line') || chartTypes.has('area'), 'Includes trend chart types');
  assert(chartTypes.has('pie') || chartTypes.has('doughnut'), 'Includes distribution chart types');

  await cleanupSampleData();
  clearChartCache();
  await disconnectDatabase();

  console.log('\nAll charts & analytics tests passed.');
};

runTests().catch(async (error) => {
  console.error(error);
  await cleanupSampleData().catch(() => undefined);
  clearChartCache();
  await disconnectDatabase().catch(() => undefined);
  process.exit(1);
});
