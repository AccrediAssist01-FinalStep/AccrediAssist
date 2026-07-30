import fs from 'fs/promises';
import path from 'path';
import PDFDocument from 'pdfkit';
import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
  PageBreak,
} from 'docx';
import { getPdfInstitutionConfig, PDF_LAYOUT, PDF_COLORS, getContentWidth } from '../report-generation/pdf/config/pdf.config';
import { getDocxInstitutionConfig } from '../report-generation/docx/config/docx.config';
import { IPendingRecord } from '../types/pendingRecord.types';
import { logger } from '../utils/logger';

const sanitizeFileName = (value: string): string =>
  value.replace(/[^a-zA-Z0-9-_]+/g, '-').replace(/-+/g, '-').slice(0, 80);

interface ExportUrls {
  pdfUrl: string;
  docxUrl: string;
  pdfFileName: string;
  docxFileName: string;
}

const getExtracted = (record: IPendingRecord): Record<string, unknown> =>
  record.extractedData ?? {};

const splitReportSections = (report: string): Array<{ heading: string; body: string }> => {
  const sections: Array<{ heading: string; body: string }> = [];
  const lines = report.split('\n');
  let currentHeading = 'Report';
  let body: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    const headingMatch = trimmed.match(/^(\d+\.\s*)?(.+)$/);
    const isHeading =
      /^(introduction|objectives|event overview|activities conducted|key highlights|speaker details|student participation|learning outcomes|benefits|conclusion|ai generated summary)/i.test(
        trimmed.replace(/^\d+\.\s*/, ''),
      );

    if (isHeading && headingMatch) {
      if (body.length > 0) {
        sections.push({ heading: currentHeading, body: body.join('\n').trim() });
        body = [];
      }
      currentHeading = trimmed.replace(/^\d+\.\s*/, '');
      continue;
    }

    if (trimmed) {
      body.push(trimmed);
    }
  }

  if (body.length > 0) {
    sections.push({ heading: currentHeading, body: body.join('\n').trim() });
  }

  if (sections.length === 0 && report.trim()) {
    sections.push({ heading: 'Event Report', body: report.trim() });
  }

  return sections;
};

export class AiEventReportExportService {
  async generateFromPendingRecord(record: IPendingRecord): Promise<ExportUrls> {
    const data = getExtracted(record);
    const title =
      (typeof data.eventName === 'string' && data.eventName) ||
      (typeof data.title === 'string' && data.title) ||
      'Institutional Event Report';
    const narrative =
      (typeof data.aiGeneratedReport === 'string' && data.aiGeneratedReport) ||
      (typeof data.description === 'string' && data.description) ||
      record.originalMessage;
    const summary = typeof data.summary === 'string' ? data.summary : undefined;
    const evidence = Array.isArray(data.evidence) ? data.evidence : [];

    const pdfConfig = getPdfInstitutionConfig();
    const docxConfig = getDocxInstitutionConfig();
    await fs.mkdir(pdfConfig.exportsDirectory, { recursive: true });
    await fs.mkdir(docxConfig.exportsDirectory, { recursive: true });

    const baseName = sanitizeFileName(title);
    const pdfFileName = `ai-event-${baseName}-${Date.now()}.pdf`;
    const docxFileName = `ai-event-${baseName}-${Date.now()}.docx`;
    const pdfPath = path.join(pdfConfig.exportsDirectory, pdfFileName);
    const docxPath = path.join(docxConfig.exportsDirectory, docxFileName);

    await this.buildPdf(pdfPath, {
      title,
      narrative,
      summary,
      department: typeof data.department === 'string' ? data.department : pdfConfig.departmentName,
      coordinator: typeof data.coordinator === 'string' ? data.coordinator : record.senderName,
      evidence,
      institution: pdfConfig,
    });

    await this.buildDocx(docxPath, {
      title,
      narrative,
      summary,
      department: typeof data.department === 'string' ? data.department : docxConfig.departmentName,
      coordinator: typeof data.coordinator === 'string' ? data.coordinator : record.senderName,
      evidence,
      institution: docxConfig,
    });

    const pdfUrl = `/api/v1/report-generation/downloads/${encodeURIComponent(pdfFileName)}`;
    const docxUrl = `/api/v1/report-generation/downloads/${encodeURIComponent(docxFileName)}`;

    logger.info('AI event report documents generated', {
      pendingRecordId: record._id,
      pdfFileName,
      docxFileName,
    });

    return { pdfUrl, docxUrl, pdfFileName, docxFileName };
  }

  private async buildPdf(
    filePath: string,
    input: {
      title: string;
      narrative: string;
      summary?: string;
      department: string;
      coordinator?: string;
      evidence: unknown[];
      institution: ReturnType<typeof getPdfInstitutionConfig>;
    },
  ): Promise<void> {
    const doc = new PDFDocument({ margin: PDF_LAYOUT.margin, size: 'A4' });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));

    const done = new Promise<void>((resolve, reject) => {
      doc.on('end', () => resolve());
      doc.on('error', reject);
    });

    doc.font('Helvetica-Bold').fontSize(18).fillColor(PDF_COLORS.primary)
      .text(input.institution.collegeName, { align: 'center' });
    doc.moveDown(0.3);
    doc.font('Helvetica').fontSize(11).fillColor(PDF_COLORS.secondary)
      .text(input.department, { align: 'center' });
    doc.moveDown(1);
    doc.font('Helvetica-Bold').fontSize(16).fillColor(PDF_COLORS.primary)
      .text(input.title, { align: 'center' });
    doc.moveDown(0.5);
    doc.font('Helvetica').fontSize(10).fillColor('#333333')
      .text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, { align: 'center' });
    if (input.coordinator) {
      doc.text(`Coordinator: ${input.coordinator}`, { align: 'center' });
    }
    doc.moveDown(1.5);

    if (input.summary) {
      doc.font('Helvetica-Bold').fontSize(12).fillColor(PDF_COLORS.primary).text('Executive Summary');
      doc.moveDown(0.3);
      doc.font('Helvetica').fontSize(10).fillColor('#333333')
        .text(input.summary, { align: 'justify', width: getContentWidth() });
      doc.moveDown(1);
    }

    for (const section of splitReportSections(input.narrative)) {
      doc.font('Helvetica-Bold').fontSize(12).fillColor(PDF_COLORS.primary).text(section.heading);
      doc.moveDown(0.3);
      doc.font('Helvetica').fontSize(10).fillColor('#333333')
        .text(section.body, { align: 'justify', width: getContentWidth(), lineGap: 3 });
      doc.moveDown(0.8);
    }

    if (input.evidence.length > 0) {
      doc.addPage();
      doc.font('Helvetica-Bold').fontSize(14).fillColor(PDF_COLORS.primary).text('Evidence Appendix');
      doc.moveDown(0.5);
      input.evidence.forEach((item, index) => {
        if (!item || typeof item !== 'object') return;
        const record = item as Record<string, unknown>;
        const label = typeof record.label === 'string' ? record.label : `Evidence ${index + 1}`;
        const url = typeof record.url === 'string' ? record.url : '';
        doc.font('Helvetica-Bold').fontSize(10).text(label);
        if (url) {
          doc.font('Helvetica').fontSize(9).fillColor(PDF_COLORS.secondary).text(url, {
            link: url,
            underline: true,
          });
        }
        doc.moveDown(0.4);
      });
    }

    const pages = doc.bufferedPageRange();
    for (let i = pages.start; i < pages.start + pages.count; i++) {
      doc.switchToPage(i);
      doc.font('Helvetica').fontSize(8).fillColor(PDF_COLORS.secondary)
        .text(`Page ${i + 1} of ${pages.count}`, PDF_LAYOUT.margin, PDF_LAYOUT.pageHeight - 40, {
          width: getContentWidth(),
          align: 'center',
        });
    }

    doc.end();
    await done;
    await fs.writeFile(filePath, Buffer.concat(chunks));
  }

  private async buildDocx(
    filePath: string,
    input: {
      title: string;
      narrative: string;
      summary?: string;
      department: string;
      coordinator?: string;
      evidence: unknown[];
      institution: ReturnType<typeof getDocxInstitutionConfig>;
    },
  ): Promise<void> {
    const children: Paragraph[] = [
      new Paragraph({
        text: input.institution.collegeName,
        heading: HeadingLevel.TITLE,
        alignment: 'center',
      }),
      new Paragraph({
        text: input.department,
        alignment: 'center',
      }),
      new Paragraph({
        text: input.title,
        heading: HeadingLevel.HEADING_1,
        alignment: 'center',
        spacing: { before: 400, after: 200 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: `Generated: ${new Date().toLocaleDateString('en-IN')}`, italics: true }),
        ],
        alignment: 'center',
      }),
    ];

    if (input.coordinator) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: `Coordinator: ${input.coordinator}` })],
          alignment: 'center',
        }),
      );
    }

    if (input.summary) {
      children.push(
        new Paragraph({ text: 'Executive Summary', heading: HeadingLevel.HEADING_2, spacing: { before: 400 } }),
        new Paragraph({ text: input.summary }),
      );
    }

    for (const section of splitReportSections(input.narrative)) {
      children.push(
        new Paragraph({ text: section.heading, heading: HeadingLevel.HEADING_2, spacing: { before: 300 } }),
        new Paragraph({ text: section.body }),
      );
    }

    if (input.evidence.length > 0) {
      children.push(
        new Paragraph({ children: [new PageBreak()] }),
        new Paragraph({ text: 'Evidence Appendix', heading: HeadingLevel.HEADING_1 }),
      );

      input.evidence.forEach((item, index) => {
        if (!item || typeof item !== 'object') return;
        const record = item as Record<string, unknown>;
        const label = typeof record.label === 'string' ? record.label : `Evidence ${index + 1}`;
        const url = typeof record.url === 'string' ? record.url : '';
        children.push(
          new Paragraph({ text: label, heading: HeadingLevel.HEADING_3 }),
          new Paragraph({ children: [new TextRun({ text: url || '—' })] }),
        );
      });
    }

    const document = new Document({
      sections: [{ properties: {}, children }],
    });

    const buffer = await Packer.toBuffer(document);
    await fs.writeFile(filePath, buffer);
  }
}

export const aiEventReportExportService = new AiEventReportExportService();
