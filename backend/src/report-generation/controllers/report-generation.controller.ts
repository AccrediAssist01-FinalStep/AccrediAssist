import { Request, Response } from 'express';
import { BaseController } from '../../controllers/base.controller';
import { asyncHandler } from '../../middleware/asyncHandler';
import { UnauthorizedError } from '../../utils/errors';
import { reportGenerationService } from '../services/report-generation.service';
import { aggregationService } from '../aggregation/services/aggregation.service';
import { parseGenerationReportType } from '../utils/report-type.util';

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

  private requireUserId(req: Request): string {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    return req.user.id;
  }
}

export const reportGenerationController = new ReportGenerationController();
