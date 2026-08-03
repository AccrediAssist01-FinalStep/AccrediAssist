import dotenv from 'dotenv';
import dns from 'dns';
import { connectDatabase, disconnectDatabase } from '../database/connection';
import { reportGenerationOrchestrator } from '../services/report-generation-orchestrator.service';
import { dataCollectionService } from '../report-generation/services/data-collection.service';
import { workshopReportGeneratorService } from '../report-generation/workshop/services/workshop-report-generator.service';
import { createPipelineContext } from '../report-generation/utils/report-context.util';

dotenv.config();
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const main = async (): Promise<void> => {
  await connectDatabase();

  const filterSets = [
    {},
    { year: 2026 },
    { month: 'July', year: 2026 },
    { month: 'August', year: 2026 },
    { academicYear: '2025-2026' },
    { category: 'Workshop' },
  ];

  for (const filters of filterSets) {
    try {
      let context = createPipelineContext('AI Generated Workshop', filters);
      context = await dataCollectionService.collectForContext(context);
      const records = context.collectedData?.aggregation?.records.byModule.completedEventReports ?? [];
      console.log(`\nFilters ${JSON.stringify(filters)}: ${records.length} aggregated records`);

      await workshopReportGeneratorService.generateFromPipelineContext(context, 'pdf');
      console.log('  -> PDF generation OK');
    } catch (error) {
      console.log(`  -> FAILED: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  try {
    const file = await reportGenerationOrchestrator.generateFile('AI Generated Workshop', {}, 'pdf');
    console.log('\nOrchestrator OK:', file.fileName, file.fileSizeBytes, 'bytes');
  } catch (error) {
    console.log('\nOrchestrator FAILED:', error instanceof Error ? error.message : String(error));
  }

  await disconnectDatabase();
};

main().catch(async (error) => {
  console.error(error);
  await disconnectDatabase().catch(() => undefined);
  process.exit(1);
});
