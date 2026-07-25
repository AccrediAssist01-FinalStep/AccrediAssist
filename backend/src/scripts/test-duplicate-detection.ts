/**
 * Duplicate detection tests.
 *
 * Compares extracted records against MongoDB candidates.
 * Does not save new pipeline data — only creates temporary test fixtures.
 *
 * Run: npm run test:duplicate-detection
 */

import dotenv from 'dotenv';
import {
  calculateSimilarityScore,
  duplicateDetectionAgent,
  duplicateDetectionRepository,
  getDuplicateThreshold,
  toComparableFields,
} from '../ai';
import { connectDatabase, disconnectDatabase } from '../database/connection';
import { CompletedEventReport } from '../models/CompletedEventReport';
import { FacultyAchievement } from '../models/FacultyAchievement';
import { Internship } from '../models/Internship';
import { Patent } from '../models/Patent';
import { PendingRecord } from '../models/PendingRecord';
import { Placement } from '../models/Placement';
import { Publication } from '../models/Publication';
import { StudentAchievement } from '../models/StudentAchievement';

dotenv.config();

const TEST_PREFIX = 'DUPTEST_';

const assert = (condition: boolean, message: string): void => {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
  console.log(`PASS: ${message}`);
};

interface DuplicateTestCase {
  name: string;
  category: string;
  extractedData: Record<string, unknown>;
  expectedDuplicate: boolean;
  expectedMatchingId?: string;
}

const seededIds: {
  placementId?: string;
  internshipId?: string;
  studentAchievementId?: string;
  facultyAchievementId?: string;
  eventId?: string;
  publicationId?: string;
  patentId?: string;
  pendingId?: string;
} = {};

const seedTestRecords = async (): Promise<void> => {
  const placement = await Placement.create({
    studentName: `${TEST_PREFIX}Rahul Patil`,
    company: `${TEST_PREFIX}Infosys`,
    role: 'Software Engineer',
    joiningDate: new Date('2026-07-09'),
  });
  seededIds.placementId = String(placement._id);

  const internship = await Internship.create({
    studentName: `${TEST_PREFIX}Ananya Deshmukh`,
    company: `${TEST_PREFIX}TCS`,
    role: 'Intern',
    startDate: new Date('2026-05-01'),
    endDate: new Date('2026-06-30'),
  });
  seededIds.internshipId = String(internship._id);

  const studentAchievement = await StudentAchievement.create({
    studentName: `${TEST_PREFIX}Rohit Sharma`,
    achievementType: 'Sports',
    title: `${TEST_PREFIX}Inter-College Sports Meet 2026`,
    date: new Date('2026-07-01'),
  });
  seededIds.studentAchievementId = String(studentAchievement._id);

  const facultyAchievement = await FacultyAchievement.create({
    facultyName: `${TEST_PREFIX}Dr. Meera Kulkarni`,
    achievementType: 'Award',
    title: `${TEST_PREFIX}Best Teacher Award 2026`,
    date: new Date('2026-06-20'),
    organization: `${TEST_PREFIX}State Education Board`,
  });
  seededIds.facultyAchievementId = String(facultyAchievement._id);

  const event = await CompletedEventReport.create({
    eventTitle: `${TEST_PREFIX}Cloud Computing Workshop`,
    eventType: 'Workshop',
    date: new Date('2026-06-20'),
    venue: `${TEST_PREFIX}Seminar Hall A`,
  });
  seededIds.eventId = String(event._id);

  const publication = await Publication.create({
    facultyName: `${TEST_PREFIX}Dr. Meera Kulkarni`,
    paperTitle: `${TEST_PREFIX}Edge AI for Smart Campus Systems`,
    journal: `${TEST_PREFIX}IEEE Access`,
    publicationDate: new Date('2026-07-03'),
  });
  seededIds.publicationId = String(publication._id);

  const patent = await Patent.create({
    patentTitle: `${TEST_PREFIX}Smart Attendance Monitoring System`,
    inventors: [`${TEST_PREFIX}Prof. Ajay Naik`],
    status: 'Filed',
    filingDate: new Date('2026-05-30'),
  });
  seededIds.patentId = String(patent._id);

  const pending = await PendingRecord.create({
    originalMessage: `${TEST_PREFIX}Pending placement record for Vikram Singh at Wipro.`,
    category: 'Placement',
    extractedData: {
      title: `${TEST_PREFIX}Pending placement record`,
      studentNames: [`${TEST_PREFIX}Vikram Singh`],
      company: `${TEST_PREFIX}Wipro`,
      placement: 'Trainee',
      date: '2026-07-05',
    },
    confidenceScore: 88,
  });
  seededIds.pendingId = String(pending._id);
};

const cleanupTestRecords = async (): Promise<void> => {
  await Promise.all([
    Placement.deleteMany({ studentName: new RegExp(`^${TEST_PREFIX}`) }),
    Internship.deleteMany({ studentName: new RegExp(`^${TEST_PREFIX}`) }),
    StudentAchievement.deleteMany({ studentName: new RegExp(`^${TEST_PREFIX}`) }),
    FacultyAchievement.deleteMany({ facultyName: new RegExp(`^${TEST_PREFIX}`) }),
    CompletedEventReport.deleteMany({ eventTitle: new RegExp(`^${TEST_PREFIX}`) }),
    Publication.deleteMany({ facultyName: new RegExp(`^${TEST_PREFIX}`) }),
    Patent.deleteMany({ patentTitle: new RegExp(`^${TEST_PREFIX}`) }),
    PendingRecord.deleteMany({ originalMessage: new RegExp(TEST_PREFIX) }),
  ]);
};

const buildTestCases = (): DuplicateTestCase[] => [
  {
    name: 'Exact placement duplicate',
    category: 'Placement',
    extractedData: {
      title: 'Placement success',
      studentNames: [`${TEST_PREFIX}Rahul Patil`],
      company: `${TEST_PREFIX}Infosys`,
      placement: 'Software Engineer',
      date: '2026-07-09',
    },
    expectedDuplicate: true,
    expectedMatchingId: seededIds.placementId,
  },
  {
    name: 'Different placement company',
    category: 'Placement',
    extractedData: {
      studentNames: [`${TEST_PREFIX}Rahul Patil`],
      company: `${TEST_PREFIX}Capgemini`,
      placement: 'Analyst',
      date: '2026-07-09',
    },
    expectedDuplicate: false,
  },
  {
    name: 'Internship duplicate',
    category: 'Internship',
    extractedData: {
      studentNames: [`${TEST_PREFIX}Ananya Deshmukh`],
      company: `${TEST_PREFIX}TCS`,
      internship: `${TEST_PREFIX}TCS`,
      date: '2026-06-30',
    },
    expectedDuplicate: true,
    expectedMatchingId: seededIds.internshipId,
  },
  {
    name: 'Student achievement duplicate',
    category: 'Student Achievement',
    extractedData: {
      studentNames: [`${TEST_PREFIX}Rohit Sharma`],
      title: `${TEST_PREFIX}Inter-College Sports Meet 2026`,
      achievementType: 'Sports',
      date: '2026-07-01',
    },
    expectedDuplicate: true,
    expectedMatchingId: seededIds.studentAchievementId,
  },
  {
    name: 'Faculty achievement duplicate',
    category: 'Faculty Achievement',
    extractedData: {
      facultyNames: [`${TEST_PREFIX}Dr. Meera Kulkarni`],
      title: `${TEST_PREFIX}Best Teacher Award 2026`,
      organization: `${TEST_PREFIX}State Education Board`,
      date: '2026-06-20',
    },
    expectedDuplicate: true,
    expectedMatchingId: seededIds.facultyAchievementId,
  },
  {
    name: 'Workshop duplicate',
    category: 'Workshop',
    extractedData: {
      eventName: `${TEST_PREFIX}Cloud Computing Workshop`,
      eventType: 'Workshop',
      location: `${TEST_PREFIX}Seminar Hall A`,
      date: '2026-06-20',
    },
    expectedDuplicate: true,
    expectedMatchingId: seededIds.eventId,
  },
  {
    name: 'Publication duplicate',
    category: 'Publication',
    extractedData: {
      facultyNames: [`${TEST_PREFIX}Dr. Meera Kulkarni`],
      publicationTitle: `${TEST_PREFIX}Edge AI for Smart Campus Systems`,
      organization: `${TEST_PREFIX}IEEE Access`,
      date: '2026-07-03',
    },
    expectedDuplicate: true,
    expectedMatchingId: seededIds.publicationId,
  },
  {
    name: 'Patent duplicate',
    category: 'Patent',
    extractedData: {
      patentTitle: `${TEST_PREFIX}Smart Attendance Monitoring System`,
      facultyNames: [`${TEST_PREFIX}Prof. Ajay Naik`],
      date: '2026-05-30',
    },
    expectedDuplicate: true,
    expectedMatchingId: seededIds.patentId,
  },
  {
    name: 'Pending record duplicate',
    category: 'Placement',
    extractedData: {
      title: `${TEST_PREFIX}Pending placement record`,
      studentNames: [`${TEST_PREFIX}Vikram Singh`],
      company: `${TEST_PREFIX}Wipro`,
      placement: 'Trainee',
      date: '2026-07-05',
    },
    expectedDuplicate: true,
    expectedMatchingId: seededIds.pendingId,
  },
  {
    name: 'Unrelated sparse record',
    category: 'Other',
    extractedData: {
      title: `${TEST_PREFIX}Completely unrelated notice`,
      description: 'Submit attendance by Friday.',
    },
    expectedDuplicate: false,
  },
  {
    name: 'Seminar non-duplicate',
    category: 'Seminar',
    extractedData: {
      eventName: `${TEST_PREFIX}Unique Quantum Seminar`,
      organization: `${TEST_PREFIX}Research Center`,
      date: '2026-08-01',
    },
    expectedDuplicate: false,
  },
];

const testSimilarityUtility = (): void => {
  console.log('\n--- Similarity utility ---');

  const source = toComparableFields({
    studentNames: ['Rahul Patil'],
    company: 'Infosys',
    placement: 'Software Engineer',
    date: '2026-07-09',
  });
  const target = toComparableFields({
    studentNames: ['Rahul Patil'],
    company: 'Infosys',
    placement: 'Software Engineer',
    date: '2026-07-09',
  });

  const score = calculateSimilarityScore('Placement', source, target);
  assert(score >= getDuplicateThreshold(), 'Exact comparable fields exceed duplicate threshold');
};

const testRepositoryCandidates = async (): Promise<void> => {
  console.log('\n--- Repository candidate lookup ---');

  const candidates = await duplicateDetectionRepository.findCandidates('Placement', {
    studentNames: [`${TEST_PREFIX}Rahul Patil`],
    company: `${TEST_PREFIX}Infosys`,
  });

  assert(candidates.length > 0, 'Repository returns MongoDB candidates for placement lookup');
  assert(
    candidates.some((candidate) => candidate.id === seededIds.placementId),
    'Repository includes seeded placement record',
  );
};

const testDuplicateDetectionCases = async (): Promise<void> => {
  console.log('\n--- Duplicate detection cases ---');

  const cases = buildTestCases();
  assert(cases.length >= 10, 'At least ten duplicate detection cases are defined');

  for (const testCase of cases) {
    const response = await duplicateDetectionAgent.detect({
      category: testCase.category,
      extractedData: testCase.extractedData,
    });

    assert(
      typeof response.result.duplicate === 'boolean',
      `${testCase.name}: duplicate flag is boolean`,
    );
    assert(
      typeof response.result.similarityScore === 'number',
      `${testCase.name}: similarity score is numeric`,
    );
    assert(
      response.result.duplicate === testCase.expectedDuplicate,
      `${testCase.name}: duplicate=${testCase.expectedDuplicate}`,
    );

    if (testCase.expectedDuplicate) {
      assert(
        response.result.matchingRecordId !== null,
        `${testCase.name}: duplicate result includes matching record id`,
      );

      if (testCase.expectedMatchingId) {
        assert(
          response.result.matchingRecordId === testCase.expectedMatchingId,
          `${testCase.name}: matching record id matches seeded record`,
        );
      }
    } else {
      assert(
        response.result.matchingRecordId === null,
        `${testCase.name}: non-duplicate result has no matching record id`,
      );
    }

    console.log(
      `PASS: ${testCase.name} (score=${response.result.similarityScore}, duplicate=${response.result.duplicate})`,
    );
  }
};

const runTests = async (): Promise<void> => {
  console.log('Running duplicate detection tests...');

  testSimilarityUtility();

  await connectDatabase();
  await cleanupTestRecords();
  await seedTestRecords();

  try {
    await testRepositoryCandidates();
    await testDuplicateDetectionCases();
  } finally {
    await cleanupTestRecords();
    await disconnectDatabase();
  }

  console.log('\nAll duplicate detection tests passed.');
};

runTests().catch(async (error) => {
  console.error('\nDuplicate detection tests failed:', error);

  try {
    await cleanupTestRecords();
    await disconnectDatabase();
  } catch {
    // Ignore cleanup failures after test failure.
  }

  process.exit(1);
});
