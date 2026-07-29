/**
 * Simulate a placement WhatsApp message through the live AI pipeline.
 * Run: npm run simulate:whatsapp-placement
 */

import dotenv from 'dotenv';
import { connectDatabase, disconnectDatabase } from '../database/connection';
import { pendingReviewWorkflowService } from '../services/pendingReviewWorkflow.service';

dotenv.config();

const run = async (): Promise<void> => {
  await connectDatabase();

  const result = await pendingReviewWorkflowService.processIncomingWhatsAppMessage({
    groupName: 'Final Step',
    sender: 'Placement Officer',
    message:
      'Congratulations! Rahul Patil secured placement at Infosys as Software Engineer with 6 LPA package.',
    timestamp: new Date(),
    media: null,
    mediaMetadata: null,
  });

  if (!result) {
    console.log('Message was ignored (casual/non-institutional filter).');
    await disconnectDatabase();
    return;
  }

  console.log('\nLive pipeline result:');
  console.log('  Pending record ID:', result.pendingRecord._id);
  console.log('  Category:', result.recordCategory);
  console.log('  Detected category:', result.stages.classification.result.category);
  console.log('  Status:', result.pendingStatus);
  console.log('  Confidence:', result.confidenceScore);
  console.log('\nOpen Pending Review in the app and look for this message.');

  await disconnectDatabase();
};

run().catch(async (error) => {
  console.error('Simulation failed:', error instanceof Error ? error.message : error);
  try {
    await disconnectDatabase();
  } catch {
    // ignore
  }
  process.exit(1);
});
