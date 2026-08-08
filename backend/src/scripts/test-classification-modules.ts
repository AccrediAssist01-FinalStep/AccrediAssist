/**
 * Deterministic classification checks for every ERP module (text + PDF routing).
 * Run: npx tsx src/scripts/test-classification-modules.ts
 */

import { correctClassificationForExtraction } from '../ai/utils/classification-correction.util';
import { mapClassificationToRecordCategory } from '../ai/utils/category-mapper.util';
import {
  inferCategoryFromEventReport,
  resolvePipelineRoute,
  shouldStartEventReportSession,
} from '../ai/utils/event-routing.util';
import {
  mapPdfCategoryToRecordCategory,
  resolveRecordCategoryWithPdf,
} from '../ai/utils/pdf-document-mapper.util';
import { resolveActivityClassification } from '../ai/utils/activity-module.util';
import { WhatsAppIncomingMessage } from '../whatsapp/types';
import { PdfDocumentExtractionResult } from '../ai/interfaces/pdf-document.interface';

type CaseResult = { label: string; pass: boolean; detail?: string };

const results: CaseResult[] = [];
const assert = (label: string, pass: boolean, detail?: string) => {
  results.push({ label, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}: ${label}${detail ? ` — ${detail}` : ''}`);
};

const msg = (
  text: string,
  mediaType?: 'pdf' | 'image',
  fileName?: string,
): WhatsAppIncomingMessage => ({
  groupName: 'Final Step',
  sender: 'Coordinator',
  message: text,
  timestamp: new Date(),
  media: mediaType ? 'https://example.com/media' : null,
  mediaMetadata: mediaType
    ? {
        mediaType,
        mimeType: mediaType === 'pdf' ? 'application/pdf' : 'image/jpeg',
        fileName: fileName ?? (mediaType === 'pdf' ? 'document.pdf' : 'photo.jpg'),
        fileSize: 1000,
        tempFileId: 'test',
        downloadedAt: new Date(),
        secureUrl: 'https://example.com/media',
      }
    : null,
});

const resolveCategory = (
  classification: string,
  extracted: Record<string, unknown>,
  message: string,
) => {
  const corrected = correctClassificationForExtraction(
    { category: classification as never, confidence: 95, reasoning: null },
    extracted as never,
    message,
  );
  return {
    corrected: corrected.category,
    recordCategory: mapClassificationToRecordCategory(corrected.category, extracted as never),
  };
};

console.log('=== Module Classification Matrix ===\n');

const textModules: Array<{
  label: string;
  text: string;
  geminiCategory: string;
  extracted: Record<string, unknown>;
  expectedRecord: string;
  expectedModule: string;
}> = [
  {
    label: 'Placement',
    text: 'Rahul Patil secured placement at Infosys as Software Engineer with 6 LPA.',
    geminiCategory: 'Placement',
    extracted: { studentNames: ['Rahul Patil'], company: 'Infosys', title: 'Placement at Infosys' },
    expectedRecord: 'Placement',
    expectedModule: 'Student Activities',
  },
  {
    label: 'Internship',
    text: 'Ananya Deshmukh completed summer internship at TCS Digital.',
    geminiCategory: 'Internship',
    extracted: { studentNames: ['Ananya Deshmukh'], company: 'TCS Digital' },
    expectedRecord: 'Internship',
    expectedModule: 'Student Activities',
  },
  {
    label: 'Publication (Faculty)',
    text: 'Dr. Meera Joshi published research paper in IEEE Transactions.',
    geminiCategory: 'Publication',
    extracted: {
      facultyNames: ['Dr. Meera Joshi'],
      publicationTitle: 'IEEE paper',
      title: 'IEEE publication',
    },
    expectedRecord: 'Publication',
    expectedModule: 'Faculty Activities',
  },
  {
    label: 'Patent',
    text: 'Dr. Ananya Kulkarni filed patent for AI healthcare system.',
    geminiCategory: 'Patent',
    extracted: { facultyNames: ['Dr. Ananya Kulkarni'], patentTitle: 'AI healthcare' },
    expectedRecord: 'Patent',
    expectedModule: 'Faculty Activities',
  },
  {
    label: 'Sports',
    text: 'Arjun Kulkarni won first prize in Inter-Collegiate Badminton Championship.',
    geminiCategory: 'Student Achievement',
    extracted: { studentNames: ['Arjun Kulkarni'], achievementType: 'Sports', title: 'Badminton' },
    expectedRecord: 'Sports',
    expectedModule: 'Student Activities',
  },
  {
    label: 'Research (Student text)',
    text: 'Student Research Achievement: Ms. Aditi Sharma published paper in International Journal.',
    geminiCategory: 'Student Achievement',
    extracted: {
      studentNames: ['Aditi Sharma'],
      title: 'Student Research Achievement: Aditi Sharma',
      description: 'Final-year student published research paper',
      publicationTitle: 'International Journal paper',
    },
    expectedRecord: 'Research',
    expectedModule: 'Student Activities',
  },
  {
    label: 'Certification',
    text: 'Priya Deshmukh completed AWS Cloud Practitioner certification.',
    geminiCategory: 'Student Achievement',
    extracted: {
      studentNames: ['Priya Deshmukh'],
      achievementType: 'Certification',
      title: 'AWS Cloud Practitioner',
    },
    expectedRecord: 'Certification',
    expectedModule: 'Student Activities',
  },
  {
    label: 'Sponsored Project',
    text: 'Prof. Rahul Sharma received a ₹5 lakh sponsored research project from XYZ Technologies.',
    geminiCategory: 'Faculty Achievement',
    extracted: {
      facultyNames: ['Prof. Rahul Sharma'],
      title: 'Sponsored research project',
      organization: 'XYZ Technologies',
      achievementType: 'Research',
    },
    expectedRecord: 'Faculty Achievement',
    expectedModule: 'Faculty Activities',
  },
  {
    label: 'Workshop Attended (Faculty)',
    text: 'Prof. Sneha Kulkarni attended a 3-day workshop on Generative AI organized by IIT Bombay.',
    geminiCategory: 'Workshop Attended',
    extracted: {
      facultyNames: ['Prof. Sneha Kulkarni'],
      workshopTitle: 'Generative AI Workshop',
      organization: 'IIT Bombay',
      duration: '3-day',
    },
    expectedRecord: 'Workshop Attended',
    expectedModule: 'Faculty Activities',
  },
  {
    label: 'Legacy Faculty Award (Needs Review)',
    text: 'Dr. Siddhi Patil received Best Paper Award at International Conference.',
    geminiCategory: 'Faculty Achievement',
    extracted: { facultyNames: ['Dr. Siddhi Patil'], title: 'Best Paper Award' },
    expectedRecord: 'Faculty Achievement',
    expectedModule: 'Faculty Activities',
  },
  {
    label: 'Workshop (Department)',
    text: 'Department conducted Workshop on Cloud Computing for CSE students.',
    geminiCategory: 'Completed Event Report',
    extracted: { eventName: 'Cloud Computing Workshop', eventType: 'Workshop' },
    expectedRecord: 'Workshop',
    expectedModule: 'Department Activities',
  },
  {
    label: 'Industrial Visit',
    text: 'Department Industry Visit Report to Tata Motors Pune completed.',
    geminiCategory: 'Completed Event Report',
    extracted: { eventType: 'Industrial Visit', title: 'Industry Visit Tata Motors' },
    expectedRecord: 'Industrial Visit',
    expectedModule: 'Department Activities',
  },
];

for (const test of textModules) {
  const { corrected, recordCategory } = resolveCategory(
    test.geminiCategory,
    test.extracted,
    test.text,
  );
  const activity = resolveActivityClassification(recordCategory, test.extracted as never, test.text);
  const pass =
    recordCategory === test.expectedRecord && activity.module === test.expectedModule;
  assert(
    `Text → ${test.label}`,
    pass,
    `corrected=${corrected}, record=${recordCategory}, module=${activity.module}/${activity.subCategory}`,
  );
}

const routingCases: Array<{ label: string; message: WhatsAppIncomingMessage; route: string }> = [
  {
    label: 'Placement offer PDF',
    message: msg('', 'pdf', 'Placement_Offer_Letter_Rahul_Patil.pdf'),
    route: 'standard',
  },
  {
    label: 'Student research PDF',
    message: msg('', 'pdf', 'Student_Research_Paper_Achievement.pdf'),
    route: 'standard',
  },
  {
    label: 'Industrial visit PDF',
    message: msg('Industrial visit schedule to Bharat Forge', 'pdf'),
    route: 'event-session',
  },
  {
    label: 'Faculty workshop certificate PDF',
    message: msg('Prof. Sneha Kulkarni workshop participation certificate', 'pdf', 'workshop_certificate.pdf'),
    route: 'standard',
  },
  {
    label: 'Workshop brochure PDF (department)',
    message: msg('Department organized workshop brochure attached', 'pdf', 'workshop_brochure.pdf'),
    route: 'event-session',
  },
  {
    label: 'Random faculty photograph',
    message: msg('', 'image', 'faculty_photo.jpg'),
    route: 'standard',
  },
];

for (const test of routingCases) {
  const route = resolvePipelineRoute(test.message, false);
  assert(`Route → ${test.label}`, route === test.route, `got ${route}`);
}

const studentResearchPdf: PdfDocumentExtractionResult = {
  documentType: 'Publication',
  extractedText: 'STUDENT RESEARCH ACHIEVEMENT\nStudent: Mr. Yash Malhotra',
  summary: 'Mr. Yash Malhotra published research paper in journal',
  suggestedCategory: 'Publication',
  studentName: 'Mr. Yash Malhotra',
  facultyName: null,
  company: null,
  organization: 'Department of AIML',
  eventName: null,
  date: '2026-07-15',
  department: 'AIML',
  achievement: 'Research publication',
  title: 'Student Research Achievement: Explainable AI for Crop Diseases',
  confidence: 100,
};

const pdfCategory = mapPdfCategoryToRecordCategory(studentResearchPdf);
assert('PDF → Student research publication maps to Research', pdfCategory === 'Research');

const extracted = {
  studentNames: ['Yash Malhotra'],
  title: studentResearchPdf.title,
  description: studentResearchPdf.summary,
  publicationTitle: studentResearchPdf.title,
  achievementType: 'Research',
};

const corrected = correctClassificationForExtraction(
  { category: 'Student Achievement', confidence: 95, reasoning: null },
  extracted as never,
  '[WhatsApp pdf attachment]',
);
assert(
  'Correction → Student Achievement not overridden to Publication',
  corrected.category === 'Student Achievement',
  `got ${corrected.category}`,
);

const finalCategory = resolveRecordCategoryWithPdf(
  mapClassificationToRecordCategory('Student Achievement', extracted as never),
  'Student Achievement',
  extracted as never,
  studentResearchPdf,
);
assert(
  'Final record → Student research PDF resolves to Research',
  finalCategory === 'Research',
  `got ${finalCategory}`,
);

const eventFallback = inferCategoryFromEventReport({
  reportType: 'Student Achievement Report',
  title: 'Student Research Achievement: Publication in Journal',
  summary: 'Ms. Aditi Sharma published research paper',
});
assert(
  'Event fallback → Student achievement report maps to Research',
  eventFallback === 'Research',
  `got ${eventFallback}`,
);

const passed = results.filter((r) => r.pass).length;
console.log(`\n=== Summary: ${passed}/${results.length} PASS ===`);
process.exit(passed === results.length ? 0 : 1);
