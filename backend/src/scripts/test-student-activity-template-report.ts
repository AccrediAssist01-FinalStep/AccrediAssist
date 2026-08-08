import { dataCollectionService } from '../report-generation/services/data-collection.service';
import { studentActivityReportGeneratorService } from '../report-generation/student-activity/services/student-activity-report-generator.service';

const assert = (label: string, condition: boolean, detail?: string) => {
  if (!condition) {
    throw new Error(`${label}${detail ? ` — ${detail}` : ''}`);
  }
  console.log(`PASS: ${label}${detail ? ` (${detail})` : ''}`);
};

async function main() {
  const filters = { academicYear: '2025-2026' };
  const collected = await dataCollectionService.collect('Student Activities', filters);
  const content = await studentActivityReportGeneratorService.buildContent({
    reportType: 'Student Activities',
    filters,
    collectedData: collected,
  });

  assert('Report title matches template', content.reportTitle === 'STUDENT ACHIEVEMENT REPORT');
  assert('Has introduction paragraphs', content.introduction.length >= 2);
  assert('Has conclusion paragraphs', content.conclusion.length >= 2);
  assert('Has 12 modules', content.modules.length === 12, String(content.modules.length));
  assert(
    'Module 1 is Sports',
    content.modules[0]?.heading === 'Module 1: Sports',
    content.modules[0]?.heading,
  );
  assert(
    'Module 12 is HSS / NCC',
    content.modules[11]?.heading === 'Module 12: HSS / NCC',
    content.modules[11]?.heading,
  );

  const introWords = content.introduction.join(' ').split(/\s+/).length;
  const conclusionWords = content.conclusion.join(' ').split(/\s+/).length;
  console.log(`Intro words: ${introWords}, Conclusion words: ${conclusionWords}, Records: ${content.totalRecords}`);

  const pdfResult = await studentActivityReportGeneratorService.generateFromPipelineContext(
    { reportType: 'Student Activities', filters, collectedData: collected },
    'pdf',
  );
  assert('PDF generated', (pdfResult.pdfBuffer?.length ?? 0) > 500, `${pdfResult.pdfBuffer?.length} bytes`);

  console.log('Student activity template report test completed.');
  process.exit(0);
}

main().catch((error) => {
  console.error('Student activity template report test failed:', error);
  process.exit(1);
});
