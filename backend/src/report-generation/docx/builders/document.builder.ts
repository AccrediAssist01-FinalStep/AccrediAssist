import fs from 'fs';
import {
  AlignmentType,
  Document,
  FileChild,
  HeadingLevel,
  ImageRun,
  Packer,
  PageBreak,
  Paragraph,
  TableOfContents,
  TextRun,
} from 'docx';
import { getGenerationReportTypeDefinition } from '../../config/report-types.config';
import type { DocxReportInput, EventImageAsset } from '../interfaces/docx-report.interface';
import {
  DOCX_PAGE,
  DOCX_TYPOGRAPHY,
  getDocxInstitutionConfig,
  REPORT_SECTION_ORDER,
} from '../config/docx.config';
import { buildDocumentFooter, buildDocumentHeader, buildBodyParagraph, buildBulletParagraph, buildSectionHeading } from '../utils/header-footer.util';
import { tableBuilder } from './table.builder';
import { chartInserter } from './chart.inserter';
import { imageInserter } from './image.inserter';

const formatDate = (value: Date): string =>
  value.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

export class DocumentBuilder {
  async build(
    input: DocxReportInput,
    eventImages: EventImageAsset[],
  ): Promise<{ buffer: Buffer; sectionsIncluded: string[] }> {
    const institution = getDocxInstitutionConfig();
    const definition = getGenerationReportTypeDefinition(input.reportType);
    const academicYear =
      input.filters.academicYear ??
      (input.filters.year ? String(input.filters.year) : 'Not specified');
    const department = input.filters.department ?? institution.departmentName;
    const sectionsIncluded: string[] = [];

    const children: FileChild[] = [];

    // 1. Cover Page
    sectionsIncluded.push('cover');
    children.push(...this.buildCoverPage(input, institution.collegeName, department, academicYear));

    // 2. Table of Contents
    sectionsIncluded.push('table-of-contents');
    children.push(
      new Paragraph({ children: [new PageBreak()] }),
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [
          new TextRun({
            text: 'Table of Contents',
            font: DOCX_TYPOGRAPHY.fontFamily,
            size: DOCX_TYPOGRAPHY.heading1Size,
            bold: true,
          }),
        ],
      }),
      new TableOfContents('Table of Contents', {
        hyperlink: true,
        headingStyleRange: '1-2',
      }),
      new Paragraph({ children: [new PageBreak()] }),
    );

    // 3. Executive Summary
    sectionsIncluded.push('executive-summary');
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: 'Executive Summary', bold: true, font: DOCX_TYPOGRAPHY.fontFamily, size: DOCX_TYPOGRAPHY.heading1Size })],
      }),
    );
    if (input.aiSummary?.executiveSummary) {
      children.push(buildBodyParagraph(input.aiSummary.executiveSummary));
    } else {
      children.push(buildBodyParagraph('Executive summary is not available for this report scope.'));
    }

    // 4. Key Highlights
    sectionsIncluded.push('key-highlights');
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: 'Key Highlights', bold: true, font: DOCX_TYPOGRAPHY.fontFamily, size: DOCX_TYPOGRAPHY.heading1Size })],
      }),
    );
    const highlights = input.aiSummary?.keyHighlights ?? [];
    if (highlights.length > 0) {
      highlights.forEach((item) => children.push(buildBulletParagraph(item)));
    } else if (input.collectedData?.aggregation?.summary.highlights.length) {
      input.collectedData.aggregation.summary.highlights.forEach((item) =>
        children.push(buildBulletParagraph(item)),
      );
    } else {
      children.push(buildBodyParagraph('No key highlights were recorded for this report scope.'));
    }

    // 5. Statistics
    sectionsIncluded.push('statistics');
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: 'Statistics', bold: true, font: DOCX_TYPOGRAPHY.fontFamily, size: DOCX_TYPOGRAPHY.heading1Size })],
      }),
    );
    const statsRows = Object.entries(input.collectedData?.aggregation?.statistics.byModule ?? {})
      .filter(([, stats]) => !!stats)
      .map(([, stats]) => ({
        module: stats!.label,
        total: stats!.totalCount,
        growth: stats!.growthPercentage === null ? 'N/A' : String(stats!.growthPercentage),
      }));

    if (statsRows.length > 0) {
      children.push(
        buildBodyParagraph(
          `Overall institutional records: ${input.collectedData?.aggregation?.statistics.overall.totalRecords ?? 0}. Report category: ${definition.label}.`,
        ),
        tableBuilder.buildStatisticsTable(statsRows),
      );
    } else {
      children.push(buildBodyParagraph('No statistical data was available for this report scope.'));
    }

    // 6. Charts
    sectionsIncluded.push('charts');
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: 'Charts', bold: true, font: DOCX_TYPOGRAPHY.fontFamily, size: DOCX_TYPOGRAPHY.heading1Size })],
      }),
      buildBodyParagraph('The following tables represent chart datasets embedded for accreditation and management review documentation.'),
    );
    children.push(...chartInserter.insertCharts(input.charts));

    // 7. Date-wise Activity Register
    const dateWiseRegister = input.collectedData?.dateWiseRegister;
    if (dateWiseRegister && dateWiseRegister.rows.length > 0) {
      sectionsIncluded.push('date-register');
      children.push(
        new Paragraph({ children: [new PageBreak()] }),
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [
            new TextRun({
              text: 'Date-wise Activity Register',
              bold: true,
              font: DOCX_TYPOGRAPHY.fontFamily,
              size: DOCX_TYPOGRAPHY.heading1Size,
            }),
          ],
        }),
        buildBodyParagraph(
          `Consolidated tabular register covering all student activity sub-modules — ${dateWiseRegister.totalCount} records sorted chronologically and grouped by month.`,
        ),
      );

      const columnLabels = dateWiseRegister.columns.map((column) => column.label);
      const columnKeys = dateWiseRegister.columns.map((column) => column.key);
      const sortedMonths = Object.entries(dateWiseRegister.byMonth).sort(([left], [right]) => {
        const parseMonth = (label: string): number => {
          if (label === 'Undated') return Number.MAX_SAFE_INTEGER;
          const parsed = new Date(`1 ${label}`);
          return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
        };
        return parseMonth(left) - parseMonth(right);
      });

      for (const [monthLabel, monthRows] of sortedMonths) {
        children.push(buildSectionHeading(monthLabel, 2));
        children.push(tableBuilder.buildRegisterTable(columnLabels, columnKeys, monthRows));
      }
    }

    // 8. Submodule-wise Tables
    sectionsIncluded.push('detailed-tables');
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: 'Submodule-wise Tables', bold: true, font: DOCX_TYPOGRAPHY.fontFamily, size: DOCX_TYPOGRAPHY.heading1Size })],
      }),
    );

    const sections = input.collectedData?.sections ?? [];
    if (sections.length === 0) {
      children.push(buildBodyParagraph('No detailed records were available for this report scope.'));
    } else {
      for (const section of sections) {
        if (section.records.length === 0) continue;
        children.push(buildSectionHeading(section.label, 2));
        const headers = Object.keys(section.records[0] ?? {}).slice(0, 8);
        if (headers.length > 0) {
          children.push(tableBuilder.buildRecordsTable(headers, section.records.slice(0, 25)));
        }
      }
    }

    // 8. Images
    sectionsIncluded.push('images');
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: 'Event Images', bold: true, font: DOCX_TYPOGRAPHY.fontFamily, size: DOCX_TYPOGRAPHY.heading1Size })],
      }),
    );
    if (eventImages.length > 0) {
      children.push(...imageInserter.insertImages(eventImages));
    } else {
      children.push(buildBodyParagraph('No event photographs were available for the selected report scope.'));
    }

    // 9. Recommendations
    sectionsIncluded.push('recommendations');
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: 'Recommendations', bold: true, font: DOCX_TYPOGRAPHY.fontFamily, size: DOCX_TYPOGRAPHY.heading1Size })],
      }),
    );
    const recommendations = input.aiSummary?.recommendations ?? [];
    if (recommendations.length > 0) {
      recommendations.forEach((item) => children.push(buildBulletParagraph(item)));
    } else {
      children.push(buildBodyParagraph('No recommendations were generated for this report scope.'));
    }

    // 10. Appendix
    sectionsIncluded.push('appendix');
    children.push(
      new Paragraph({ children: [new PageBreak()] }),
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: 'Appendix', bold: true, font: DOCX_TYPOGRAPHY.fontFamily, size: DOCX_TYPOGRAPHY.heading1Size })],
      }),
      buildBodyParagraph(`Report Type: ${definition.label}`),
      buildBodyParagraph(`Generated: ${formatDate(input.generatedAt)}`),
      buildBodyParagraph(`Academic Year: ${academicYear}`),
      buildBodyParagraph(`Department: ${department}`),
      buildBodyParagraph(`AI Summary Source: ${input.aiSummary?.source ?? 'not available'}`),
      buildBodyParagraph(`Sections Included: ${sectionsIncluded.join(', ')}`),
      buildBodyParagraph(`Section Order Reference: ${REPORT_SECTION_ORDER.join(' → ')}`),
    );

    const strengths = input.aiSummary?.strengths ?? [];
    const observations = input.aiSummary?.observations ?? [];
    if (strengths.length > 0) {
      children.push(buildSectionHeading('Institutional Strengths', 2));
      strengths.forEach((item) => children.push(buildBulletParagraph(item)));
    }
    if (observations.length > 0) {
      children.push(buildSectionHeading('Observations', 2));
      observations.forEach((item) => children.push(buildBulletParagraph(item)));
    }

    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: DOCX_PAGE.marginTopTwips,
                bottom: DOCX_PAGE.marginBottomTwips,
                left: DOCX_PAGE.marginLeftTwips,
                right: DOCX_PAGE.marginRightTwips,
              },
            },
          },
          headers: {
            default: buildDocumentHeader(input.title),
          },
          footers: {
            default: buildDocumentFooter(),
          },
          children,
        },
      ],
    });

    return {
      buffer: await Packer.toBuffer(doc),
      sectionsIncluded,
    };
  }

  private buildCoverPage(
    input: DocxReportInput,
    collegeName: string,
    department: string,
    academicYear: string,
  ): Paragraph[] {
    const institution = getDocxInstitutionConfig();
    const paragraphs: Paragraph[] = [];

    if (institution.logoPath && fs.existsSync(institution.logoPath)) {
      const logoBuffer = fs.readFileSync(institution.logoPath);
      paragraphs.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
          children: [
            new ImageRun({
              data: logoBuffer,
              transformation: { width: 180, height: 60 },
              type: 'png',
            }),
          ],
        }),
      );
    } else {
      paragraphs.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
          children: [
            new TextRun({
              text: 'AccrediAssist',
              bold: true,
              font: DOCX_TYPOGRAPHY.fontFamily,
              size: 40,
              color: '1F3864',
            }),
          ],
        }),
      );
    }

    paragraphs.push(
      new Paragraph({ spacing: { before: 800 } }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: collegeName,
            bold: true,
            font: DOCX_TYPOGRAPHY.fontFamily,
            size: DOCX_TYPOGRAPHY.titleSize,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: department,
            font: DOCX_TYPOGRAPHY.fontFamily,
            size: 26,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
        children: [
          new TextRun({
            text: input.title,
            bold: true,
            font: DOCX_TYPOGRAPHY.fontFamily,
            size: 30,
            color: '1F3864',
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: `Academic Year: ${academicYear}`,
            font: DOCX_TYPOGRAPHY.fontFamily,
            size: 24,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 600 },
        children: [
          new TextRun({
            text: `Generated: ${formatDate(input.generatedAt)}`,
            font: DOCX_TYPOGRAPHY.fontFamily,
            size: 22,
            color: '666666',
          }),
        ],
      }),
    );

    return paragraphs;
  }
}

export const documentBuilder = new DocumentBuilder();
