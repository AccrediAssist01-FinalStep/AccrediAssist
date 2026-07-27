import { isGeminiConfigured } from '../../ai';
import { logger } from '../../utils/logger';
import {
  GENERATION_REPORT_TYPES,
  getGenerationReportTypeDefinition,
  listGenerationReportTypes,
} from '../config/report-types.config';
import { getReportGenerator, getReportGeneratorById, listReportGenerators } from '../generators/generator.registry';
import {
  ReportGenerationModuleStatus,
  ReportGenerationPlan,
  ReportGenerationRequest,
  ReportGenerationPipelineStage,
  ReportTypeDefinition,
} from '../interfaces/report-generation.interface';
import { aiSummaryService } from './ai-summary.service';
import { chartPreparationService } from './chart-preparation.service';
import { dataCollectionService } from './data-collection.service';
import { documentGenerationService } from './document-generation.service';
import { exportService } from './export.service';
import { buildReportTitle, createPipelineContext } from '../utils/report-context.util';

const MODULE_VERSION = '1.0.0-architecture';

/**
 * Orchestrates the report generation pipeline.
 * Architecture-only — does not persist or export final reports.
 */
export class ReportGenerationService {
  getModuleStatus(): ReportGenerationModuleStatus {
    return {
      module: 'report-generation',
      version: MODULE_VERSION,
      ready: true,
      geminiConfigured: isGeminiConfigured(),
      supportedReportTypes: [...GENERATION_REPORT_TYPES],
      pipelineStages: [
        'data_collection',
        'ai_summary',
        'chart_preparation',
        'document_generation',
        'export',
      ],
      exportFormatsPlanned: exportService.getSupportedFormats(),
    };
  }

  listReportTypes(): ReportTypeDefinition[] {
    return listGenerationReportTypes();
  }

  getReportType(typeId: string): ReportTypeDefinition {
    return getGenerationReportTypeDefinition(
      getReportGeneratorById(typeId).reportType,
    );
  }

  describeGenerator(typeId: string): {
    reportType: string;
    pipeline: ReportGenerationPipelineStage[];
    notes: string;
    templateId: string;
  } {
    const generator = getReportGeneratorById(typeId);
    const definition = generator.getDefinition();

    return {
      reportType: generator.reportType,
      pipeline: generator.describePipeline(),
      notes: generator.getGeneratorNotes(),
      templateId: definition.templateId,
    };
  }

  /** Builds a generation plan without executing the pipeline */
  planGeneration(request: ReportGenerationRequest): ReportGenerationPlan {
    const generator = getReportGenerator(request.reportType);
    const title = buildReportTitle(
      request.reportType,
      request.filters ?? {},
      request.title,
    );

    logger.info('Report generation plan created (architecture only)', {
      reportType: request.reportType,
      requestedBy: request.requestedBy,
    });

    return {
      reportType: request.reportType,
      title,
      filters: request.filters ?? {},
      pipeline: generator.describePipeline(),
      status: 'architecture_only',
      message: 'Report generation pipeline is scaffolded but not yet executed.',
    };
  }

  /** Runs pipeline stages in sequence — each stage is currently a no-op placeholder */
  async dryRunPipeline(request: ReportGenerationRequest): Promise<{
    plan: ReportGenerationPlan;
    contextSummary: {
      sectionsCollected: number;
      chartsPrepared: number;
      documentSections: number;
      exportStatus: string;
    };
  }> {
    const plan = this.planGeneration(request);
    let context = createPipelineContext(request.reportType, request.filters ?? {});

    context = await dataCollectionService.collectForContext(context);
    context = await aiSummaryService.summarizeForContext(context);
    context = await chartPreparationService.prepareForContext(context);
    context = await documentGenerationService.composeForContext(context, request.title);

    const exportResult = await exportService.export({
      document: context.documentDraft!,
      format: 'pdf',
      fileName: `${plan.title}.pdf`,
      pipelineContext: context,
    });

    return {
      plan,
      contextSummary: {
        sectionsCollected: context.collectedData?.sections.length ?? 0,
        chartsPrepared: context.charts?.length ?? 0,
        documentSections: context.documentDraft?.sections.length ?? 0,
        exportStatus: exportResult.status,
      },
    };
  }

  listGenerators() {
    return listReportGenerators().map((generator) => ({
      reportType: generator.reportType,
      label: generator.getDefinition().label,
      notes: generator.getGeneratorNotes(),
    }));
  }
}

export const reportGenerationService = new ReportGenerationService();
