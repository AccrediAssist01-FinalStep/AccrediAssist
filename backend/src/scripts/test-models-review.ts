/**
 * Structural review of all MongoDB models (no database connection required).
 *
 * Run: npm run test:models-review
 */

import { Schema } from 'mongoose';
import {
  User,
  PendingRecord,
  StudentAchievement,
  FacultyAchievement,
  Placement,
  Internship,
  CompletedEventReport,
  Publication,
  Patent,
  Report,
  Notification,
  AuditLog,
} from '../models';

interface ModelSpec {
  name: string;
  model: { schema: Schema; collection: { collectionName: string } };
  collection: string;
  requiredPaths: string[];
  indexFields: string[];
}

const assert = (condition: boolean, message: string): void => {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
  console.log(`PASS: ${message}`);
};

const hasIndexField = (schema: Schema, field: string): boolean => {
  const indexes = schema.indexes();
  return indexes.some((index) => {
    const fields = index[0] as Record<string, number>;
    return Object.prototype.hasOwnProperty.call(fields, field);
  });
};

const specs: ModelSpec[] = [
  {
    name: 'User',
    model: User,
    collection: 'users',
    requiredPaths: ['name', 'email', 'password', 'role', 'isActive', 'isDeleted', 'createdAt', 'updatedAt'],
    indexFields: ['email'],
  },
  {
    name: 'PendingRecord',
    model: PendingRecord,
    collection: 'pending_records',
    requiredPaths: ['originalMessage', 'category', 'confidenceScore', 'status', 'isDeleted', 'createdAt', 'updatedAt'],
    indexFields: ['status', 'category', 'createdAt'],
  },
  {
    name: 'StudentAchievement',
    model: StudentAchievement,
    collection: 'student_achievements',
    requiredPaths: ['studentName', 'achievementType', 'title', 'date', 'isDeleted', 'createdAt', 'updatedAt'],
    indexFields: ['studentName', 'achievementType', 'department', 'date'],
  },
  {
    name: 'FacultyAchievement',
    model: FacultyAchievement,
    collection: 'faculty_achievements',
    requiredPaths: ['facultyName', 'achievementType', 'title', 'date', 'isDeleted', 'createdAt', 'updatedAt'],
    indexFields: ['facultyName', 'achievementType'],
  },
  {
    name: 'Placement',
    model: Placement,
    collection: 'placements',
    requiredPaths: ['studentName', 'company', 'isDeleted', 'createdAt', 'updatedAt'],
    indexFields: ['studentName', 'company'],
  },
  {
    name: 'Internship',
    model: Internship,
    collection: 'internships',
    requiredPaths: ['studentName', 'company', 'isDeleted', 'createdAt', 'updatedAt'],
    indexFields: ['studentName', 'company'],
  },
  {
    name: 'CompletedEventReport',
    model: CompletedEventReport,
    collection: 'completed_event_reports',
    requiredPaths: ['eventTitle', 'eventType', 'isDeleted', 'createdAt', 'updatedAt'],
    indexFields: ['eventTitle', 'eventType', 'date'],
  },
  {
    name: 'Publication',
    model: Publication,
    collection: 'publications',
    requiredPaths: ['facultyName', 'paperTitle', 'isDeleted', 'createdAt', 'updatedAt'],
    indexFields: ['facultyName', 'paperTitle'],
  },
  {
    name: 'Patent',
    model: Patent,
    collection: 'patents',
    requiredPaths: ['patentTitle', 'status', 'isDeleted', 'createdAt', 'updatedAt'],
    indexFields: ['patentTitle'],
  },
  {
    name: 'Report',
    model: Report,
    collection: 'reports',
    requiredPaths: ['reportTitle', 'reportType', 'generatedBy', 'generatedDate', 'isDeleted', 'createdAt', 'updatedAt'],
    indexFields: ['reportType', 'generatedDate'],
  },
  {
    name: 'Notification',
    model: Notification,
    collection: 'notifications',
    requiredPaths: ['title', 'message', 'userId', 'isRead', 'type', 'isDeleted', 'createdAt', 'updatedAt'],
    indexFields: ['userId', 'isRead'],
  },
  {
    name: 'AuditLog',
    model: AuditLog,
    collection: 'audit_logs',
    requiredPaths: ['action', 'module', 'timestamp', 'isDeleted', 'createdAt', 'updatedAt'],
    indexFields: ['timestamp'],
  },
];

const relationshipRefs: Array<{ model: string; path: string; ref: string }> = [
  { model: 'PendingRecord', path: 'reviewedBy', ref: 'User' },
  { model: 'StudentAchievement', path: 'approvedBy', ref: 'User' },
  { model: 'FacultyAchievement', path: 'approvedBy', ref: 'User' },
  { model: 'Placement', path: 'approvedBy', ref: 'User' },
  { model: 'Internship', path: 'approvedBy', ref: 'User' },
  { model: 'CompletedEventReport', path: 'approvedBy', ref: 'User' },
  { model: 'Report', path: 'generatedBy', ref: 'User' },
  { model: 'Notification', path: 'userId', ref: 'User' },
  { model: 'AuditLog', path: 'userId', ref: 'User' },
];

const runReview = (): void => {
  console.log('Running MongoDB model structural review...\n');

  assert(specs.length === 12, 'All 12 Document 16 models are registered');

  for (const spec of specs) {
    const { schema } = spec.model;

    assert(
      spec.model.collection.collectionName === spec.collection,
      `${spec.name} uses collection "${spec.collection}"`,
    );

    for (const path of spec.requiredPaths) {
      assert(!!schema.path(path), `${spec.name} schema defines "${path}"`);
    }

    assert(schema.options.timestamps === true, `${spec.name} enables Mongoose timestamps`);
    assert(typeof schema.methods.softDelete === 'function', `${spec.name} supports softDelete()`);
    assert(typeof schema.methods.restore === 'function', `${spec.name} supports restore()`);

    for (const field of spec.indexFields) {
      assert(hasIndexField(schema, field), `${spec.name} indexes "${field}"`);
    }
  }

  for (const rel of relationshipRefs) {
    const spec = specs.find((entry) => entry.name === rel.model);
    if (!spec) continue;

    const path = spec.model.schema.path(rel.path) as { options?: { ref?: string } } | undefined;
    assert(!!path, `${rel.model}.${rel.path} relationship path exists`);
    assert(path?.options?.ref === rel.ref, `${rel.model}.${rel.path} references "${rel.ref}"`);
  }

  console.log('\nAll MongoDB model structural checks passed.');
};

try {
  runReview();
} catch (error) {
  console.error('\nMongoDB model structural review failed:', error);
  process.exit(1);
}
