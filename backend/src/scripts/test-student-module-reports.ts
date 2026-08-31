/**
 * Student module-wise reports: filtering, photographs, PDF/DOCX, existing 8 types.
 *
 * Run: npx tsx src/scripts/test-student-module-reports.ts
 */

import zlib from 'zlib';
import { GENERATION_REPORT_TYPES } from '../report-generation/config/report-types.config';
import type { ReportAggregationResult } from '../report-generation/aggregation/interfaces/aggregation.interface';
import {
  STUDENT_MODULE_REPORT_KEYS,
  studentModuleKeysMatchReportSections,
} from '../report-generation/student-activity/config/student-module-reports.config';
import { buildStudentActivityModuleTables } from '../report-generation/student-activity/utils/student-activity-module-rows.util';
import {
  buildStudentPhotographCaption,
  collectStudentModulePhotographCandidates,
  extractRecordImageUrls,
} from '../report-generation/student-activity/utils/student-module-photographs.util';
import { buildTemplateActivityReportPdf } from '../report-generation/template-activity-report/builders/template-activity-report-pdf.builder';
import { buildTemplateActivityReportDocx } from '../report-generation/template-activity-report/builders/template-activity-report-docx.builder';
import { generateReportSchema } from '../validations/report.validation';
import { STANDARD_TEMPLATE_COLUMN_WEIGHTS } from '../report-generation/template-activity-report/utils/template-table.util';

const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

/** PDFKit emits WinAnsi text as hex fragments; streams may be Flate-compressed. */
const extractPdfText = (buffer: Buffer): string => {
  const raw = buffer.toString('latin1');
  const payloads = [raw];
  for (const match of raw.matchAll(/stream\r?\n([\s\S]*?)\r?\nendstream/g)) {
    const payload = Buffer.from(match[1], 'latin1');
    for (const decoder of [zlib.inflateSync, zlib.inflateRawSync] as const) {
      try {
        payloads.push(decoder(payload).toString('latin1'));
        break;
      } catch {
        continue;
      }
    }
  }

  return payloads
    .flatMap((chunk) =>
      [...chunk.matchAll(/<([0-9A-Fa-f]+)>/g)].map((match) => {
        try {
          return Buffer.from(match[1], 'hex').toString('latin1');
        } catch {
          return '';
        }
      }),
    )
    .join('');
};

const assert = (label: string, condition: boolean, detail?: string): void => {
  if (!condition) {
    throw new Error(`FAIL: ${label}${detail ? ` — ${detail}` : ''}`);
  }
  console.log(`PASS: ${label}${detail ? ` (${detail})` : ''}`);
};

const emptyAggregation = (
  overrides: Partial<ReportAggregationResult['records']['byModule']>,
): ReportAggregationResult =>
  ({
    records: {
      byModule: {
        studentAchievements: [],
        facultyAchievements: [],
        placements: [],
        internships: [],
        publications: [],
        patents: [],
        completedEventReports: [],
        news: [],
        pendingReviews: [],
        ...overrides,
      },
    },
    statistics: {
      overall: { totalRecords: 0 },
      byModule: {},
    },
    metadata: { generatedAt: new Date().toISOString() },
  }) as unknown as ReportAggregationResult;

const sampleRecords = {
  sports: {
    studentName: 'Asha Patel',
    achievementType: 'Sports',
    title: 'Inter-College Cricket Competition',
    organization: 'University Sports Board',
    date: new Date('2025-08-01'),
    photos: ['https://res.cloudinary.com/demo/image/upload/cricket.jpg'],
  },
  certification: {
    studentName: 'Rahul Mehta',
    achievementType: 'Certification',
    title: 'AWS Cloud Practitioner Certification',
    organization: 'Amazon Web Services',
    date: new Date('2025-07-12'),
    photos: [
      'https://res.cloudinary.com/demo/image/upload/aws-1.jpg',
      'https://res.cloudinary.com/demo/image/upload/aws-2.jpg',
    ],
  },
  sponsored: {
    studentName: 'Neha Shah',
    achievementType: 'Technical',
    activitySubCategory: 'Student Sponsored Project',
    title: 'Smart Irrigation Controller',
    organization: 'Acme Industries',
    sponsorshipAmount: 25000,
    date: new Date('2025-06-01'),
  },
  technical: {
    studentName: 'Vikram Rao',
    achievementType: 'Technical',
    title: 'Robotics Hack Night',
    organization: 'IEEE',
    date: new Date('2025-05-20'),
  },
  internship: {
    studentName: 'Isha Nair',
    company: 'Infosys',
    role: 'Intern',
    duration: '8 weeks',
    startDate: new Date('2025-05-01'),
  },
};

const mixedAggregation = emptyAggregation({
  studentAchievements: [
    sampleRecords.sports,
    sampleRecords.certification,
    sampleRecords.sponsored,
    sampleRecords.technical,
  ],
  internships: [sampleRecords.internship],
});

const contentBase = {
  department: 'Computer Science',
  academicYear: '2025-2026',
  tableHeaders: ['Student Name', 'Type', 'Title', 'Organization', 'Date'] as const,
  columnWeights: STANDARD_TEMPLATE_COLUMN_WEIGHTS,
  introduction: ['Introduction paragraph.'],
  conclusion: ['Conclusion paragraph.'],
  totalRecords: 1,
  narrativeSource: 'fallback' as const,
};

async function main(): Promise<void> {
  assert('Existing generation report types remain 8', GENERATION_REPORT_TYPES.length === 8);
  assert(
    'Student module keys match report section config',
    studentModuleKeysMatchReportSections(),
    STUDENT_MODULE_REPORT_KEYS.join(','),
  );
  assert('Thirteen student modules configured', STUDENT_MODULE_REPORT_KEYS.length === 13);

  const fullTables = buildStudentActivityModuleTables(mixedAggregation);
  assert('Combined student report still has 13 modules', fullTables.length === 13);
  assert(
    'Combined first module is Sports',
    fullTables[0]?.heading === 'Module 1: Sports',
    fullTables[0]?.heading,
  );

  const sportsTables = buildStudentActivityModuleTables(mixedAggregation, undefined, 'sports');
  assert('Sports report has exactly one table', sportsTables.length === 1);
  assert('Sports heading is module name only', sportsTables[0]?.heading === 'Sports');
  assert('Sports report includes sports records', sportsTables[0]?.rows.length === 1);
  assert(
    'Sports report excludes certifications',
    !sportsTables[0]?.rows.some((row) => row.some((cell) => cell.includes('AWS'))),
  );
  assert(
    'Sports report excludes internships',
    !sportsTables[0]?.rows.some((row) => row.some((cell) => cell.includes('Infosys'))),
  );
  assert(
    'Sports report excludes sponsored projects',
    !sportsTables[0]?.rows.some((row) => row.some((cell) => cell.includes('Irrigation'))),
  );

  const certificationTables = buildStudentActivityModuleTables(
    mixedAggregation,
    undefined,
    'certifications',
  );
  assert('Certification report includes only certification', certificationTables[0]?.rows.length === 1);
  assert(
    'Certification title present',
    Boolean(certificationTables[0]?.rows[0]?.some((cell) => cell.includes('AWS Cloud Practitioner'))),
  );

  const sponsoredTables = buildStudentActivityModuleTables(
    mixedAggregation,
    undefined,
    'sponsored-projects',
  );
  assert('Sponsored project report has one record', sponsoredTables[0]?.rows.length === 1);
  assert(
    'Sponsored project uses activitySubCategory Student Sponsored Project',
    sponsoredTables[0]?.sourceRecords[0]?.activitySubCategory === 'Student Sponsored Project',
  );
  assert(
    'Sponsored project report excludes generic technical records',
    !sponsoredTables[0]?.rows.some((row) => row.some((cell) => cell.includes('Robotics'))),
  );
  assert(
    'Sponsored project columns include project and organization',
    sponsoredTables[0]?.headers.includes('Project Name') &&
      sponsoredTables[0]?.headers.includes('Sponsored Organization') &&
      sponsoredTables[0]?.headers.includes('Sponsorship Amount'),
  );

  const internshipTables = buildStudentActivityModuleTables(mixedAggregation, undefined, 'internships');
  assert('Internship report excludes student achievements', internshipTables[0]?.rows.length === 1);
  assert(
    'Internship report has Infosys',
    Boolean(internshipTables[0]?.rows[0]?.some((cell) => cell.includes('Infosys'))),
  );

  const noPhotoRecord = { ...sampleRecords.sports, photos: [] };
  assert('Record with no images yields no URLs', extractRecordImageUrls(noPhotoRecord).length === 0);
  assert(
    'Sports caption uses student name and event',
    buildStudentPhotographCaption(sampleRecords.sports, 'Sports', 'sports') ===
      'Asha Patel – Inter-College Cricket Competition',
  );
  assert(
    'Internship caption uses student name and company',
    buildStudentPhotographCaption(sampleRecords.internship, 'Internship', 'internships') ===
      'Isha Nair – Infosys',
  );
  assert(
    'Certification caption uses student name and certification title',
    buildStudentPhotographCaption(sampleRecords.certification, 'Certification', 'certifications') ===
      'Rahul Mehta – AWS Cloud Practitioner Certification',
  );
  assert(
    'Sponsored project caption uses student name and project name',
    buildStudentPhotographCaption(sampleRecords.sponsored, 'Student Sponsored Project', 'sponsored-projects') ===
      'Neha Shah – Smart Irrigation Controller',
  );
  assert(
    'Caption is not generic Image N',
    !buildStudentPhotographCaption(sampleRecords.sports, 'Sports', 'sports').match(/image\s*\d+/i),
  );

  const noImageTables = buildStudentActivityModuleTables(
    emptyAggregation({ studentAchievements: [noPhotoRecord] }),
    undefined,
    'sports',
  );
  assert(
    'No-image report has zero photograph candidates',
    collectStudentModulePhotographCandidates(noImageTables).length === 0,
  );

  const oneImageTables = buildStudentActivityModuleTables(
    emptyAggregation({ studentAchievements: [sampleRecords.sports] }),
    undefined,
    'sports',
  );
  const oneImageCandidates = collectStudentModulePhotographCandidates(oneImageTables);
  assert('One-image report has one candidate', oneImageCandidates.length === 1);
  assert(
    'One-image caption uses event name',
    oneImageCandidates[0]?.caption === 'Asha Patel – Inter-College Cricket Competition',
  );

  const manyImageTables = buildStudentActivityModuleTables(
    emptyAggregation({ studentAchievements: [sampleRecords.certification] }),
    undefined,
    'certifications',
  );
  const manyCandidates = collectStudentModulePhotographCandidates(manyImageTables);
  assert('Multiple photos from one achievement are collected', manyCandidates.length === 2);
  assert(
    'Multiple photos share the same meaningful caption',
    manyCandidates.every(
      (candidate) => candidate.caption === 'Rahul Mehta – AWS Cloud Practitioner Certification',
    ),
  );

  const pdfWithoutImages = await buildTemplateActivityReportPdf({
    content: {
      ...contentBase,
      reportTitle: 'STUDENT SPORTS REPORT',
      modules: [
        {
          moduleNumber: 1,
          heading: 'Sports',
          sectionKey: 'sports',
          headers: ['Student', 'Type', 'Title', 'Organization', 'Date'],
          rows: [['Asha Patel', 'Sports', 'Inter-College Cricket Competition', 'USB', '01 Aug 2025']],
        },
      ],
    },
    filters: { studentModule: 'sports' },
    generatedAt: new Date(),
  });
  const pdfWithoutImagesText = extractPdfText(pdfWithoutImages);
  assert('PDF generates without images', pdfWithoutImages.length > 500);
  assert('PDF contains Introduction heading', pdfWithoutImagesText.includes('Introduction'));
  assert(
    'PDF without images omits photograph section',
    !pdfWithoutImagesText.includes('Photographs'),
  );

  const pdfWithImages = await buildTemplateActivityReportPdf({
    content: {
      ...contentBase,
      reportTitle: 'STUDENT SPORTS REPORT',
      modules: [
        {
          moduleNumber: 1,
          heading: 'Sports',
          sectionKey: 'sports',
          headers: ['Student', 'Title'],
          rows: [['Asha Patel', 'Inter-College Cricket Competition']],
        },
      ],
      photographs: [
        { caption: 'Asha Patel – Inter-College Cricket Competition', buffer: TINY_PNG },
        { caption: 'Asha Patel – Inter-College Cricket Competition', buffer: TINY_PNG },
      ],
    },
    filters: { studentModule: 'sports' },
    generatedAt: new Date(),
  });
  const pdfText = extractPdfText(pdfWithImages);
  assert('PDF generates with images', pdfWithImages.length > pdfWithoutImages.length);
  assert(
    'PDF includes photograph section heading',
    pdfText.includes('Photographs') && pdfText.includes('Achievement'),
  );
  assert(
    'PDF caption uses achievement name',
    pdfText.includes('Asha Patel') && pdfText.includes('Inter-College Cricket Competition'),
  );

  const docxWithoutImages = await buildTemplateActivityReportDocx({
    content: {
      ...contentBase,
      reportTitle: 'STUDENT CERTIFICATIONS REPORT',
      modules: [
        {
          moduleNumber: 7,
          heading: 'Certification',
          sectionKey: 'certifications',
          headers: ['Student', 'Title'],
          rows: [['Rahul Mehta', 'AWS Cloud Practitioner Certification']],
        },
      ],
    },
    filters: { studentModule: 'certifications' },
    generatedAt: new Date(),
  });
  assert('DOCX generates without images', docxWithoutImages.subarray(0, 2).toString() === 'PK');

  const docxWithImages = await buildTemplateActivityReportDocx({
    content: {
      ...contentBase,
      reportTitle: 'STUDENT CERTIFICATIONS REPORT',
      modules: [
        {
          moduleNumber: 7,
          heading: 'Certification',
          sectionKey: 'certifications',
          headers: ['Student', 'Title'],
          rows: [['Rahul Mehta', 'AWS Cloud Practitioner Certification']],
        },
      ],
      photographs: [{ caption: 'Rahul Mehta – AWS Cloud Practitioner Certification', buffer: TINY_PNG }],
    },
    filters: { studentModule: 'certifications' },
    generatedAt: new Date(),
  });
  assert('DOCX generates with images', docxWithImages.length > docxWithoutImages.length);
  assert('DOCX is a zip package', docxWithImages.subarray(0, 2).toString() === 'PK');

  const validModule = generateReportSchema.safeParse({
    reportType: 'Student Activities',
    format: 'pdf',
    studentModule: 'sponsored-projects',
    academicYear: '2025-2026',
  });
  assert('API accepts studentModule on Student Activities', validModule.success);

  const invalidModuleKey = generateReportSchema.safeParse({
    reportType: 'Student Activities',
    format: 'pdf',
    studentModule: 'faculty-mou',
  });
  assert('API rejects unknown studentModule', !invalidModuleKey.success);

  const invalidType = generateReportSchema.safeParse({
    reportType: 'Faculty Activities',
    format: 'pdf',
    studentModule: 'sports',
  });
  assert('API rejects studentModule on non-student reports', !invalidType.success);

  const eightStillEight = generateReportSchema.safeParse({
    reportType: 'NBA',
    format: 'pdf',
  });
  assert('Existing NBA report schema still works', eightStillEight.success);

  console.log('Student module-wise report tests completed.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
