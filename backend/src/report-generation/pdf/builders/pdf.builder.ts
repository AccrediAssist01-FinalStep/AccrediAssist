import fs from 'fs';
import PDFDocument from 'pdfkit';
import { getGenerationReportTypeDefinition } from '../../config/report-types.config';
import type {
  PdfEventImage,
  PdfLayoutState,
  PdfReportInput,
  TocEntry,
} from '../interfaces/pdf-report.interface';
import {
  PDF_COLORS,
  PDF_LAYOUT,
  formatReportDate,
  getContentWidth,
  getPdfInstitutionConfig,
} from '../config/pdf.config';
import {
  collectPdfBuffer,
  createPdfDocument,
  headerFooterService,
} from '../utils/header-footer.util';
import { chartRenderer } from '../renderers/chart.renderer';
import { tableRenderer } from '../renderers/table.renderer';
import { imageRenderer } from '../renderers/image.renderer';

type PdfDoc = InstanceType<typeof PDFDocument>;

const writeHeading = (doc: PdfDoc, state: PdfLayoutState, text: string, size = 16): void => {
  headerFooterService.ensureSpace(doc, state, 36);
  doc.font('Helvetica-Bold').fontSize(size).fillColor(PDF_COLORS.primary)
    .text(text, PDF_LAYOUT.margin, state.y, { width: getContentWidth() });
  state.y += size + 12;
};

const writeSubheading = (doc: PdfDoc, state: PdfLayoutState, text: string): void => {
  headerFooterService.ensureSpace(doc, state, 28);
  doc.font('Helvetica-Bold').fontSize(12).fillColor(PDF_COLORS.primary)
    .text(text, PDF_LAYOUT.margin, state.y, { width: getContentWidth() });
  state.y += 20;
};

const writeBody = (doc: PdfDoc, state: PdfLayoutState, text: string): void => {
  headerFooterService.ensureSpace(doc, state, 40);
  doc.font('Helvetica').fontSize(10).fillColor('#333333')
    .text(text, PDF_LAYOUT.margin, state.y, {
      width: getContentWidth(),
      align: 'justify',
      lineGap: 3,
    });
  state.y = doc.y + 12;
};

const writeBullet = (doc: PdfDoc, state: PdfLayoutState, text: string): void => {
  headerFooterService.ensureSpace(doc, state, 20);
  doc.font('Helvetica').fontSize(10).fillColor('#333333')
    .text(`• ${text}`, PDF_LAYOUT.margin + 8, state.y, {
      width: getContentWidth() - 8,
      lineGap: 2,
    });
  state.y = doc.y + 4;
};

const recordToc = (toc: TocEntry[], title: string, doc: PdfDoc): void => {
  const page = doc.bufferedPageRange().count;
  toc.push({ title, page: page + 1 });
};

export class PdfBuilder {
  async build(
    input: PdfReportInput,
    eventImages: PdfEventImage[],
  ): Promise<{ buffer: Buffer; sectionsIncluded: string[]; pageCount: number }> {
    const institution = getPdfInstitutionConfig();
    const definition = getGenerationReportTypeDefinition(input.reportType);
    const academicYear =
      input.filters.academicYear ??
      (input.filters.year ? String(input.filters.year) : 'Not specified');
    const department = input.filters.department ?? institution.departmentName;
    const sectionsIncluded: string[] = [];
    const tocEntries: TocEntry[] = [];

    const doc = createPdfDocument(input.title);
    const bufferPromise = collectPdfBuffer(doc);

    const state: PdfLayoutState = {
      y: PDF_LAYOUT.margin,
      pageNumber: 1,
    };

    // 1. Cover Page
    sectionsIncluded.push('cover');
    this.buildCoverPage(doc, state, input, institution.collegeName, department, academicYear);

    // 2. Table of Contents placeholder page
    doc.addPage();
    state.pageNumber += 1;
    state.y = PDF_LAYOUT.margin + PDF_LAYOUT.headerHeight;
    sectionsIncluded.push('table-of-contents');
    const tocPageIndex = doc.bufferedPageRange().count - 1;
    writeHeading(doc, state, 'Table of Contents', 18);

    // 3. Executive Summary
    doc.addPage();
    state.pageNumber += 1;
    state.y = PDF_LAYOUT.margin + PDF_LAYOUT.headerHeight;
    sectionsIncluded.push('executive-summary');
    recordToc(tocEntries, 'Executive Summary', doc);
    writeHeading(doc, state, 'Executive Summary');
    if (input.aiSummary?.executiveSummary) {
      writeBody(doc, state, input.aiSummary.executiveSummary);
    } else {
      writeBody(doc, state, 'Executive summary is not available for this report scope.');
    }

    // 4. Key Highlights
    sectionsIncluded.push('key-highlights');
    recordToc(tocEntries, 'Key Highlights', doc);
    writeHeading(doc, state, 'Key Highlights');
    const highlights = input.aiSummary?.keyHighlights ?? input.collectedData?.aggregation?.summary.highlights ?? [];
    if (highlights.length > 0) {
      highlights.forEach((item) => writeBullet(doc, state, item));
    } else {
      writeBody(doc, state, 'No key highlights were recorded for this report scope.');
    }

    // 5. Charts
    sectionsIncluded.push('charts');
    recordToc(tocEntries, 'Charts', doc);
    writeHeading(doc, state, 'Charts');
    writeBody(doc, state, 'The following charts are rendered from aggregated institutional analytics data.');
    if ((input.charts?.length ?? 0) > 0) {
      input.charts!.forEach((chart) => chartRenderer.render(doc, state, chart));
    } else {
      writeBody(doc, state, 'No chart data was available for this report scope.');
    }

    // 6. Statistics
    sectionsIncluded.push('statistics');
    recordToc(tocEntries, 'Statistics', doc);
    writeHeading(doc, state, 'Statistics');
    const statsRows = Object.entries(input.collectedData?.aggregation?.statistics.byModule ?? {})
      .filter(([, stats]) => !!stats)
      .map(([, stats]) => ({
        module: stats!.label,
        total: stats!.totalCount,
        growth: stats!.growthPercentage === null ? 'N/A' : String(stats!.growthPercentage),
      }));

    if (statsRows.length > 0) {
      writeBody(
        doc,
        state,
        `Overall institutional records: ${input.collectedData?.aggregation?.statistics.overall.totalRecords ?? 0}. Report category: ${definition.label}.`,
      );
      tableRenderer.renderStatisticsTable(doc, state, statsRows);
    } else {
      writeBody(doc, state, 'No statistical data was available for this report scope.');
    }

    // 7. Tables
    sectionsIncluded.push('tables');
    recordToc(tocEntries, 'Detailed Tables', doc);
    writeHeading(doc, state, 'Detailed Tables');
    const sections = input.collectedData?.sections ?? [];
    if (sections.length === 0) {
      writeBody(doc, state, 'No detailed records were available for this report scope.');
    } else {
      for (const section of sections) {
        if (section.records.length === 0) continue;
        writeSubheading(doc, state, section.label);
        const headers = Object.keys(section.records[0] ?? {}).slice(0, 6);
        if (headers.length > 0) {
          tableRenderer.renderRecordsTable(doc, state, headers, section.records.slice(0, 30));
        }
      }
    }

    // 8. Images
    sectionsIncluded.push('images');
    recordToc(tocEntries, 'Event Images', doc);
    writeHeading(doc, state, 'Event Images');
    imageRenderer.render(doc, state, eventImages);

    // 9. Recommendations
    sectionsIncluded.push('recommendations');
    recordToc(tocEntries, 'Recommendations', doc);
    writeHeading(doc, state, 'Recommendations');
    const recommendations = input.aiSummary?.recommendations ?? [];
    if (recommendations.length > 0) {
      recommendations.forEach((item) => writeBullet(doc, state, item));
    } else {
      writeBody(doc, state, 'No recommendations were generated for this report scope.');
    }

    // 10. Appendix
    sectionsIncluded.push('appendix');
    doc.addPage();
    state.pageNumber += 1;
    state.y = PDF_LAYOUT.margin + PDF_LAYOUT.headerHeight;
    recordToc(tocEntries, 'Appendix', doc);
    writeHeading(doc, state, 'Appendix');
    writeBody(doc, state, `Report Type: ${definition.label}`);
    writeBody(doc, state, `Generated: ${formatReportDate(input.generatedAt)}`);
    writeBody(doc, state, `Academic Year: ${academicYear}`);
    writeBody(doc, state, `Department: ${department}`);
    writeBody(doc, state, `AI Summary Source: ${input.aiSummary?.source ?? 'not available'}`);
    writeBody(doc, state, `Sections: ${sectionsIncluded.join(', ')}`);

    const strengths = input.aiSummary?.strengths ?? [];
    const observations = input.aiSummary?.observations ?? [];
    if (strengths.length > 0) {
      writeSubheading(doc, state, 'Institutional Strengths');
      strengths.forEach((item) => writeBullet(doc, state, item));
    }
    if (observations.length > 0) {
      writeSubheading(doc, state, 'Observations');
      observations.forEach((item) => writeBullet(doc, state, item));
    }

    // Write TOC on reserved page
    this.renderTableOfContents(doc, tocPageIndex, tocEntries);

    headerFooterService.applyPageDecorations(doc, input.title);

    const pageCount = doc.bufferedPageRange().count;
    doc.end();
    const buffer = await bufferPromise;

    return { buffer, sectionsIncluded, pageCount };
  }

  private buildCoverPage(
    doc: PdfDoc,
    state: PdfLayoutState,
    input: PdfReportInput,
    collegeName: string,
    department: string,
    academicYear: string,
  ): void {
    const institution = getPdfInstitutionConfig();
    let logoY = PDF_LAYOUT.margin + 40;

    if (institution.accrediassistLogoPath && fs.existsSync(institution.accrediassistLogoPath)) {
      try {
        doc.image(institution.accrediassistLogoPath, PDF_LAYOUT.margin, logoY, { width: 140 });
        logoY += 50;
      } catch {
        doc.font('Helvetica-Bold').fontSize(22).fillColor(PDF_COLORS.primary)
          .text('AccrediAssist', PDF_LAYOUT.margin, logoY);
        logoY += 40;
      }
    } else {
      doc.font('Helvetica-Bold').fontSize(22).fillColor(PDF_COLORS.primary)
        .text('AccrediAssist', PDF_LAYOUT.margin, logoY);
      logoY += 40;
    }

    if (institution.collegeLogoPath) {
      try {
        doc.image(institution.collegeLogoPath, PDF_LAYOUT.pageWidth - PDF_LAYOUT.margin - 120, PDF_LAYOUT.margin + 40, {
          width: 120,
        });
      } catch {
        // skip unavailable college logo
      }
    }

    state.y = 220;
    doc.font('Helvetica-Bold').fontSize(24).fillColor(PDF_COLORS.primary)
      .text(collegeName, PDF_LAYOUT.margin, state.y, { width: getContentWidth(), align: 'center' });
    state.y += 40;

    doc.font('Helvetica').fontSize(14).fillColor('#333333')
      .text(department, PDF_LAYOUT.margin, state.y, { width: getContentWidth(), align: 'center' });
    state.y += 36;

    doc.font('Helvetica-Bold').fontSize(18).fillColor(PDF_COLORS.primary)
      .text(input.title, PDF_LAYOUT.margin, state.y, { width: getContentWidth(), align: 'center' });
    state.y += 48;

    doc.font('Helvetica').fontSize(12).fillColor(PDF_COLORS.secondary)
      .text(`Academic Year: ${academicYear}`, PDF_LAYOUT.margin, state.y, {
        width: getContentWidth(),
        align: 'center',
      });
    state.y += 24;

    doc.font('Helvetica').fontSize(11).fillColor(PDF_COLORS.secondary)
      .text(`Generated: ${formatReportDate(input.generatedAt)}`, PDF_LAYOUT.margin, state.y, {
        width: getContentWidth(),
        align: 'center',
      });
  }

  private renderTableOfContents(doc: PdfDoc, tocPageIndex: number, entries: TocEntry[]): void {
    doc.switchToPage(tocPageIndex);
    let y = PDF_LAYOUT.margin + PDF_LAYOUT.headerHeight + 40;

    entries.forEach((entry) => {
      const dots = '.'.repeat(Math.max(2, 60 - entry.title.length));
      doc.font('Helvetica').fontSize(10).fillColor('#333333')
        .text(`${entry.title} ${dots} ${entry.page}`, PDF_LAYOUT.margin, y, {
          width: getContentWidth(),
          lineBreak: false,
        });
      y += 18;
    });
  }
}

export const pdfBuilder = new PdfBuilder();
