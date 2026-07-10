/**
 * Database foundation integration tests.
 *
 * Prerequisites:
 *   1. cp backend/.env.example backend/.env (set MONGODB_URI)
 *   2. npm install
 *   3. npm run test:db
 */

import mongoose, { Schema, model, Types } from 'mongoose';
import dotenv from 'dotenv';
import {
  applyBaseSchema,
  baseSchemaOptions,
  createBaseSchema,
  softDeleteById,
  restoreById,
  withActiveFilter,
  getPagination,
  buildPaginationMeta,
  USER_ROLES,
  PENDING_RECORD_STATUSES,
  ACHIEVEMENT_TYPES,
  REPORT_TYPES,
} from '../database';
import { connectDatabase, disconnectDatabase } from '../database/connection';
import { IBaseDocument } from '../types/base.types';

dotenv.config();

interface ITestDoc extends IBaseDocument {
  label: string;
}

const TEST_COLLECTION = '_foundation_test';

const assert = (condition: boolean, message: string): void => {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
  console.log(`PASS: ${message}`);
};

const runTests = async (): Promise<void> => {
  console.log('Running database foundation tests...\n');

  // Test 1: Enums exported
  assert(USER_ROLES.length === 4, 'USER_ROLES enum has 4 values');
  assert(PENDING_RECORD_STATUSES.includes('Pending'), 'PENDING_RECORD_STATUSES includes Pending');
  assert(ACHIEVEMENT_TYPES.includes('Sports'), 'ACHIEVEMENT_TYPES includes Sports');
  assert(REPORT_TYPES.includes('Monthly'), 'REPORT_TYPES includes Monthly');

  // Test 2: Query helpers
  const pagination = getPagination({ page: 2, limit: 10 });
  assert(pagination.skip === 10, 'getPagination calculates skip correctly');
  const meta = buildPaginationMeta(45, pagination);
  assert(meta.totalPages === 5, 'buildPaginationMeta calculates totalPages');
  assert(withActiveFilter().isDeleted?.$ne === true, 'withActiveFilter excludes deleted records');

  await connectDatabase();

  // Clean up any leftover test data
  const existing = mongoose.models.FoundationTest;
  if (existing) {
    await existing.deleteMany({});
  }

  // Test 3: createBaseSchema + timestamps + base fields
  const testSchema = createBaseSchema<ITestDoc>(
    {
      label: { type: String, required: true },
    },
    { collection: TEST_COLLECTION },
  );

  const FoundationTest = model<ITestDoc>('FoundationTest', testSchema);

  const doc = await FoundationTest.create({ label: 'foundation-test' });
  assert(!!doc.createdAt, 'createBaseSchema enables createdAt timestamp');
  assert(!!doc.updatedAt, 'createBaseSchema enables updatedAt timestamp');
  assert(doc.isDeleted === false, 'Base schema defaults isDeleted to false');

  // Test 4: Soft delete plugin — instance method
  await doc.softDelete(new Types.ObjectId());
  assert(doc.isDeleted === true, 'softDelete() instance method sets isDeleted');

  // Test 5: Soft delete plugin — auto-exclude from queries
  const activeDocs = await FoundationTest.find({ label: 'foundation-test' });
  assert(activeDocs.length === 0, 'Soft delete plugin excludes deleted docs from find()');

  const allDocs = await FoundationTest.find({ label: 'foundation-test' }).setOptions({
    includeDeleted: true,
  });
  assert(allDocs.length === 1, 'includeDeleted option returns soft-deleted docs');

  // Test 6: Restore instance method
  await doc.restore();
  assert(doc.isDeleted === false, 'restore() instance method clears isDeleted');

  const restoredDocs = await FoundationTest.find({ label: 'foundation-test' });
  assert(restoredDocs.length === 1, 'Restored doc appears in default queries');

  // Test 7: softDeleteById utility
  const softDeleted = await softDeleteById(FoundationTest, doc._id.toString());
  assert(softDeleted?.isDeleted === true, 'softDeleteById utility works');

  // Test 8: restoreById utility
  const restored = await restoreById(FoundationTest, doc._id.toString());
  assert(restored?.isDeleted === false, 'restoreById utility works');

  // Test 9: applyBaseSchema on existing schema
  const manualSchema = new Schema<ITestDoc>({ label: String }, baseSchemaOptions);
  applyBaseSchema(manualSchema);
  assert(typeof manualSchema.methods.softDelete === 'function', 'applyBaseSchema adds softDelete method');

  // Cleanup
  await FoundationTest.deleteMany({});
  await disconnectDatabase();

  console.log('\nAll database foundation tests passed.');
};

runTests().catch(async (error) => {
  console.error('\nDatabase foundation tests failed:', error);
  await disconnectDatabase().catch(() => undefined);
  process.exit(1);
});
