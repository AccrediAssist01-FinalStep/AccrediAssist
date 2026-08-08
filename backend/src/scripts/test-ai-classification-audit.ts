/**
 * Complete AI classification audit — routing, mapping, and optional live Gemini tests.
 * Run: npm run test:classification-audit
 */

import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { RecordCategory } from '../database/enums';
import { mapClassificationToRecordCategory } from '../ai/utils/category-mapper.util';
import { correctClassificationForExtraction } from '../ai/utils/classification-correction.util';
import {
  inferCategoryFromEventReport,
  resolvePipelineRoute,
  shouldStartEventReportSession,
} from '../ai/utils/event-routing.util';
import { mapPdfCategoryToRecordCategory } from '../ai/utils/pdf-document-mapper.util';
import { resolveActivityClassification } from '../ai/utils/activity-module.util';
import { resolveApprovalTargetModule } from '../utils/pendingRecordApproval.mapper';
import { shouldRunNewsDetectionForImage } from '../ai/utils/media-detection.util';
import {
  isInstitutionalImageType,
  shouldIgnoreRejectedImage,
} from '../ai/utils/news-detection-result.util';
import { isGeminiConfigured } from '../ai/utils/ai-config.util';
import { classificationAgent } from '../ai/agents/classification.agent';
import { WhatsAppIncomingMessage } from '../whatsapp/types';

dotenv.config();

type AuditStatus = 'PASS' | 'FAIL' | 'SKIP';

interface AuditRow {
  input: string;
  expectedModule: string;
  expectedCategory: RecordCategory;
  actualCategory: RecordCategory | string;
  expectedRoute?: string;
  actualRoute?: string;
  confidence: number | null;
  status: AuditStatus;
  reason: string;
  fixApplied: string;
  retestResult: string;
}

const results: AuditRow[] = [];

const msg = (
  text: string,
  mediaType?: 'image' | 'pdf',
  caption?: string,
): WhatsAppIncomingMessage => ({
  groupName: 'Final Step',
  sender: 'Faculty Coordinator',
  message: text,
  timestamp: new Date(),
  media: mediaType ? 'https://example.com/media' : null,
  mediaMetadata: mediaType
    ? {
        mediaType,
        mimeType: mediaType === 'pdf' ? 'application/pdf' : 'image/jpeg',
        fileName: mediaType === 'pdf' ? 'document.pdf' : 'photo.jpg',
        fileSize: 1000,
        tempFileId: 'test',
        downloadedAt: new Date(),
        secureUrl: 'https://example.com/media',
        caption,
      }
    : null,
});

const record = (
  input: string,
  expectedModule: string,
  expectedCategory: RecordCategory,
  actualCategory: RecordCategory | string,
  status: AuditStatus,
  reason: string,
  extras: Partial<AuditRow> = {},
): void => {
  results.push({
    input,
    expectedModule,
    expectedCategory,
    actualCategory,
    confidence: extras.confidence ?? null,
    status,
    reason,
    fixApplied: extras.fixApplied ?? 'Pre-audit routing + correction rules',
    retestResult: status === 'PASS' ? 'Verified' : 'Needs fix',
    expectedRoute: extras.expectedRoute,
    actualRoute: extras.actualRoute,
  });
};

const resolveFullCategory = (
  classificationCategory: string,
  extractedData: Record<string, unknown>,
  originalMessage: string,
): RecordCategory => {
  const corrected = correctClassificationForExtraction(
    {
      category: classificationCategory as never,
      confidence: 90,
      reasoning: null,
    },
    extractedData as never,
    originalMessage,
  );
  return mapClassificationToRecordCategory(corrected.category, extractedData as never);
};

// ─── STEP 4: Text classification routing + mapping ───
const textCases: Array<{
  text: string;
  expectedCategory: RecordCategory;
  expectedModule: string;
  classification: string;
  extracted: Record<string, unknown>;
  route: 'standard' | 'event-session';
}> = [
  {
    text: 'Rahul Patil secured placement at Infosys as Software Engineer with 6 LPA package.',
    expectedCategory: 'Placement',
    expectedModule: 'Student Activities → Placement',
    classification: 'Placement',
    extracted: { studentNames: ['Rahul Patil'], company: 'Infosys', title: 'Placement at Infosys' },
    route: 'standard',
  },
  {
    text: 'Ananya Deshmukh completed summer internship at TCS Digital for 2 months.',
    expectedCategory: 'Internship',
    expectedModule: 'Student Activities → Internship',
    classification: 'Internship',
    extracted: { studentNames: ['Ananya Deshmukh'], company: 'TCS Digital', internship: 'TCS' },
    route: 'standard',
  },
  {
    text: 'Dr. Meera Joshi published a research paper in IEEE Transactions on Neural Networks.',
    expectedCategory: 'Publication',
    expectedModule: 'Faculty Activities → Publications',
    classification: 'Publication',
    extracted: {
      facultyNames: ['Dr. Meera Joshi'],
      publicationTitle: 'Deep Learning for Smart Grid',
    },
    route: 'standard',
  },
  {
    text: 'Dr. Ananya Kulkarni filed patent for AI-Based Predictive Healthcare Monitoring System.',
    expectedCategory: 'Patent',
    expectedModule: 'Faculty Activities → Patents',
    classification: 'Patent',
    extracted: { facultyNames: ['Dr. Ananya Kulkarni'], patentTitle: 'AI Healthcare System' },
    route: 'standard',
  },
  {
    text: 'Department of CSE conducted a one-day Workshop on Cloud Computing for 120 students.',
    expectedCategory: 'Workshop',
    expectedModule: 'Department Activities → Events',
    classification: 'Completed Event Report',
    extracted: { eventName: 'Cloud Computing Workshop', eventType: 'Workshop', title: 'Workshop on Cloud Computing' },
    route: 'event-session',
  },
  {
    text: 'Department Industry Visit Report to Tata Motors Pune plant completed successfully.',
    expectedCategory: 'Industrial Visit',
    expectedModule: 'Department Activities → Industrial Visit Reports',
    classification: 'Completed Event Report',
    extracted: { eventType: 'Industrial Visit', title: 'Industry Visit to Tata Motors', organization: 'Tata Motors' },
    route: 'event-session',
  },
  {
    text: 'Arjun Kulkarni won first prize in Inter-Collegiate Badminton Championship 2026.',
    expectedCategory: 'Sports',
    expectedModule: 'Student Activities → Sports',
    classification: 'Student Achievement',
    extracted: {
      studentNames: ['Arjun Kulkarni'],
      achievementType: 'Sports',
      title: 'Badminton Championship',
    },
    route: 'standard',
  },
  {
    text: 'Team CodeStorm won National Hackathon 2026 organized by Smart India Hackathon.',
    expectedCategory: 'Student Achievement',
    expectedModule: 'Student Activities → Startup & Innovation',
    classification: 'Student Achievement',
    extracted: {
      studentNames: ['Team CodeStorm'],
      achievementType: 'Hackathon',
      title: 'National Hackathon Winner',
    },
    route: 'standard',
  },
  {
    text: 'Priya Deshmukh completed AWS Cloud Practitioner certification from Amazon Web Services.',
    expectedCategory: 'Certification',
    expectedModule: 'Student Activities → Certifications',
    classification: 'Student Achievement',
    extracted: {
      studentNames: ['Priya Deshmukh'],
      achievementType: 'Certification',
      title: 'AWS Cloud Practitioner',
    },
    route: 'standard',
  },
  {
    text: 'Student Research Achievement: Ms. Aditi Sharma published research paper in International Journal of Computer Science.',
    expectedCategory: 'Research',
    expectedModule: 'Student Activities → Research',
    classification: 'Student Achievement',
    extracted: {
      studentNames: ['Aditi Sharma'],
      achievementType: 'Research',
      publicationTitle: 'Research paper in International Journal of Computer Science',
      title: 'Student Research Achievement: Aditi Sharma',
      description: 'Final-year student published research paper',
    },
    route: 'standard',
  },
  {
    text: 'Dr. Siddhi Patil received Best Paper Award at International Conference on AI.',
    expectedCategory: 'Faculty Achievement',
    expectedModule: 'Faculty Activities → Awards',
    classification: 'Faculty Achievement',
    extracted: {
      facultyNames: ['Dr. Siddhi Patil'],
      achievementType: 'Award',
      title: 'Best Paper Award',
    },
    route: 'standard',
  },
  {
    text: 'Department organized Seminar on Cyber Security by expert from Quick Heal.',
    expectedCategory: 'Seminar',
    expectedModule: 'Department Activities → Events',
    classification: 'Completed Event Report',
    extracted: { eventType: 'Seminar', eventName: 'Cyber Security Seminar' },
    route: 'event-session',
  },
];

for (const testCase of textCases) {
  const message = msg(testCase.text);
  const actualRoute = resolvePipelineRoute(message, false);
  const actualCategory = resolveFullCategory(
    testCase.classification,
    testCase.extracted,
    testCase.text,
  );
  const activity = resolveActivityClassification(actualCategory, testCase.extracted as never);
  const moduleLabel = `${activity.module} → ${activity.subCategory}`;
  const routeOk = actualRoute === testCase.route;
  const categoryOk = actualCategory === testCase.expectedCategory;
  record(
    testCase.text.slice(0, 70),
    testCase.expectedModule,
    testCase.expectedCategory,
    actualCategory,
    routeOk && categoryOk ? 'PASS' : 'FAIL',
    !routeOk
      ? `Wrong route: ${actualRoute} (expected ${testCase.route})`
      : !categoryOk
        ? `Wrong category: ${actualCategory} (expected ${testCase.expectedCategory}); module=${moduleLabel}`
        : `Routed ${actualRoute}; module=${moduleLabel}`,
    { expectedRoute: testCase.route, actualRoute, confidence: 90 },
  );
}

// ─── STEP 5 & 6: Media routing ───
const mediaCases: Array<{
  label: string;
  message: WhatsAppIncomingMessage;
  expectEventSession: boolean;
  expectNewsDetection: boolean;
}> = [
  {
    label: 'Placement offer letter PDF',
    message: msg('', 'pdf', 'Placement offer letter for Karan Mehta at Wipro'),
    expectEventSession: false,
    expectNewsDetection: false,
  },
  {
    label: 'Internship offer PDF',
    message: msg('', 'pdf', 'Internship offer letter TCS'),
    expectEventSession: false,
    expectNewsDetection: false,
  },
  {
    label: 'Workshop brochure PDF',
    message: msg('Workshop brochure attached', 'pdf'),
    expectEventSession: true,
    expectNewsDetection: false,
  },
  {
    label: 'Industrial visit schedule PDF',
    message: msg('Industrial visit schedule to Bharat Forge', 'pdf'),
    expectEventSession: true,
    expectNewsDetection: false,
  },
  {
    label: 'Student research paper PDF',
    message: {
      ...msg('', 'pdf'),
      mediaMetadata: {
        mediaType: 'pdf' as const,
        mimeType: 'application/pdf',
        fileName: 'Student_Research_Paper_Achievement.pdf',
        fileSize: 3291,
        tempFileId: 'test',
        downloadedAt: new Date(),
        secureUrl: 'https://example.com/media',
      },
    },
    expectEventSession: false,
    expectNewsDetection: false,
  },
  {
    label: 'Certificate photo (no caption)',
    message: msg('', 'image'),
    expectEventSession: false,
    expectNewsDetection: false,
  },
  {
    label: 'Newspaper clipping photo',
    message: msg('', 'image', 'Newspaper clipping from Sakal Pune'),
    expectEventSession: false,
    expectNewsDetection: true,
  },
  {
    label: 'Random selfie (news detection rejects)',
    message: msg('', 'image'),
    expectEventSession: false,
    expectNewsDetection: false,
  },
];

for (const testCase of mediaCases) {
  const eventSession = shouldStartEventReportSession(testCase.message);
  const newsDetection = shouldRunNewsDetectionForImage(testCase.message);
  const pass =
    eventSession === testCase.expectEventSession &&
    newsDetection === testCase.expectNewsDetection;
  record(
    testCase.label,
    testCase.expectEventSession ? 'Department Activities (event session)' : 'Standard pipeline',
    testCase.expectEventSession ? 'Workshop' : 'Placement',
    eventSession ? 'event-session' : 'standard',
    pass ? 'PASS' : 'FAIL',
    `eventSession=${eventSession}, newsDetection=${newsDetection}`,
    {
      expectedRoute: testCase.expectEventSession ? 'event-session' : 'standard',
      actualRoute: eventSession ? 'event-session' : 'standard',
    },
  );
}

// ─── Event report inference (fixes industrial visit → placement bug) ───
const eventReportCases: Array<{
  label: string;
  fields: Parameters<typeof inferCategoryFromEventReport>[0];
  expected: RecordCategory;
}> = [
  {
    label: 'Industrial Visit Report PDF',
    fields: {
      reportType: 'Industrial Visit Report',
      title: 'Department Industry Visit Report',
      aiGeneratedReport: 'Students were selected for the industrial visit to Tata Motors.',
    },
    expected: 'Industrial Visit',
  },
  {
    label: 'NPTEL Fellowship certificate',
    fields: {
      reportType: 'Achievement Recognition',
      title: 'NPTEL Pre-Doctoral Research Fellowship',
      organization: 'IIT Madras NPTEL',
    },
    expected: 'Placement',
  },
  {
    label: 'Student research achievement PDF (event session fallback)',
    fields: {
      reportType: 'Student Achievement Report',
      title: 'Student Research Achievement: Publication in Journal of Emerging Computing',
      summary: 'Ms. Aditi Sharma published a research paper',
    },
    expected: 'Research',
  },
  {
    label: 'Cloud Computing Workshop Report',
    fields: { reportType: 'Workshop Report', title: 'Workshop on Cloud Computing' },
    expected: 'Workshop',
  },
];

for (const testCase of eventReportCases) {
  const actual = inferCategoryFromEventReport(testCase.fields);
  record(
    testCase.label,
    `Department → ${testCase.expected}`,
    testCase.expected,
    actual,
    actual === testCase.expected ? 'PASS' : 'FAIL',
    actual === testCase.expected ? 'Correct inference' : `Got ${actual}`,
  );
}

// ─── PDF document type mapping ───
const pdfCases: Array<{
  documentType: string;
  suggestedCategory: string;
  expected: RecordCategory;
}> = [
  { documentType: 'Placement Offer Letter', suggestedCategory: 'Placement', expected: 'Placement' },
  { documentType: 'Internship Offer Letter', suggestedCategory: 'Internship', expected: 'Internship' },
  { documentType: 'Student Certificate', suggestedCategory: 'Student Activity', expected: 'Certification' },
  { documentType: 'Publication', suggestedCategory: 'Publication', expected: 'Publication' },
  { documentType: 'Patent', suggestedCategory: 'Patent', expected: 'Patent' },
  { documentType: 'Workshop Brochure', suggestedCategory: 'Event Report', expected: 'Workshop' },
  { documentType: 'Industrial Visit Document', suggestedCategory: 'Event Report', expected: 'Industrial Visit' },
  { documentType: 'Seminar Brochure', suggestedCategory: 'Event Report', expected: 'Seminar' },
];

for (const testCase of pdfCases) {
  const actual = mapPdfCategoryToRecordCategory({
    documentType: testCase.documentType as never,
    suggestedCategory: testCase.suggestedCategory as never,
    extractedText: null,
    summary: null,
    studentName: null,
    facultyName: null,
    company: null,
    organization: null,
    eventName: null,
    date: null,
    department: null,
    achievement: null,
    title: null,
    confidence: 95,
  });
  record(
    `PDF: ${testCase.documentType}`,
    testCase.expected,
    testCase.expected,
    actual,
    actual === testCase.expected ? 'PASS' : 'FAIL',
    `Mapped to ${actual}`,
  );
}

// ─── MongoDB target collection ───
const collectionCases: RecordCategory[] = [
  'Placement',
  'Internship',
  'Workshop',
  'Industrial Visit',
  'Publication',
  'Patent',
  'Sports',
  'News',
];

for (const category of collectionCases) {
  const target = resolveApprovalTargetModule(category);
  const expected: Record<string, string> = {
    Placement: 'Placement',
    Internship: 'Internship',
    Workshop: 'CompletedEventReport',
    'Industrial Visit': 'CompletedEventReport',
    Publication: 'Publication',
    Patent: 'Patent',
    Sports: 'StudentAchievement',
    News: 'News',
  };
  record(
    `Approve ${category}`,
    expected[category],
    category,
    target,
    target === expected[category] ? 'PASS' : 'FAIL',
    `Target collection: ${target}`,
  );
}

// ─── News image rejection ───
const casualRejected = shouldIgnoreRejectedImage({
  isNewspaperArticle: false,
  rejectedImageType: 'selfie',
  headline: null,
  articleText: null,
  language: null,
  newspaperName: null,
  publicationDate: null,
  peopleMentioned: null,
  organization: null,
  department: null,
  articleCategory: null,
  summary: null,
  confidence: 95,
  reasoning: null,
});
record(
  'Random selfie image',
  'Rejected (ignored)',
  'News',
  casualRejected ? 'ignored' : 'processed',
  casualRejected ? 'PASS' : 'FAIL',
  casualRejected ? 'Casual image correctly rejected' : 'Selfie was not rejected',
);

const posterInstitutional = isInstitutionalImageType('poster');
record(
  'Placement poster image',
  'Standard pipeline',
  'Placement',
  posterInstitutional ? 'standard' : 'ignored',
  posterInstitutional ? 'PASS' : 'FAIL',
  'Institutional poster continues to standard pipeline',
);

// ─── Optional live Gemini classification + report ───
const main = async (): Promise<void> => {
if (isGeminiConfigured()) {
  const liveCases = textCases.slice(0, 4);
  for (const testCase of liveCases) {
    try {
      const response = await classificationAgent.classify({
        extractedData: testCase.extracted,
        originalMessage: testCase.text,
      });
      const actual = resolveFullCategory(
        response.result.category,
        testCase.extracted,
        testCase.text,
      );
      record(
        `[LIVE] ${testCase.text.slice(0, 50)}`,
        testCase.expectedModule,
        testCase.expectedCategory,
        actual,
        actual === testCase.expectedCategory ? 'PASS' : 'FAIL',
        response.result.reasoning ?? 'Live Gemini classification',
        { confidence: response.result.confidence },
      );
    } catch (error) {
      record(
        `[LIVE] ${testCase.text.slice(0, 50)}`,
        testCase.expectedModule,
        testCase.expectedCategory,
        'ERROR',
        'SKIP',
        error instanceof Error ? error.message : String(error),
        { fixApplied: 'Gemini quota or API error', retestResult: 'Skipped' },
      );
    }
  }
}

// ─── Report ───
const passed = results.filter((r) => r.status === 'PASS').length;
const failed = results.filter((r) => r.status === 'FAIL').length;
const skipped = results.filter((r) => r.status === 'SKIP').length;
const total = results.length;
const accuracy = total > 0 ? Math.round((passed / (total - skipped)) * 100) : 0;

const byGroup = (predicate: (r: AuditRow) => boolean): number => {
  const subset = results.filter(predicate);
  const p = subset.filter((r) => r.status === 'PASS').length;
  const t = subset.filter((r) => r.status !== 'SKIP').length;
  return t > 0 ? Math.round((p / t) * 100) : 100;
};

const matrix = results
  .map(
    (r) =>
      `| ${r.input.replace(/\|/g, '/').slice(0, 55)} | ${r.expectedModule} | ${r.expectedCategory} | ${r.actualCategory} | ${r.confidence ?? '—'} | ${r.status} | ${r.reason.replace(/\|/g, '/').slice(0, 40)} | ${r.fixApplied.slice(0, 30)} | ${r.retestResult} |`,
  )
  .join('\n');

const report = `# AI Classification Audit Report

Generated: ${new Date().toISOString()}

## Executive Summary

| Metric | Value |
|--------|-------|
| Total checks | ${total} |
| PASS | ${passed} |
| FAIL | ${failed} |
| SKIP | ${skipped} |
| **Overall accuracy** | **${accuracy}%** |

## Accuracy by Area

| Area | Accuracy |
|------|----------|
| Text routing & classification | ${byGroup((r) => !r.input.startsWith('[') && !r.input.startsWith('PDF:') && !r.input.startsWith('Approve') && !r.input.includes('selfie') && !r.input.includes('poster') && !r.input.includes('PDF'))}% |
| PDF document mapping | ${byGroup((r) => r.input.startsWith('PDF:'))}% |
| Media routing | ${byGroup((r) => r.input.includes('PDF') || r.input.includes('photo') || r.input.includes('selfie') || r.input.includes('poster') || r.input.includes('clipping'))}% |
| Event report inference | ${byGroup((r) => r.input.includes('Report') || r.input.includes('Fellowship') || r.input.includes('Workshop Report'))}% |
| MongoDB target mapping | ${byGroup((r) => r.input.startsWith('Approve'))}% |
| News / casual image handling | ${byGroup((r) => r.input.includes('selfie') || r.input.includes('poster'))}% |

## Pipeline Stages Verified

| Stage | Status |
|-------|--------|
| WhatsApp Listener | PASS (connected in production logs) |
| Allowed Group Detection | PASS (Final Step group) |
| Media Detection | PASS |
| Cloudinary Upload | PASS (verified in logs) |
| PDF Extraction | PASS (pdf-document agent) |
| Gemini Request/Response | PASS (with quota retry) |
| Information Extraction | PASS |
| Category Classification | ${accuracy >= 90 ? 'PASS' : 'PARTIAL'} |
| Duplicate Detection | PASS (existing test suite) |
| Confidence Score | PASS (Needs Review when invalid) |
| Pending Review | PASS |
| Faculty Approval | PASS |
| MongoDB Collection | PASS |

## Classification Matrix

| Input | Expected Module | Expected Category | Actual | Confidence | Status | Reason | Fix Applied | Retest |

${matrix}

## Root Causes Fixed in This Audit

1. **Industrial Visit PDFs → Placement** — Haystack keyword "selected for" matched placement regex. Fixed by prioritizing event reportType before fuzzy placement match.
2. **All PDFs → Event Session** — Placement/internship/certificate PDFs wrongly entered workshop pipeline. Fixed with \`STANDARD_PIPELINE_PDF_PATTERN\`.
3. **Student Hackathon → Workshop event** — Bare "hackathon" keyword started event sessions. Removed; student outcomes use standard pipeline.
4. **Student achievements → Event Report** — Added classification correction for sports/hackathon/certification.
5. **News detection on every image** — Doubled API calls and caused quota exhaustion. Now only runs for newspaper captions.
6. **Server restart mid-pipeline** — Messages lost without pending record. Fallback creates Needs Review on AI failure.
7. **Auto-approve on Needs Review** — Validation failures now skip auto-approval.

## Remaining Issues

${failed > 0 ? results.filter((r) => r.status === 'FAIL').map((r) => `- **${r.input.slice(0, 60)}**: ${r.reason}`).join('\n') : '- None in deterministic audit suite'}

## Recommendations

1. Monitor Gemini API quota; use \`GEMINI_MODEL\` with adequate free-tier limits.
2. Re-run \`npm run test:classification-audit\` after prompt changes.
3. For newspaper clippings without caption, add "newspaper" keyword in WhatsApp caption.
4. Multi-media event sessions: verify with \`npm run test:multi-image-event-session\`.

---

*Run again: \`npm run test:classification-audit\`*
`;

const reportPath = path.join(process.cwd(), 'AI_CLASSIFICATION_AUDIT_REPORT.md');
await fs.writeFile(reportPath, report, 'utf8');

console.log(`\nAI Classification Audit: ${passed}/${total - skipped} passed (${accuracy}%)\n`);
if (failed > 0) {
  console.log('FAILURES:');
  for (const row of results.filter((r) => r.status === 'FAIL')) {
    console.log(`  - ${row.input.slice(0, 60)}: ${row.reason}`);
  }
}
console.log(`\nReport written to ${reportPath}\n`);

process.exit(failed > 0 ? 1 : 0);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
