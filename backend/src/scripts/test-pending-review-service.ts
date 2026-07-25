/**
 * PendingReviewService tests.
 *
 * Run: npm run test:pending-review-service
 */

import dotenv from 'dotenv';
import { connectDatabase, disconnectDatabase } from '../database/connection';
import { PendingRecord } from '../models/PendingRecord';
import { pendingReviewService } from '../services/pendingReview.service';
import { BadRequestError, NotFoundError } from '../utils/errors';

dotenv.config();

const TEST_PREFIX = 'PENDING_REVIEW_TEST_';

const assert = (condition: boolean, message: string): void => {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
  console.log(`PASS: ${message}`);
};

const assertRejects = async (
  action: () => Promise<unknown>,
  ErrorType: typeof NotFoundError | typeof BadRequestError,
  message: string,
): Promise<void> => {
  try {
    await action();
    throw new Error(`FAIL: ${message}`);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('FAIL:')) {
      throw error;
    }
    assert(error instanceof ErrorType, message);
  }
};

const cleanup = async (): Promise<void> => {
  await PendingRecord.deleteMany({ originalMessage: new RegExp(TEST_PREFIX) });
};

const seedRecords = async (): Promise<{
  pendingPlacementId: string;
  needsReviewId: string;
  approvedId: string;
}> => {
  const pendingPlacement = await pendingReviewService.createPendingRecord({
    originalMessage: `${TEST_PREFIX} Rahul Patil secured placement at Infosys.`,
    groupName: 'Training & Placement',
    senderName: 'Placement Officer',
    category: 'Placement',
    extractedData: {
      title: `${TEST_PREFIX} Placement at Infosys`,
      studentNames: ['Rahul Patil'],
      company: 'Infosys',
    },
    confidenceScore: 92,
    status: 'Pending',
  });

  const needsReview = await pendingReviewService.createPendingRecord({
    originalMessage: `${TEST_PREFIX} Workshop report incomplete.`,
    category: 'Workshop',
    extractedData: {
      title: `${TEST_PREFIX} Cloud Computing Workshop`,
      eventType: 'Workshop',
    },
    confidenceScore: 58,
    status: 'Needs Review',
  });

  const internship = await pendingReviewService.createPendingRecord({
    originalMessage: `${TEST_PREFIX} Internship at TCS.`,
    category: 'Internship',
    extractedData: {
      title: `${TEST_PREFIX} TCS Internship`,
      company: 'TCS',
    },
    confidenceScore: 88,
    status: 'Pending',
  });

  const approved = await PendingRecord.create({
    originalMessage: `${TEST_PREFIX} Approved internship record.`,
    category: 'Internship',
    extractedData: {
      title: `${TEST_PREFIX} Approved Internship`,
    },
    confidenceScore: 90,
    status: 'Approved',
  });

  return {
    pendingPlacementId: pendingPlacement._id.toString(),
    needsReviewId: needsReview._id.toString(),
    approvedId: approved._id.toString(),
  };
};

const testCreatePendingRecord = async (): Promise<void> => {
  console.log('\n--- Create PendingRecord ---');

  const created = await pendingReviewService.createPendingRecord({
    originalMessage: `${TEST_PREFIX} Create method validation record.`,
    category: 'Publication',
    extractedData: {
      title: `${TEST_PREFIX} Publication Title`,
      publicationTitle: 'Edge AI for Smart Campus Systems',
    },
    confidenceScore: 91,
  });

  assert(Boolean(created._id), 'Create returns a pending record id');
  assert(created.status === 'Pending', 'Create defaults status to Pending');
  assert(created.category === 'Publication', 'Create stores category');
  assert(created.confidenceScore === 91, 'Create stores confidence score');
};

const testGetPendingRecordById = async (pendingPlacementId: string): Promise<void> => {
  console.log('\n--- Get PendingRecord by ID ---');

  const record = await pendingReviewService.getPendingRecordById(pendingPlacementId);
  assert(record._id.toString() === pendingPlacementId, 'Get by id returns the requested record');
  assert(record.category === 'Placement', 'Get by id returns stored category');

  await assertRejects(
    () => pendingReviewService.getPendingRecordById('507f1f77bcf86cd799439011'),
    NotFoundError,
    'Get by id throws for missing record',
  );
};

const testUpdatePendingRecord = async (
  pendingPlacementId: string,
  approvedId: string,
): Promise<void> => {
  console.log('\n--- Update PendingRecord ---');

  const updated = await pendingReviewService.updatePendingRecord(pendingPlacementId, {
    extractedData: {
      title: `${TEST_PREFIX} Updated Placement Title`,
      company: 'Infosys',
      placement: 'Software Engineer',
    },
    confidenceScore: 95,
  });

  assert(updated.confidenceScore === 95, 'Update persists confidence score changes');
  assert(
    (updated.extractedData as { title?: string })?.title === `${TEST_PREFIX} Updated Placement Title`,
    'Update persists extractedData changes',
  );

  await assertRejects(
    () =>
      pendingReviewService.updatePendingRecord(approvedId, {
        confidenceScore: 70,
      }),
    BadRequestError,
    'Update rejects approved records',
  );
};

const testGetAllPendingRecords = async (): Promise<void> => {
  console.log('\n--- Get all PendingRecords ---');

  const allRecords = await pendingReviewService.getAllPendingRecords();
  assert(allRecords.items.length >= 4, 'Get all returns seeded pending review records');
  assert(allRecords.meta.total >= 4, 'Pagination meta includes total count');
  assert(allRecords.meta.page === 1, 'Default pagination page is 1');
};

const testFilterByStatus = async (needsReviewId: string): Promise<void> => {
  console.log('\n--- Filter by status ---');

  const pendingRecords = await pendingReviewService.getAllPendingRecords({
    status: 'Pending',
  });
  assert(
    pendingRecords.items.every((record) => record.status === 'Pending'),
    'Status filter returns only Pending records',
  );

  const needsReviewRecords = await pendingReviewService.getAllPendingRecords({
    status: 'Needs Review',
  });
  assert(
    needsReviewRecords.items.some((record) => record._id.toString() === needsReviewId),
    'Status filter returns Needs Review records',
  );
};

const testFilterByCategory = async (): Promise<void> => {
  console.log('\n--- Filter by category ---');

  const placements = await pendingReviewService.getAllPendingRecords({
    category: 'Placement',
  });
  assert(
    placements.items.every((record) => record.category === 'Placement'),
    'Category filter returns only placement records',
  );
  assert(placements.items.length >= 1, 'Category filter finds placement records');
};

const testSearchByTitle = async (): Promise<void> => {
  console.log('\n--- Search by title ---');

  const cloudWorkshop = await pendingReviewService.getAllPendingRecords({
    title: `${TEST_PREFIX} Cloud Computing Workshop`,
  });
  assert(cloudWorkshop.items.length >= 1, 'Title search finds matching workshop record');
  assert(
    cloudWorkshop.items.every((record) =>
      String((record.extractedData as { title?: string })?.title ?? '').includes('Cloud Computing'),
    ),
    'Title search results contain the requested title',
  );
};

const testPagination = async (): Promise<void> => {
  console.log('\n--- Pagination ---');

  const pageOne = await pendingReviewService.getAllPendingRecords({
    pagination: { page: 1, limit: 2 },
    sort: { sortBy: 'createdAt', sortOrder: 'asc' },
  });
  const pageTwo = await pendingReviewService.getAllPendingRecords({
    pagination: { page: 2, limit: 2 },
    sort: { sortBy: 'createdAt', sortOrder: 'asc' },
  });

  assert(pageOne.items.length === 2, 'Pagination limit is applied');
  assert(pageOne.meta.totalPages >= 2, 'Pagination meta calculates total pages');
  assert(
    pageOne.items[0]?._id.toString() !== pageTwo.items[0]?._id.toString(),
    'Paginated pages return different records',
  );
};

const runTests = async (): Promise<void> => {
  console.log('Running PendingReviewService tests...');

  await connectDatabase();
  await cleanup();

  try {
    await testCreatePendingRecord();
    const seeded = await seedRecords();
    await testGetPendingRecordById(seeded.pendingPlacementId);
    await testUpdatePendingRecord(seeded.pendingPlacementId, seeded.approvedId);
    await testGetAllPendingRecords();
    await testFilterByStatus(seeded.needsReviewId);
    await testFilterByCategory();
    await testSearchByTitle();
    await testPagination();
  } finally {
    await cleanup();
    await disconnectDatabase();
  }

  console.log('\nAll PendingReviewService tests passed.');
};

runTests().catch(async (error) => {
  console.error('\nPendingReviewService tests failed:', error);

  try {
    await cleanup();
    await disconnectDatabase();
  } catch {
    // Ignore cleanup failures after test failure.
  }

  process.exit(1);
});
