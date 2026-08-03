import dotenv from 'dotenv';
import dns from 'dns';
import { connectDatabase, disconnectDatabase } from '../database/connection';
import { CompletedEventReport } from '../models/CompletedEventReport';
import { dataCollectionService } from '../report-generation/services/data-collection.service';

dotenv.config();
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const main = async (): Promise<void> => {
  await connectDatabase();

  const all = await CompletedEventReport.find({ isDeleted: { $ne: true } })
    .sort({ createdAt: -1 })
    .limit(10)
    .select('eventTitle eventType date createdAt workshopReportStructured media');

  console.log(`Completed events in DB: ${all.length}`);
  all.forEach((event) => {
    console.log({
      title: event.eventTitle,
      eventType: event.eventType,
      date: event.date?.toISOString(),
      hasStructured: Boolean(event.workshopReportStructured),
      mediaCount: Array.isArray(event.media) ? event.media.length : 0,
    });
  });

  for (const filters of [{}, { year: 2026 }, { startDate: new Date('2026-08-01'), endDate: new Date('2026-08-31') }]) {
    const collected = await dataCollectionService.collect('AI Generated Workshop', filters as never);
    const workshops = collected.aggregation?.records.byModule.completedEventReports ?? [];
    console.log(`\nFilters ${JSON.stringify(filters)} -> ${workshops.length} workshop record(s)`);
    workshops.forEach((record) => {
      const r = record as Record<string, unknown>;
      console.log(`  - ${r.eventTitle} | ${r.eventType} | ${r.date}`);
    });
  }

  await disconnectDatabase();
};

main().catch(async (error) => {
  console.error(error);
  await disconnectDatabase().catch(() => undefined);
  process.exit(1);
});
