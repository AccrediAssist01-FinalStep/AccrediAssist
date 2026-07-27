/**
 * DOCX Report Generator tests.
 *
 * Run: npm run test:docx-report
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
import { docxReportService } from '../report-generation/docx/services/docx-report.service';
import { getDocxInstitutionConfig } from '../report-generation/docx/config/docx.config';
import { dataCollectionService } from '../report-generation/services/data-collection.service';
import { aiSummaryService } from '../report-generation/services/ai-summary.service';
import { chartPreparationService } from '../report-generation/services/chart-preparation.service';
import { exportService } from '../report-generation/services/export.service';
import { createPipelineContext } from '../report-generation/utils/report-context.util';
import { REPORT_SECTION_ORDER } from '../report-generation/docx/config/docx.config';

dotenv.config();

const TEST_PREFIX = 'docx-report-test-';

const assert = (condition: boolean, message: string): void => {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
  console.log(`PASS: ${message}`);
};

const isDocxBuffer = (buffer: Buffer): boolean =>
  buffer.length > 4 && buffer[0] === 0x50 && buffer[1] === 0x4b;

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
  console.log('Running DOCX Report Generator tests...\n');

  await connectDatabase();
  await seedSampleData();

  const institution = getDocxInstitutionConfig();
  await fs.mkdir(institution.exportsDirectory, { recursive: true });

  for (const reportType of GENERATION_REPORT_TYPES) {
    const context = await buildPipelineContext(reportType);
    const result = await docxReportService.generateFromContext(context);

    assert(isDocxBuffer(result.buffer), `${reportType}: buffer is valid DOCX (ZIP/PK)`);
    assert(result.fileSizeBytes > 2000, `${reportType}: file size is substantial (${result.fileSizeBytes} bytes)`);
    assert(result.downloadUrl.includes('/downloads/'), `${reportType}: download URL returned`);
    assert(result.sectionsIncluded.includes('executive-summary'), `${reportType}: includes executive summary section`);
    assert(result.sectionsIncluded.includes('charts'), `${reportType}: includes charts section`);
    assert(result.sectionsIncluded.length >= REPORT_SECTION_ORDER.length - 1, `${reportType}: includes expected sections`);

    const saved = await fs.readFile(result.filePath);
    assert(isDocxBuffer(saved), `${reportType}: saved file is valid DOCX`);
  }

  const nbaContext = await buildPipelineContext('NBA');
  assert((nbaContext.charts?.length ?? 0) > 0, 'NBA pipeline includes charts for DOCX embedding');

  const exportResult = await exportService.export({
    document: {
      title: 'Test',
      sections: [],
      metadata: {},
    },
    format: 'docx',
    pipelineContext: nbaContext,
  });
  assert(exportResult.status === 'completed', 'Export service generates DOCX with pipeline context');
  assert(!!exportResult.downloadUrl, 'Export service returns download URL');

  const resolvedPath = docxReportService.resolveExportPath(exportResult.fileName!);
  assert(resolvedPath.endsWith('.docx'), 'Resolved export path ends with .docx');

  await cleanupSampleData();
  await disconnectDatabase();

  console.log('\nAll DOCX report generator tests passed.');
};

runTests().catch(async (error) => {
  console.error(error);
  await cleanupSampleData().catch(() => undefined);
  await disconnectDatabase().catch(() => undefined);
  process.exit(1);
});
