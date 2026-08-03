/**
 * Flush stuck collecting event sessions and process them through Gemini.
 * Run: npx tsx src/scripts/flush-collecting-sessions.ts
 */

import dotenv from 'dotenv';
import dns from 'dns';
import { connectDatabase, disconnectDatabase } from '../database/connection';
import { EventReportSession } from '../models/EventReportSession';
import { PendingRecord } from '../models/PendingRecord';
import { eventCorrelationService } from '../services/event-correlation.service';

dotenv.config();
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const main = async (): Promise<void> => {
  await connectDatabase();

  const collecting = await EventReportSession.find({ status: 'collecting' });
  console.log(`Found ${collecting.length} collecting session(s)`);

  collecting.forEach((session) => {
    console.log(
      `- ${session._id} | ${session.groupName} | messages=${session.messages.length} | last=${session.lastMessageAt?.toISOString()}`,
    );
  });

  const flushed = await eventCorrelationService.flushCollectingSessionsNow();
  console.log(`Flushed ${flushed} collecting session(s)`);

  const stuck = await EventReportSession.find({ status: 'processing' });
  if (stuck.length > 0) {
    console.log(`Retrying ${stuck.length} stuck processing session(s)...`);
    await Promise.all(
      stuck.map((session) =>
        eventCorrelationService.flushSession(session._id.toString(), { allowProcessingRetry: true }),
      ),
    );
  }

  await new Promise((resolve) => setTimeout(resolve, 5000));

  const pending = await PendingRecord.find({ groupName: 'Final Step' })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('_id status category createdAt groupName');

  console.log('\nRecent pending records for Final Step:');
  pending.forEach((record) => {
    console.log(`- ${record._id} | ${record.status} | ${record.category} | ${record.createdAt.toISOString()}`);
  });

  await disconnectDatabase();
};

main().catch(async (error) => {
  console.error(error);
  await disconnectDatabase().catch(() => undefined);
  process.exit(1);
});
