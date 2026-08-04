import PDFDocument from 'pdfkit';
import {
  WORKSHOP_EVENT_DETAIL_LABELS,
  WORKSHOP_REPORT_HEADINGS,
} from '../workshop-report-template.config';
import { unavailableOr } from '../utils/workshop-report-normalizer.util';
import { getEventReportLabels } from '../utils/event-report-labels.util';
import {
  ResolvedWorkshopImage,
  WorkshopReportGeneratorInput,
  WorkshopReportStructuredContent,
} from '../workshop-report.types';

type PdfDoc = InstanceType<typeof PDFDocument>;

const MARGIN = 72;
const CONTENT_WIDTH = 612 - MARGIN * 2;

const writeCentered = (doc: PdfDoc, text: string, size: number, bold = false): void => {
  doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(size).text(text, MARGIN, doc.y, {
    width: CONTENT_WIDTH,
    align: 'center',
  });
  doc.moveDown(0.5);
};

const writeHeading = (doc: PdfDoc, text: string): void => {
  doc.moveDown(0.5);
  doc.font('Helvetica-Bold').fontSize(14).fillColor('#000000').text(text, MARGIN, doc.y, {
    width: CONTENT_WIDTH,
    align: 'left',
  });
  doc.moveDown(0.3);
};

const writeBody = (doc: PdfDoc, text: string): void => {
  doc.font('Helvetica').fontSize(12).fillColor('#000000').text(text, MARGIN, doc.y, {
    width: CONTENT_WIDTH,
    align: 'justify',
    lineGap: 3,
  });
  doc.moveDown(0.4);
};

const writeLabeledDetail = (doc: PdfDoc, label: string, value: string): void => {
  doc.font('Helvetica-Bold').fontSize(12).text(label, MARGIN, doc.y, { continued: true });
  doc.font('Helvetica').text(` ${value}`, { width: CONTENT_WIDTH, align: 'justify' });
  doc.moveDown(0.2);
};

const writeRule = (doc: PdfDoc): void => {
  const y = doc.y + 4;
  doc.moveTo(MARGIN, y).lineTo(MARGIN + CONTENT_WIDTH, y).strokeColor('#A0A0A0').lineWidth(1).stroke();
  doc.moveDown(0.8);
};

const writeImages = (doc: PdfDoc, images: ResolvedWorkshopImage[]): void => {
  images.forEach((image) => {
    if (image.bytes?.length) {
      if (doc.y > 650) doc.addPage();
      try {
        doc.image(image.bytes, MARGIN + 60, doc.y, { fit: [CONTENT_WIDTH - 120, 220], align: 'center' });
        doc.moveDown(12);
      } catch {
        doc.moveDown(0.5);
      }
    }
    doc.font('Helvetica-Oblique').fontSize(11).text(image.caption, MARGIN, doc.y, {
      width: CONTENT_WIDTH,
      align: 'center',
    });
    doc.moveDown(0.8);
  });
};

const buildEventDetails = (doc: PdfDoc, structured: WorkshopReportStructuredContent): void => {
  const details = structured.eventDetails;
  writeHeading(doc, WORKSHOP_REPORT_HEADINGS.eventDetails);
  writeLabeledDetail(doc, WORKSHOP_EVENT_DETAIL_LABELS.title, unavailableOr(details.title));
  writeLabeledDetail(doc, WORKSHOP_EVENT_DETAIL_LABELS.organizedBy, unavailableOr(details.organizedBy));
  writeLabeledDetail(doc, WORKSHOP_EVENT_DETAIL_LABELS.resourcePerson, unavailableOr(details.resourcePerson));
  writeLabeledDetail(doc, WORKSHOP_EVENT_DETAIL_LABELS.headOfDepartment, unavailableOr(details.headOfDepartment));
  writeLabeledDetail(doc, WORKSHOP_EVENT_DETAIL_LABELS.venue, unavailableOr(details.venue));
  writeLabeledDetail(doc, WORKSHOP_EVENT_DETAIL_LABELS.date, unavailableOr(details.date));
  writeLabeledDetail(doc, WORKSHOP_EVENT_DETAIL_LABELS.time, unavailableOr(details.time));
  writeLabeledDetail(doc, WORKSHOP_EVENT_DETAIL_LABELS.participants, unavailableOr(details.participants));
  writeRule(doc);
};

export const buildWorkshopReportPdf = async (
  input: WorkshopReportGeneratorInput,
  images: ResolvedWorkshopImage[],
): Promise<Buffer> => {
  const structured = input.structured;
  const labels = getEventReportLabels(input.reportKind);
  const department = unavailableOr(structured.departmentName ?? input.defaultDepartment);
  const title = unavailableOr(
    structured.reportTitle ??
      (structured.eventDetails.title ? labels.buildReportTitle(structured.eventDetails.title) : null),
  );

  const doc = new PDFDocument({ margin: MARGIN, size: 'LETTER' });
  const chunks: Buffer[] = [];
  doc.on('data', (chunk) => chunks.push(chunk));

  const done = new Promise<void>((resolve, reject) => {
    doc.on('end', () => resolve());
    doc.on('error', reject);
  });

  writeCentered(doc, department, 24, true);
  writeCentered(doc, title, 18, true);
  writeRule(doc);
  buildEventDetails(doc, structured);

  if (structured.introduction.length > 0) {
    writeHeading(doc, WORKSHOP_REPORT_HEADINGS.introduction);
    structured.introduction.forEach((paragraph) => writeBody(doc, paragraph));
    writeRule(doc);
  }

  if (structured.objectives.length > 0) {
    writeHeading(doc, WORKSHOP_REPORT_HEADINGS.objectives);
    writeBody(doc, labels.objectivesLeadIn);
    structured.objectives.forEach((item, index) => writeBody(doc, `${index + 1}. ${item}`));
    writeRule(doc);
  }

  if (structured.workshopProceedings.length > 0) {
    writeHeading(doc, labels.proceedingsHeading);
    structured.workshopProceedings.forEach((paragraph) => writeBody(doc, paragraph));
    writeRule(doc);
  }

  if (structured.topicsCovered.length > 0) {
    writeHeading(doc, WORKSHOP_REPORT_HEADINGS.topicsCovered);
    structured.topicsCovered.forEach((item, index) => writeBody(doc, `${index + 1}. ${item}`));
    writeRule(doc);
  }

  if (structured.scheduleSummary.length > 0) {
    writeHeading(doc, WORKSHOP_REPORT_HEADINGS.scheduleSummary);
    structured.scheduleSummary.forEach((item, index) => writeBody(doc, `${index + 1}. ${item}`));
    writeRule(doc);
  }

  if (structured.learningOutcomes.length > 0) {
    writeHeading(doc, WORKSHOP_REPORT_HEADINGS.learningOutcomes);
    writeBody(doc, labels.learningOutcomesLeadIn);
    structured.learningOutcomes.forEach((item, index) => writeBody(doc, `${index + 1}. ${item}`));
    writeRule(doc);
  }

  if (structured.keyHighlights.length > 0) {
    writeHeading(doc, WORKSHOP_REPORT_HEADINGS.keyHighlights);
    structured.keyHighlights.forEach((item, index) => writeBody(doc, `${index + 1}. ${item}`));
    writeRule(doc);
  }

  if (structured.benefits.length > 0) {
    writeHeading(doc, WORKSHOP_REPORT_HEADINGS.benefits);
    structured.benefits.forEach((item, index) => writeBody(doc, `${index + 1}. ${item}`));
    writeRule(doc);
  }

  if (structured.conclusion.length > 0) {
    writeHeading(doc, WORKSHOP_REPORT_HEADINGS.conclusion);
    structured.conclusion.forEach((paragraph) => writeBody(doc, paragraph));
    writeRule(doc);
  }

  if (structured.aiExecutiveSummary.trim()) {
    writeHeading(doc, WORKSHOP_REPORT_HEADINGS.aiExecutiveSummary);
    writeBody(doc, structured.aiExecutiveSummary);
    writeRule(doc);
  }

  const acknowledgement =
    structured.acknowledgement.length > 0
      ? structured.acknowledgement
      : [labels.defaultAcknowledgement(department)];

  writeHeading(doc, WORKSHOP_REPORT_HEADINGS.acknowledgement);
  acknowledgement.forEach((paragraph) => writeBody(doc, paragraph));
  writeRule(doc);

  if (images.length > 0) {
    writeHeading(doc, labels.photoGalleryHeading);
    writeImages(doc, images);
  }

  doc.end();
  await done;
  return Buffer.concat(chunks);
};
