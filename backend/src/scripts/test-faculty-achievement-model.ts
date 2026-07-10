/**
 * FacultyAchievement model integration tests.
 *
 * Prerequisites:
 *   1. cp backend/.env.example backend/.env (set MONGODB_URI)
 *   2. npm install
 *   3. npm run test:faculty-achievement-model
 */

import dotenv from 'dotenv';
import { connectDatabase, disconnectDatabase } from '../database/connection';
import { FacultyAchievement } from '../models/FacultyAchievement';

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
  console.log('Running FacultyAchievement model tests...\n');

  await connectDatabase();
  await FacultyAchievement.deleteMany({});

  // Test 1: Create with required fields
  const achievement = await FacultyAchievement.create({
    facultyName: 'Dr. Priya Kulkarni',
    designation: 'Associate Professor',
    achievementType: 'Research',
    title: 'Published paper in IEEE Conference',
    description: 'Research on AI-based accreditation systems.',
    organization: 'IEEE',
    certificateUrl: 'https://cloudinary.com/certificates/priya.pdf',
    photos: ['https://cloudinary.com/photos/priya1.jpg'],
    date: new Date('2026-02-20'),
  });

  assert(!!achievement._id, 'FacultyAchievement creates successfully');
  assert(achievement.facultyName === 'Dr. Priya Kulkarni', 'facultyName is stored correctly');
  assert(achievement.achievementType === 'Research', 'achievementType is stored correctly');
  assert(achievement.photos.length === 1, 'photos array is stored correctly');
  assert(!!achievement.createdAt, 'Timestamps: createdAt is set');
  assert(!!achievement.updatedAt, 'Timestamps: updatedAt is set');
  assert(achievement.isDeleted === false, 'Base schema: isDeleted defaults to false');

  // Test 2: Query by facultyName index
  const byName = await FacultyAchievement.find({ facultyName: 'Dr. Priya Kulkarni' });
  assert(byName.length === 1, 'Query by facultyName works');

  // Test 3: Query by achievementType index
  const byType = await FacultyAchievement.find({ achievementType: 'Research' });
  assert(byType.length === 1, 'Query by achievementType works');

  // Test 4: Invalid achievementType rejected
  await assertThrows(
    () =>
      FacultyAchievement.create({
        facultyName: 'Dr. Test',
        achievementType: 'InvalidType',
        title: 'Test Title',
        date: new Date(),
      }),
    'Invalid achievementType is rejected',
  );

  // Test 5: Missing required fields rejected
  await assertThrows(
    () =>
      FacultyAchievement.create({
        achievementType: 'Award',
        title: 'Test',
        date: new Date(),
      } as never),
    'Missing facultyName is rejected',
  );

  await assertThrows(
    () =>
      FacultyAchievement.create({
        facultyName: 'Dr. Test',
        achievementType: 'Award',
        date: new Date(),
      } as never),
    'Missing title is rejected',
  );

  // Test 6: Invalid certificateUrl rejected
  await assertThrows(
    () =>
      FacultyAchievement.create({
        facultyName: 'Dr. Test',
        achievementType: 'Certification',
        title: 'FDP Completion',
        date: new Date(),
        certificateUrl: 'not-a-valid-url',
      }),
    'Invalid certificateUrl is rejected',
  );

  // Test 7: All achievement type enum values
  const types = ['Sports', 'Technical', 'Hackathon', 'Certification', 'Award', 'Cultural'] as const;
  for (const type of types) {
    const doc = await FacultyAchievement.create({
      facultyName: `Dr. ${type}`,
      achievementType: type,
      title: `${type} Achievement`,
      date: new Date(),
    });
    assert(doc.achievementType === type, `Achievement type "${type}" is valid`);
  }

  // Test 8: Soft delete via base schema
  await achievement.softDelete();
  const hidden = await FacultyAchievement.findById(achievement._id);
  assert(!hidden, 'Soft-deleted record excluded from default queries');

  // Cleanup
  await FacultyAchievement.deleteMany({});
  await disconnectDatabase();

  console.log('\nAll FacultyAchievement model tests passed.');
};

runTests().catch(async (error) => {
  console.error('\nFacultyAchievement model tests failed:', error);
  await disconnectDatabase().catch(() => undefined);
  process.exit(1);
});
