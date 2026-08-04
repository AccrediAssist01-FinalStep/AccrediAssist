import {
  AlignmentType,
  Document,
  ImageRun,
  Packer,
  Paragraph,
  TextRun,
} from 'docx';
import {
  WORKSHOP_EVENT_DETAIL_LABELS,
  WORKSHOP_REPORT_HEADINGS,
  WORKSHOP_REPORT_TYPOGRAPHY,
} from '../workshop-report-template.config';
import { unavailableOr } from '../utils/workshop-report-normalizer.util';
import { getEventReportLabels } from '../utils/event-report-labels.util';
import {
  ResolvedWorkshopImage,
  WorkshopReportGeneratorInput,
  WorkshopReportStructuredContent,
} from '../workshop-report.types';

const FONT = WORKSHOP_REPORT_TYPOGRAPHY.fontFamily;

const centeredHeading = (text: string, size: number): Paragraph =>
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 200, line: WORKSHOP_REPORT_TYPOGRAPHY.lineSpacing },
    children: [new TextRun({ text, font: FONT, size, bold: true })],
  });

const sectionHeading = (text: string): Paragraph =>
  new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { before: 200, after: 120, line: WORKSHOP_REPORT_TYPOGRAPHY.lineSpacing },
    children: [
      new TextRun({
        text,
        font: FONT,
        size: WORKSHOP_REPORT_TYPOGRAPHY.sectionHeadingSize,
        bold: true,
      }),
    ],
  });

const bodyParagraph = (text: string): Paragraph =>
  new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 120, line: WORKSHOP_REPORT_TYPOGRAPHY.lineSpacing },
    children: [new TextRun({ text, font: FONT, size: WORKSHOP_REPORT_TYPOGRAPHY.bodySize })],
  });

const labeledDetail = (label: string, value: string): Paragraph =>
  new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 80, line: WORKSHOP_REPORT_TYPOGRAPHY.lineSpacing },
    children: [
      new TextRun({ text: label, font: FONT, size: WORKSHOP_REPORT_TYPOGRAPHY.bodySize, bold: true }),
      new TextRun({ text: ` ${value}`, font: FONT, size: WORKSHOP_REPORT_TYPOGRAPHY.bodySize }),
    ],
  });

const bulletParagraph = (text: string, index: number): Paragraph =>
  new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 80, line: WORKSHOP_REPORT_TYPOGRAPHY.lineSpacing },
    children: [
      new TextRun({ text: `${index}. ${text}`, font: FONT, size: WORKSHOP_REPORT_TYPOGRAPHY.bodySize }),
    ],
  });

const horizontalRule = (): Paragraph =>
  new Paragraph({
    spacing: { before: 120, after: 120 },
    border: { bottom: { color: 'A0A0A0', space: 1, style: 'single', size: 6 } },
    children: [new TextRun({ text: '' })],
  });

const imageParagraphs = (image: ResolvedWorkshopImage): Paragraph[] => {
  const items: Paragraph[] = [];
  if (image.bytes?.length) {
    items.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 120, after: 80 },
        children: [
          new ImageRun({
            data: image.bytes,
            transformation: { width: 450, height: 280 },
          }),
        ],
      }),
    );
  }
  items.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 160 },
      children: [
        new TextRun({
          text: image.caption,
          font: FONT,
          size: WORKSHOP_REPORT_TYPOGRAPHY.bodySize,
          italics: true,
        }),
      ],
    }),
  );
  return items;
};

const buildEventDetails = (structured: WorkshopReportStructuredContent): Paragraph[] => {
  const details = structured.eventDetails;
  return [
    sectionHeading(WORKSHOP_REPORT_HEADINGS.eventDetails),
    labeledDetail(WORKSHOP_EVENT_DETAIL_LABELS.title, unavailableOr(details.title)),
    labeledDetail(WORKSHOP_EVENT_DETAIL_LABELS.organizedBy, unavailableOr(details.organizedBy)),
    labeledDetail(WORKSHOP_EVENT_DETAIL_LABELS.resourcePerson, unavailableOr(details.resourcePerson)),
    labeledDetail(WORKSHOP_EVENT_DETAIL_LABELS.headOfDepartment, unavailableOr(details.headOfDepartment)),
    labeledDetail(WORKSHOP_EVENT_DETAIL_LABELS.venue, unavailableOr(details.venue)),
    labeledDetail(WORKSHOP_EVENT_DETAIL_LABELS.date, unavailableOr(details.date)),
    labeledDetail(WORKSHOP_EVENT_DETAIL_LABELS.time, unavailableOr(details.time)),
    labeledDetail(WORKSHOP_EVENT_DETAIL_LABELS.participants, unavailableOr(details.participants)),
    horizontalRule(),
  ];
};

export const buildWorkshopReportDocx = async (
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

  const children: Paragraph[] = [
    centeredHeading(department, WORKSHOP_REPORT_TYPOGRAPHY.departmentSize),
    centeredHeading(title, WORKSHOP_REPORT_TYPOGRAPHY.titleSize),
    horizontalRule(),
    ...buildEventDetails(structured),
  ];

  if (structured.introduction.length > 0) {
    children.push(sectionHeading(WORKSHOP_REPORT_HEADINGS.introduction));
    structured.introduction.forEach((paragraph) => children.push(bodyParagraph(paragraph)));
    horizontalRule();
  }

  if (structured.objectives.length > 0) {
    children.push(sectionHeading(WORKSHOP_REPORT_HEADINGS.objectives));
    children.push(bodyParagraph(labels.objectivesLeadIn));
    structured.objectives.forEach((item, index) => children.push(bulletParagraph(item, index + 1)));
    horizontalRule();
  }

  if (structured.workshopProceedings.length > 0) {
    children.push(sectionHeading(labels.proceedingsHeading));
    structured.workshopProceedings.forEach((paragraph) => children.push(bodyParagraph(paragraph)));
    horizontalRule();
  }

  if (structured.topicsCovered.length > 0) {
    children.push(sectionHeading(WORKSHOP_REPORT_HEADINGS.topicsCovered));
    structured.topicsCovered.forEach((item, index) => children.push(bulletParagraph(item, index + 1)));
    horizontalRule();
  }

  if (structured.scheduleSummary.length > 0) {
    children.push(sectionHeading(WORKSHOP_REPORT_HEADINGS.scheduleSummary));
    structured.scheduleSummary.forEach((item, index) => children.push(bulletParagraph(item, index + 1)));
    horizontalRule();
  }

  if (structured.learningOutcomes.length > 0) {
    children.push(sectionHeading(WORKSHOP_REPORT_HEADINGS.learningOutcomes));
    children.push(bodyParagraph(labels.learningOutcomesLeadIn));
    structured.learningOutcomes.forEach((item, index) => children.push(bulletParagraph(item, index + 1)));
    horizontalRule();
  }

  if (structured.keyHighlights.length > 0) {
    children.push(sectionHeading(WORKSHOP_REPORT_HEADINGS.keyHighlights));
    structured.keyHighlights.forEach((item, index) => children.push(bulletParagraph(item, index + 1)));
    horizontalRule();
  }

  if (structured.benefits.length > 0) {
    children.push(sectionHeading(WORKSHOP_REPORT_HEADINGS.benefits));
    structured.benefits.forEach((item, index) => children.push(bulletParagraph(item, index + 1)));
    horizontalRule();
  }

  if (structured.conclusion.length > 0) {
    children.push(sectionHeading(WORKSHOP_REPORT_HEADINGS.conclusion));
    structured.conclusion.forEach((paragraph) => children.push(bodyParagraph(paragraph)));
    horizontalRule();
  }

  if (structured.aiExecutiveSummary.trim()) {
    children.push(sectionHeading(WORKSHOP_REPORT_HEADINGS.aiExecutiveSummary));
    children.push(bodyParagraph(structured.aiExecutiveSummary));
    horizontalRule();
  }

  const acknowledgement =
    structured.acknowledgement.length > 0
      ? structured.acknowledgement
      : [labels.defaultAcknowledgement(department)];

  children.push(sectionHeading(WORKSHOP_REPORT_HEADINGS.acknowledgement));
  acknowledgement.forEach((paragraph) => children.push(bodyParagraph(paragraph)));
  horizontalRule();

  if (images.length > 0) {
    children.push(sectionHeading(labels.photoGalleryHeading));
    images.forEach((image) => {
      imageParagraphs(image).forEach((paragraph) => children.push(paragraph));
    });
  }

  const document = new Document({
    sections: [
      {
        properties: { page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
        children,
      },
    ],
  });

  return Packer.toBuffer(document);
};
