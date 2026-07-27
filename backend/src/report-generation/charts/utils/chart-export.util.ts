import type { PreparedChart } from '../../interfaces/report-data.interface';
import type { ChartExportFormat, StandardChart } from '../interfaces/chart.interface';

export interface FrontendChartExport {
  format: 'frontend';
  chartType: StandardChart['chartType'];
  labels: string[];
  datasets: StandardChart['datasets'];
  metadata: StandardChart['metadata'];
}

export interface PdfChartExport {
  format: 'pdf';
  chartType: StandardChart['chartType'];
  title: string;
  labels: string[];
  datasets: StandardChart['datasets'];
  renderHint: 'vector' | 'raster';
}

export interface DocxChartExport {
  format: 'docx';
  chartType: StandardChart['chartType'];
  title: string;
  tableRows: Array<{ label: string; values: Record<string, number> }>;
  metadata: StandardChart['metadata'];
}

export type ChartExportPayload = FrontendChartExport | PdfChartExport | DocxChartExport;

export const toPreparedChart = (chart: StandardChart): PreparedChart => ({
  id: chart.metadata.id,
  title: chart.metadata.title,
  chartType: chart.chartType,
  labels: chart.labels,
  datasets: chart.datasets,
  metadata: chart.metadata,
});

export const toPreparedCharts = (charts: StandardChart[]): PreparedChart[] =>
  charts.map(toPreparedChart);

export const toFrontendExport = (chart: StandardChart): FrontendChartExport => ({
  format: 'frontend',
  chartType: chart.chartType,
  labels: chart.labels,
  datasets: chart.datasets,
  metadata: chart.metadata,
});

export const toPdfExport = (chart: StandardChart): PdfChartExport => ({
  format: 'pdf',
  chartType: chart.chartType,
  title: chart.metadata.title,
  labels: chart.labels,
  datasets: chart.datasets,
  renderHint: chart.chartType === 'pie' || chart.chartType === 'doughnut' ? 'raster' : 'vector',
});

export const toDocxExport = (chart: StandardChart): DocxChartExport => {
  const datasetLabels = chart.datasets.map((dataset) => dataset.label);

  const tableRows = chart.labels.map((label, index) => ({
    label,
    values: chart.datasets.reduce<Record<string, number>>((acc, dataset) => {
      acc[dataset.label] = dataset.data[index] ?? 0;
      return acc;
    }, {}),
  }));

  return {
    format: 'docx',
    chartType: chart.chartType,
    title: chart.metadata.title,
    tableRows,
    metadata: {
      ...chart.metadata,
      datasetLabels,
    } as StandardChart['metadata'] & { datasetLabels: string[] },
  };
};

export const toExportPayload = (
  chart: StandardChart,
  format: ChartExportFormat,
): ChartExportPayload => {
  switch (format) {
    case 'frontend':
      return toFrontendExport(chart);
    case 'pdf':
      return toPdfExport(chart);
    case 'docx':
      return toDocxExport(chart);
    default:
      return toFrontendExport(chart);
  }
};

export const toExportPayloads = (
  charts: StandardChart[],
  format: ChartExportFormat,
): ChartExportPayload[] => charts.map((chart) => toExportPayload(chart, format));
