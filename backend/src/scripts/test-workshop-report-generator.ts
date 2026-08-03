/**
 * Validates workshop report generator (template structure, normalizer, export builders).
 *
 * Run: npx tsx src/scripts/test-workshop-report-generator.ts
 */

import fs from 'fs/promises';
import path from 'path';
import {
  buildWorkshopReportFromGemini,
  composeWorkshopPreviewText,
} from '../report-generation/workshop/utils/workshop-report-normalizer.util';
import { normalizeAiEventReportResult } from '../ai/utils/ai-event-report-result.util';
import { buildWorkshopReportDocx } from '../report-generation/workshop/builders/workshop-report-docx.builder';
import { buildWorkshopReportPdf } from '../report-generation/workshop/builders/workshop-report-pdf.builder';
import { WORKSHOP_REPORT_SECTION_ORDER } from '../report-generation/workshop/workshop-report-template.config';
import { WorkshopReportGeneratorInput } from '../report-generation/workshop/workshop-report.types';

const results: Array<{ workflow: string; pass: boolean; detail?: string }> = [];

const assert = (workflow: string, pass: boolean, detail?: string): void => {
  results.push({ workflow, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}: ${workflow}${detail ? ` — ${detail}` : ''}`);
};

const sampleGeminiPayload = {
  reportType: 'Workshop',
  title: 'Artificial Intelligence and Machine Learning',
  department: 'Department of Computer Science and Engineering',
  date: '15 March 2026',
  time: '10:00 AM to 4:00 PM',
  venue: 'Seminar Hall, Block A',
  speaker: 'Dr. Rahul Sharma',
  organization: 'Infosys Limited',
  participants: 120,
  objectives: ['Understand AI fundamentals', 'Explore practical ML use cases'],
  learningOutcomes: ['Explain supervised learning concepts', 'Identify real-world AI applications'],
  keyHighlights: ['Interactive hands-on session', 'Industry expert delivery'],
  missingFields: ['headOfDepartment'],
  workshopReport: {
    departmentName: 'Department of Computer Science and Engineering',
    reportTitle: 'Workshop Report on Artificial Intelligence and Machine Learning',
    eventDetails: {
      title: 'Workshop on Artificial Intelligence and Machine Learning',
      organizedBy: 'Department of Computer Science and Engineering',
      resourcePerson: 'Dr. Rahul Sharma, Infosys Limited',
      venue: 'Seminar Hall, Block A',
      date: '15 March 2026',
      time: '10:00 AM to 4:00 PM',
      participants: '120',
    },
    introduction: [
      'The Department of Computer Science and Engineering organized a one-day workshop on Artificial Intelligence and Machine Learning to strengthen student awareness of emerging technologies.',
    ],
    objectives: ['Understand AI fundamentals', 'Explore practical ML use cases'],
    workshopProceedings: [
      'The workshop commenced with a welcome address followed by the technical session delivered by the resource person.',
    ],
    topicsCovered: ['Introduction to AI', 'Machine Learning workflow', 'Industry applications'],
    scheduleSummary: ['10:00 AM — Inauguration', '11:00 AM — Technical session'],
    learningOutcomes: ['Explain supervised learning concepts', 'Identify real-world AI applications'],
    keyHighlights: ['Interactive hands-on session'],
    benefits: ['Enhanced industry readiness among students'],
    conclusion: ['The workshop concluded successfully with active student participation.'],
    acknowledgement: ['The department acknowledges the support of faculty and students.'],
    aiExecutiveSummary:
      'A department workshop on AI and ML was conducted with 120 participants. The session covered fundamentals and applications with industry-led delivery.',
    imagePlacements: [
      {
        imageReference: 'Image 1',
        section: 'introduction',
        caption: 'Workshop banner displayed at the venue entrance',
      },
      {
        imageReference: 'Image 2',
        section: 'workshopProceedings',
        caption: 'Resource person addressing the participants',
      },
    ],
  },
};

const main = async (): Promise<void> => {
  console.log('=== Workshop Report Generator Validation ===\n');

  assert(
    'Template section order includes required blocks',
    WORKSHOP_REPORT_SECTION_ORDER.includes('eventDetails') &&
      WORKSHOP_REPORT_SECTION_ORDER.includes('aiExecutiveSummary') &&
      WORKSHOP_REPORT_SECTION_ORDER.includes('evidenceGallery'),
  );

  const structured = buildWorkshopReportFromGemini(sampleGeminiPayload);
  assert('Structured report has event details', Boolean(structured.eventDetails.title));
  assert('Structured report preserves objectives', structured.objectives.length === 2);
  assert('Image placements normalized', structured.imagePlacements.length === 2);
  assert(
    'Image placement section assigned',
    structured.imagePlacements[0]?.section === 'introduction',
  );

  const preview = composeWorkshopPreviewText(structured);
  assert('Preview includes Event Details block', preview.includes('Event Details :'));
  assert('Preview includes Introduction heading', preview.includes('Introduction'));

  const normalized = normalizeAiEventReportResult(sampleGeminiPayload);
  assert('Normalizer attaches workshopReportStructured', Boolean(normalized.workshopReportStructured));
  assert(
    'Normalizer uses structured preview for workshops',
    normalized.aiGeneratedReport.includes('Workshop Proceedings'),
  );

  const input: WorkshopReportGeneratorInput = {
    structured,
    media: [
      {
        type: 'image',
        url: 'https://example.com/banner.jpg',
        label: 'Image 1',
        caption: 'Workshop banner',
        uploadedAt: new Date(),
      },
      {
        type: 'image',
        url: 'https://example.com/session.jpg',
        label: 'Image 2',
        caption: 'Speaker session',
        uploadedAt: new Date(),
      },
    ],
    collegeName: 'AccrediAssist College of Engineering',
    defaultDepartment: 'Department of Computer Science and Engineering',
    generatedAt: new Date(),
  };

  const images = input.media.map((item) => ({
    label: item.label,
    url: item.url,
    caption: item.caption ?? item.label,
    section: item.label === 'Image 1' ? ('introduction' as const) : ('workshopProceedings' as const),
  }));

  const [docxBuffer, pdfBuffer] = await Promise.all([
    buildWorkshopReportDocx(input, images),
    buildWorkshopReportPdf(input, images),
  ]);

  assert('DOCX buffer generated', docxBuffer.length > 1000, `${docxBuffer.length} bytes`);
  assert('PDF buffer generated', pdfBuffer.length > 1000, `${pdfBuffer.length} bytes`);

  const outputDir = path.join(process.cwd(), 'exports', 'workshop-test');
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(path.join(outputDir, 'sample-workshop-report.docx'), docxBuffer);
  await fs.writeFile(path.join(outputDir, 'sample-workshop-report.pdf'), pdfBuffer);
  assert('Sample exports written to exports/workshop-test', true);

  const failed = results.filter((item) => !item.pass);
  console.log('\n=== Final Testing Report ===');
  console.log(`Total workflows: ${results.length}`);
  console.log(`PASS: ${results.length - failed.length}`);
  console.log(`FAIL: ${failed.length}`);

  if (failed.length > 0) {
    failed.forEach((item) => console.log(`- ${item.workflow}${item.detail ? `: ${item.detail}` : ''}`));
    process.exit(1);
  }

  console.log('\nAll workshop generator workflows passed.');
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
