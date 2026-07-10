/**
 * StudentAchievement model integration tests.
 *
 * Prerequisites:
 *   1. cp backend/.env.example backend/.env (set MONGODB_URI)
 *   2. npm install
 *   3. npm run test:student-achievement-model
 */

import dotenv from 'dotenv';
import { connectDatabase, disconnectDatabase } from '../database/connection';
import { StudentAchievement } from '../models/StudentAchievement';

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
  console.log('Running StudentAchievement model tests...\n');

  await connectDatabase();
  await StudentAchievement.deleteMany({});

  // Test 1: Create with required fields
  const achievement = await StudentAchievement.create({
    studentName: 'Rahul Patil',
    rollNumber: 'CS2021001',
    department: 'Computer Engineering',
    achievementType: 'Technical',
    title: 'First Prize in Coding Competition',
    description: 'Won first prize at inter-college hackathon.',
    organization: 'TechFest 2026',
    certificateUrl: 'https://cloudinary.com/certificates/rahul.pdf',
    photos: ['https://cloudinary.com/photos/rahul1.jpg'],
    date: new Date('2026-03-15'),
  });

  assert(!!achievement._id, 'StudentAchievement creates successfully');
  assert(achievement.studentName === 'Rahul Patil', 'studentName is stored correctly');
  assert(achievement.achievementType === 'Technical', 'achievementType is stored correctly');
  assert(achievement.photos.length === 1, 'photos array is stored correctly');
  assert(!!achievement.createdAt, 'Timestamps: createdAt is set');
  assert(!!achievement.updatedAt, 'Timestamps: updatedAt is set');
  assert(achievement.isDeleted === false, 'Base schema: isDeleted defaults to false');

  // Test 2: Query by studentName index
  const byName = await StudentAchievement.find({ studentName: 'Rahul Patil' });
  assert(byName.length === 1, 'Query by studentName works');

  // Test 3: Query by achievementType index
  const byType = await StudentAchievement.find({ achievementType: 'Technical' });
  assert(byType.length === 1, 'Query by achievementType works');

  // Test 4: Query by date index
  const byDate = await StudentAchievement.find({ date: { $gte: new Date('2026-01-01') } });
  assert(byDate.length === 1, 'Query by date works');

  // Test 5: Invalid achievementType rejected
  await assertThrows(
    () =>
      StudentAchievement.create({
        studentName: 'Test Student',
        achievementType: 'InvalidType',
        title: 'Test Title',
        date: new Date(),
      }),
    'Invalid achievementType is rejected',
  );

  // Test 6: Missing required fields rejected
  await assertThrows(
    () =>
      StudentAchievement.create({
        achievementType: 'Sports',
        title: 'Test',
        date: new Date(),
      } as never),
    'Missing studentName is rejected',
  );

  await assertThrows(
    () =>
      StudentAchievement.create({
        studentName: 'Test Student',
        achievementType: 'Sports',
        date: new Date(),
      } as never),
    'Missing title is rejected',
  );

  // Test 7: Invalid certificateUrl rejected
  await assertThrows(
    () =>
      StudentAchievement.create({
        studentName: 'Test Student',
        achievementType: 'Certification',
        title: 'AWS Certified',
        date: new Date(),
        certificateUrl: 'not-a-valid-url',
      }),
    'Invalid certificateUrl is rejected',
  );

  // Test 8: All achievement type enum values
  const types = ['Sports', 'Hackathon', 'Research', 'Certification', 'Award', 'Cultural'] as const;
  for (const type of types) {
    const doc = await StudentAchievement.create({
      studentName: `Student ${type}`,
      achievementType: type,
      title: `${type} Achievement`,
      date: new Date(),
    });
    assert(doc.achievementType === type, `Achievement type "${type}" is valid`);
  }

  // Test 9: Soft delete via base schema
  await achievement.softDelete();
  const hidden = await StudentAchievement.findById(achievement._id);
  assert(!hidden, 'Soft-deleted record excluded from default queries');

  // Cleanup
  await StudentAchievement.deleteMany({});
  await disconnectDatabase();

  console.log('\nAll StudentAchievement model tests passed.');
};

runTests().catch(async (error) => {
  console.error('\nStudentAchievement model tests failed:', error);
  await disconnectDatabase().catch(() => undefined);
  process.exit(1);
});
