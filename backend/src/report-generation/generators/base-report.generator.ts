import { GenerationReportType } from '../config/report-types.config';
import { getGenerationReportTypeDefinition } from '../config/report-types.config';
import {
  ReportGenerationPipelineStage,
  ReportTypeDefinition,
} from '../interfaces/report-generation.interface';
import { ReportPipelineContext } from '../interfaces/report-data.interface';
import { ReportGenerationFilters } from '../interfaces/report-generation.interface';
import { createPipelineContext } from '../utils/report-context.util';

/** Shared contract for all report-type generators */
export abstract class BaseReportGenerator {
  abstract readonly reportType: GenerationReportType;

  getDefinition(): ReportTypeDefinition {
    return getGenerationReportTypeDefinition(this.reportType);
  }

  createContext(filters: ReportGenerationFilters = {}): ReportPipelineContext {
    return createPipelineContext(this.reportType, filters);
  }

  /** Returns pipeline plan for this report type — no generation performed */
  describePipeline(): ReportGenerationPipelineStage[] {
    return [
      'data_collection',
      'ai_summary',
      'chart_preparation',
      'document_generation',
      'export',
    ];
  }

  abstract getGeneratorNotes(): string;
}
