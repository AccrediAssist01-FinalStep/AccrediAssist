import { Request, Response } from 'express';
import { BaseController } from '../../controllers/base.controller';
import { asyncHandler } from '../../middleware/asyncHandler';
import { UnauthorizedError } from '../../utils/errors';
import { reportGenerationService } from '../services/report-generation.service';
import { dataCollectionService } from '../services/data-collection.service';
import { executiveSummaryService } from '../summary/services/executive-summary.service';
import { chartService } from '../charts/services/chart.service';
import { docxReportService } from '../docx/services/docx-report.service';
import { aiSummaryService } from '../services/ai-summary.service';
import { chartPreparationService } from '../services/chart-preparation.service';
import { aggregationService } from '../aggregation/services/aggregation.service';
import { parseGenerationReportType } from '../utils/report-type.util';
import { createPipelineContext } from '../utils/report-context.util';
import type { ReportGenerationFilters } from '../interfaces/report-generation.interface';
import fs from 'fs';
import path from 'path';
import { NotFoundError } from '../../utils/errors';

class ReportGenerationController extends BaseController {
  /** GET /report-generation/status */
  getStatus = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const status = reportGenerationService.getModuleStatus();
    this.success(res, 'Report generation module status retrieved', status);
  });

  /** GET /report-generation/types */
  listTypes = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const types = reportGenerationService.listReportTypes();
    this.success(res, 'Supported report types retrieved', types);
  });

  /** GET /report-generation/types/:typeId */
  getType = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const type = reportGenerationService.getReportType(String(req.params.typeId));
    this.success(res, 'Report type definition retrieved', type);
  });

  /** GET /report-generation/types/:typeId/generator */
  getGenerator = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const generator = reportGenerationService.describeGenerator(String(req.params.typeId));
    this.success(res, 'Report generator metadata retrieved', generator);
  });

  /** GET /report-generation/generators */
  listGenerators = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const generators = reportGenerationService.listGenerators();
    this.success(res, 'Report generators retrieved', generators);
  });

  /**
   * POST /report-generation/plan
   * Creates a pipeline plan without generating files.
   */
  createPlan = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = this.requireUserId(req);
    const reportType = parseGenerationReportType(req.body.reportType);

    const plan = reportGenerationService.planGeneration({
      reportType,
      title: req.body.title,
      filters: req.body.filters,
      requestedBy: userId,
    });

    this.success(res, 'Report generation plan created', plan);
  });

  /**
   * POST /report-generation/dry-run
   * Executes placeholder pipeline stages — no PDF/DOCX output.
   */
  dryRun = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = this.requireUserId(req);
    const reportType = parseGenerationReportType(req.body.reportType);

    const result = await reportGenerationService.dryRunPipeline({
      reportType,
      title: req.body.title,
      filters: req.body.filters,
      requestedBy: userId,
    });

    this.success(res, 'Report generation dry-run completed', result);
  });

  /** POST /report-generation/aggregate — run data aggregation engine */
  aggregate = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    this.requireUserId(req);
    const result = await aggregationService.aggregate(req.body);
    this.success(res, 'Report data aggregated successfully', result);
  });

  /**
   * POST /report-generation/summary
   * Generates a validated AI executive summary from aggregated institutional data.
   * Raw Gemini responses are never exposed.
   */
  generateSummary = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    this.requireUserId(req);
    const reportType = parseGenerationReportType(req.body.reportType);
    const filters = (req.body.filters ?? {}) as ReportGenerationFilters;

    const collected = await dataCollectionService.collect(reportType, filters);
    const aggregation = collected.aggregation;

    if (!aggregation) {
      this.success(res, 'Executive summary generated with fallback', {
        reportType,
        summary: {
          executiveSummary:
            'Executive summary could not be generated because aggregated report data is unavailable.',
          strengths: [],
          observations: [],
          recommendations: [],
          keyHighlights: [],
          generatedAt: new Date(),
          source: 'fallback' as const,
        },
      });
      return;
    }

    const { summary } = await executiveSummaryService.generate(reportType, aggregation);

    this.success(res, 'Executive summary generated successfully', {
      reportType,
      summary: {
        executiveSummary: summary.executiveSummary,
        strengths: summary.strengths,
        observations: summary.observations,
        recommendations: summary.recommendations,
        keyHighlights: summary.keyHighlights,
        model: summary.model,
        generatedAt: summary.generatedAt,
        source: summary.source,
      },
    });
  });

  /**
   * POST /report-generation/charts
   * Generates standardized chart JSON from aggregated MongoDB data.
   */
  generateCharts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    this.requireUserId(req);
    const reportType = parseGenerationReportType(req.body.reportType);
    const filters = (req.body.filters ?? {}) as ReportGenerationFilters;
    const exportFormat = req.body.exportFormat as 'pdf' | 'docx' | 'frontend' | undefined;

    const collected = await dataCollectionService.collect(reportType, filters);
    const aggregation = collected.aggregation;

    if (!aggregation) {
      this.success(res, 'No aggregated data available for chart generation', {
        reportType,
        charts: [],
        generatedAt: new Date(),
      });
      return;
    }

    const result = chartService.generateForReportType(reportType, aggregation);
    const charts = result.charts.map((chart) => ({
      chartType: chart.chartType,
      labels: chart.labels,
      datasets: chart.datasets,
      metadata: chart.metadata,
    }));

    const response: Record<string, unknown> = {
      reportType,
      charts,
      chartCount: charts.length,
      generatedAt: result.generatedAt,
      fromCache: result.fromCache,
    };

    if (exportFormat) {
      response.exports = chartService.toExportFormat(result.charts, exportFormat);
    }

    this.success(res, 'Report charts generated successfully', response);
  });

  /**
   * POST /report-generation/docx
   * Generates a professional DOCX report from aggregated data, AI summary, and charts.
   * Pass ?stream=true to receive the file directly.
   */
  generateDocx = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    this.requireUserId(req);
    const reportType = parseGenerationReportType(req.body.reportType);
    const filters = (req.body.filters ?? {}) as ReportGenerationFilters;

    let context = createPipelineContext(reportType, filters);
    context = await dataCollectionService.collectForContext(context);
    context = await aiSummaryService.summarizeForContext(context);
    context = await chartPreparationService.prepareForContext(context);

    const result = await docxReportService.generateFromContext(context);

    if (req.query.stream === 'true') {
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      );
      res.setHeader('Content-Disposition', `attachment; filename="${result.fileName}"`);
      res.send(result.buffer);
      return;
    }

    this.success(res, 'DOCX report generated successfully', {
      reportType,
      fileName: result.fileName,
      downloadUrl: result.downloadUrl,
      fileSizeBytes: result.fileSizeBytes,
      sectionsIncluded: result.sectionsIncluded,
      generatedAt: result.generatedAt,
    });
  });

  /** GET /report-generation/downloads/:fileName */
  downloadDocx = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    this.requireUserId(req);
    const fileName = path.basename(String(req.params.fileName));
    const filePath = docxReportService.resolveExportPath(fileName);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundError('Report file not found');
    }

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    );
    res.download(filePath, fileName);
  });

  private requireUserId(req: Request): string {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    return req.user.id;
  }
}

export const reportGenerationController = new ReportGenerationController();
