import { logger } from '../../utils/logger';
import { getTemplateDescriptor } from '../templates/template.registry';
import { ReportDocumentDraft, ReportPipelineContext } from '../interfaces/report-data.interface';
import { buildReportTitle } from '../utils/report-context.util';

/**
 * Composes in-memory report document structure from pipeline context.
 * Does NOT produce PDF or DOCX files.
 */
export class DocumentGenerationService {
  async compose(context: ReportPipelineContext, customTitle?: string): Promise<ReportDocumentDraft> {
    const template = getTemplateDescriptor(context.reportType);
    const title = buildReportTitle(context.reportType, context.filters, customTitle);

    logger.info('Document composition planned (not yet implemented)', {
      reportType: context.reportType,
      templateId: template.templateId,
      title,
    });

    return {
      title,
      sections: template.sectionOutline.map((heading) => ({
        heading,
        body: '',
      })),
      metadata: {
        reportType: context.reportType,
        templateId: template.templateId,
        status: 'draft',
      },
    };
  }

  async composeForContext(
    context: ReportPipelineContext,
    customTitle?: string,
  ): Promise<ReportPipelineContext> {
    const documentDraft = await this.compose(context, customTitle);
    return { ...context, documentDraft };
  }
}

export const documentGenerationService = new DocumentGenerationService();
