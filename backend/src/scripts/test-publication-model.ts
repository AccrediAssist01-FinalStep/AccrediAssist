/**
 * Publication model integration tests.
 *
 * Prerequisites:
 *   1. cp backend/.env.example backend/.env (set MONGODB_URI)
 *   2. npm install
 *   3. npm run test:publication-model
 */

import dotenv from 'dotenv';
import { connectDatabase, disconnectDatabase } from '../database/connection';
import { Publication } from '../models/Publication';

dotenv.config();

const assert = (condition: boolean, message: string): void => {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
  console.log(`PASS: ${message}`);
};

const assertThrows = async (fn: () => Promise<unknown>, message: string): Promise<void> => {
  try {
    await fn();
    throw new Error(`FAIL: ${message} (expected error but succeeded)`);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('FAIL:')) {
      throw error;
    }
    console.log(`PASS: ${message}`);
  }
};

const runTests = async (): Promise<void> => {
  console.log('Running Publication model tests...\n');

  await connectDatabase();
  await Publication.deleteMany({});

  // Test 1: Create with required fields
  const publication = await Publication.create({
    facultyName: 'Dr. Anjali Desai',
    paperTitle: 'Machine Learning Applications in Smart Manufacturing',
    journal: 'IEEE Transactions on Industrial Informatics',
    conference: 'ICML 2025',
    authors: ['Dr. Anjali Desai', 'Prof. Kumar', 'Rahul Patil'],
    doi: '10.1109/TII.2025.1234567',
    publicationDate: new Date('2025-11-20'),
    documentUrl: 'https://cloudinary.com/publications/ml-smart-mfg.pdf',
  });

  assert(!!publication._id, 'Publication creates successfully');
  assert(publication.facultyName === 'Dr. Anjali Desai', 'facultyName is stored correctly');
  assert(
    publication.paperTitle === 'Machine Learning Applications in Smart Manufacturing',
    'paperTitle is stored correctly',
  );
  assert(publication.authors?.length === 3, 'authors is stored correctly');
  assert(!!publication.createdAt, 'Timestamps: createdAt is set');
  assert(!!publication.updatedAt, 'Timestamps: updatedAt is set');
  assert(publication.isDeleted === false, 'Base schema: isDeleted defaults to false');

  // Test 2: Query by facultyName index
  const byFaculty = await Publication.find({ facultyName: 'Dr. Anjali Desai' });
  assert(byFaculty.length === 1, 'Query by facultyName works');

  // Test 3: Query by paperTitle index
  const byTitle = await Publication.find({
    paperTitle: 'Machine Learning Applications in Smart Manufacturing',
  });
  assert(byTitle.length === 1, 'Query by paperTitle works');

  // Test 4: Missing facultyName rejected
  await assertThrows(
    () =>
      Publication.create({
        paperTitle: 'Test Paper',
      } as never),
    'Missing facultyName is rejected',
  );

  // Test 5: Missing paperTitle rejected
  await assertThrows(
    () =>
      Publication.create({
        facultyName: 'Dr. Test',
      } as never),
    'Missing paperTitle is rejected',
  );

  // Test 6: Invalid documentUrl rejected
  await assertThrows(
    () =>
      Publication.create({
        facultyName: 'Dr. Test',
        paperTitle: 'Test Paper',
        documentUrl: 'not-a-valid-url',
      }),
    'Invalid documentUrl is rejected',
  );

  // Test 7: Soft delete via base schema
  await publication.softDelete();
  const hidden = await Publication.findById(publication._id);
  assert(!hidden, 'Soft-deleted record excluded from default queries');

  // Cleanup
  await Publication.deleteMany({});
  await disconnectDatabase();

  console.log('\nAll Publication model tests passed.');
};

runTests().catch(async (error) => {
  console.error('\nPublication model tests failed:', error);
  await disconnectDatabase().catch(() => undefined);
  process.exit(1);
});
