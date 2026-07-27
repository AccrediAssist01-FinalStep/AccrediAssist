/**
 * PDF Report Generator tests.
 *
 * Run: npm run test:pdf-report
 */

import dotenv from 'dotenv';
import fs from 'fs/promises';
import { connectDatabase, disconnectDatabase } from '../database/connection';
import { CompletedEventReport } from '../models/CompletedEventReport';
import { FacultyAchievement } from '../models/FacultyAchievement';
import { Internship } from '../models/Internship';
import { Patent } from '../models/Patent';
import { Placement } from '../models/Placement';
import { Publication } from '../models/Publication';
import { StudentAchievement } from '../models/StudentAchievement';
import { GENERATION_REPORT_TYPES } from '../report-generation/config/report-types.config';
import { pdfReportService } from '../report-generation/pdf/services/pdf-report.service';
import { getPdfInstitutionConfig, PDF_SECTION_ORDER } from '../report-generation/pdf/config/pdf.config';
import { dataCollectionService } from '../report-generation/services/data-collection.service';
import { aiSummaryService } from '../report-generation/services/ai-summary.service';
import { chartPreparationService } from '../report-generation/services/chart-preparation.service';
import { exportService } from '../report-generation/services/export.service';
import { createPipelineContext } from '../report-generation/utils/report-context.util';

dotenv.config();

const TEST_PREFIX = 'pdf-report-test-';

const assert = (condition: boolean, message: string): void => {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
  console.log(`PASS: ${message}`);
};

const isPdfBuffer = (buffer: Buffer): boolean =>
  buffer.length > 4 && buffer.slice(0, 4).toString() === '%PDF';

const seedSampleData = async (): Promise<void> => {
  await Promise.all([
    StudentAchievement.deleteMany({ studentName: { $regex: TEST_PREFIX } }),
    FacultyAchievement.deleteMany({ facultyName: { $regex: TEST_PREFIX } }),
    Placement.deleteMany({ studentName: { $regex: TEST_PREFIX } }),
    Internship.deleteMany({ studentName: { $regex: TEST_PREFIX } }),
    Publication.deleteMany({ facultyName: { $regex: TEST_PREFIX } }),
    Patent.deleteMany({ patentTitle: { $regex: TEST_PREFIX } }),
    CompletedEventReport.deleteMany({ eventTitle: { $regex: TEST_PREFIX } }),
  ]);

  await StudentAchievement.create({
    studentName: `${TEST_PREFIX}Rahul`,
    department: 'Computer Engineering',
    achievementType: 'Technical',
    title: 'Hackathon Winner',
    date: new Date('2025-08-15'),
  });

  await FacultyAchievement.create({
    facultyName: `${TEST_PREFIX}Dr. Sharma`,
    achievementType: 'Research',
    title: 'Best Paper Award',
    date: new Date('2025-07-01'),
  });

  await Placement.create({
    studentName: `${TEST_PREFIX}Rahul`,
    department: 'Computer Engineering',
    company: 'TCS',
    role: 'Software Engineer',
    joiningDate: new Date('2025-06-01'),
  });

  await Internship.create({
    studentName: `${TEST_PREFIX}Priya`,
    company: 'Infosys',
    role: 'Intern',
    startDate: new Date('2025-05-01'),
    endDate: new Date('2025-07-31'),
  });

  await Publication.create({
    facultyName: `${TEST_PREFIX}Dr. Sharma`,
    paperTitle: `${TEST_PREFIX} ML Paper`,
    journal: 'IEEE Access',
    publicationDate: new Date('2025-03-01'),
  });

  await Patent.create({
    patentTitle: `${TEST_PREFIX} Smart Campus`,
    inventors: [`${TEST_PREFIX}Dr. Sharma`],
    status: 'Filed',
    filingDate: new Date('2025-01-15'),
  });

  await CompletedEventReport.create({
    eventTitle: `${TEST_PREFIX} Workshop`,
    eventType: 'Workshop',
    date: new Date('2025-02-10'),
    coordinator: `${TEST_PREFIX}Dr. Sharma`,
    participants: 80,
    photoUrls: ['https://via.placeholder.com/480x320.png?text=Event+Photo'],
  });
};

const cleanupSampleData = async (): Promise<void> => {
  await Promise.all([
    StudentAchievement.deleteMany({ studentName: { $regex: TEST_PREFIX } }),
    FacultyAchievement.deleteMany({ facultyName: { $regex: TEST_PREFIX } }),
    Placement.deleteMany({ studentName: { $regex: TEST_PREFIX } }),
    Internship.deleteMany({ studentName: { $regex: TEST_PREFIX } }),
    Publication.deleteMany({ facultyName: { $regex: TEST_PREFIX } }),
    Patent.deleteMany({ patentTitle: { $regex: TEST_PREFIX } }),
    CompletedEventReport.deleteMany({ eventTitle: { $regex: TEST_PREFIX } }),
  ]);
};

const buildPipelineContext = async (reportType: (typeof GENERATION_REPORT_TYPES)[number]) => {
  let context = createPipelineContext(reportType, { academicYear: '2025-2026' });
  context = await dataCollectionService.collectForContext(context);
  context = await aiSummaryService.summarizeForContext(context);
  context = await chartPreparationService.prepareForContext(context);
  return context;
};

const runTests = async (): Promise<void> => {
  console.log('Running PDF Report Generator tests...\n');

  await connectDatabase();
  await seedSampleData();

  const institution = getPdfInstitutionConfig();
  await fs.mkdir(institution.exportsDirectory, { recursive: true });

  for (const reportType of GENERATION_REPORT_TYPES) {
    const context = await buildPipelineContext(reportType);
    const result = await pdfReportService.generateFromContext(context);

    assert(isPdfBuffer(result.buffer), `${reportType}: buffer is valid PDF`);
    assert(result.fileSizeBytes > 3000, `${reportType}: file size is substantial (${result.fileSizeBytes} bytes)`);
    assert(result.pageCount >= 3, `${reportType}: has multiple pages (${result.pageCount})`);
    assert(result.downloadUrl.includes('/downloads/'), `${reportType}: download URL returned`);
    assert(result.sectionsIncluded.includes('executive-summary'), `${reportType}: includes executive summary`);
    assert(result.sectionsIncluded.includes('charts'), `${reportType}: includes charts section`);
    assert(result.sectionsIncluded.length >= PDF_SECTION_ORDER.length - 1, `${reportType}: includes expected sections`);

    const saved = await fs.readFile(result.filePath);
    assert(isPdfBuffer(saved), `${reportType}: saved file is valid PDF`);
  }

  const nbaContext = await buildPipelineContext('NBA');
  assert((nbaContext.charts?.length ?? 0) > 0, 'NBA pipeline includes charts for PDF embedding');

  const exportResult = await exportService.export({
    document: { title: 'Test', sections: [], metadata: {} },
    format: 'pdf',
    pipelineContext: nbaContext,
  });
  assert(exportResult.status === 'completed', 'Export service generates PDF with pipeline context');
  assert(!!exportResult.downloadUrl, 'Export service returns download URL');
  assert((exportResult.pageCount ?? 0) >= 3, 'Export service reports page count');

  const resolvedPath = pdfReportService.resolveExportPath(exportResult.fileName!);
  assert(resolvedPath.endsWith('.pdf'), 'Resolved export path ends with .pdf');

  await cleanupSampleData();
  await disconnectDatabase();

  console.log('\nAll PDF report generator tests passed.');
};

runTests().catch(async (error) => {
  console.error(error);
  await cleanupSampleData().catch(() => undefined);
  await disconnectDatabase().catch(() => undefined);
  process.exit(1);
});
