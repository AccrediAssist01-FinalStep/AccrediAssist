import { FilterQuery, Types } from 'mongoose';
import { CompletedEventReport } from '../../models/CompletedEventReport';
import { FacultyAchievement } from '../../models/FacultyAchievement';
import { Internship } from '../../models/Internship';
import { Patent } from '../../models/Patent';
import { PendingRecord } from '../../models/PendingRecord';
import { Placement } from '../../models/Placement';
import { Publication } from '../../models/Publication';
import { StudentAchievement } from '../../models/StudentAchievement';
import {
  DuplicateCollectionName,
  DuplicateRecordCandidate,
} from '../interfaces/duplicate-detection.interface';
import { toComparableFields, toStringArray, toStringValue } from '../utils/duplicate-similarity.util';

const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const mapPendingCategory = (category: string): string | null => {
  const mapping: Record<string, string> = {
    Placement: 'Placement',
    Internship: 'Internship',
    Workshop: 'Workshop',
    Seminar: 'Seminar',
    'Industrial Visit': 'Industrial Visit',
    'Student Achievement': 'Student Achievement',
    'Faculty Achievement': 'Faculty Achievement',
    Publication: 'Publication',
    Patent: 'Patent',
  };

  return mapping[category] ?? null;
};

const buildRegexFilters = (
  extractedData: Record<string, unknown>,
  fields: string[],
): FilterQuery<unknown>[] => {
  const filters: FilterQuery<unknown>[] = [];

  for (const field of fields) {
    const value = extractedData[field];

    if (typeof value === 'string' && value.trim()) {
      filters.push({ [field]: new RegExp(escapeRegex(value.trim()), 'i') });
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === 'string' && item.trim()) {
          filters.push({ [field]: new RegExp(escapeRegex(item.trim()), 'i') });
        }
      }
    }
  }

  return filters;
};

const toCandidate = (
  id: Types.ObjectId | string,
  collection: DuplicateCollectionName,
  fields: Record<string, unknown>,
): DuplicateRecordCandidate => ({
  id: String(id),
  collection,
  fields: toComparableFields(fields),
});

export class DuplicateDetectionRepository {
  async findCandidates(
    category: string,
    extractedData: Record<string, unknown>,
  ): Promise<DuplicateRecordCandidate[]> {
    switch (category) {
      case 'Placement':
        return this.findPlacementCandidates(extractedData);
      case 'Internship':
        return this.findInternshipCandidates(extractedData);
      case 'Student Achievement':
        return this.findStudentAchievementCandidates(extractedData);
      case 'Faculty Achievement':
        return this.findFacultyAchievementCandidates(extractedData);
      case 'Workshop':
      case 'Seminar':
      case 'Industrial Visit':
      case 'Completed Event Report':
        return this.findEventCandidates(extractedData);
      case 'Publication':
        return this.findPublicationCandidates(extractedData);
      case 'Patent':
        return this.findPatentCandidates(extractedData);
      default:
        return this.findPendingCandidates(null, extractedData);
    }
  }

  private async findPlacementCandidates(
    extractedData: Record<string, unknown>,
  ): Promise<DuplicateRecordCandidate[]> {
    const studentName = toStringArray(extractedData.studentNames)?.[0] ?? null;
    const company = toStringValue(extractedData.company);
    const filters = buildRegexFilters(
      {
        studentName: studentName ?? undefined,
        company: company ?? undefined,
      },
      ['studentName', 'company'],
    );

    const [placements, pending] = await Promise.all([
      filters.length > 0
        ? Placement.find({ $or: filters }).sort({ createdAt: -1 }).limit(25).lean()
        : [],
      this.findPendingCandidates('Placement', extractedData),
    ]);

    return [
      ...placements.map((record) =>
        toCandidate(record._id, 'placements', {
          studentNames: [record.studentName],
          company: record.company,
          placement: record.role,
          date: record.joiningDate?.toISOString() ?? null,
          title: `${record.studentName} placement at ${record.company}`,
        }),
      ),
      ...pending,
    ];
  }

  private async findInternshipCandidates(
    extractedData: Record<string, unknown>,
  ): Promise<DuplicateRecordCandidate[]> {
    const studentName = toStringArray(extractedData.studentNames)?.[0] ?? null;
    const company = toStringValue(extractedData.company) ?? toStringValue(extractedData.internship);
    const filters = buildRegexFilters(
      {
        studentName: studentName ?? undefined,
        company: company ?? undefined,
      },
      ['studentName', 'company'],
    );

    const [internships, pending] = await Promise.all([
      filters.length > 0
        ? Internship.find({ $or: filters }).sort({ createdAt: -1 }).limit(25).lean()
        : [],
      this.findPendingCandidates('Internship', extractedData),
    ]);

    return [
      ...internships.map((record) =>
        toCandidate(record._id, 'internships', {
          studentNames: [record.studentName],
          company: record.company,
          internship: record.company,
          date: record.endDate?.toISOString() ?? record.startDate?.toISOString() ?? null,
          title: `${record.studentName} internship at ${record.company}`,
        }),
      ),
      ...pending,
    ];
  }

  private async findStudentAchievementCandidates(
    extractedData: Record<string, unknown>,
  ): Promise<DuplicateRecordCandidate[]> {
    const studentName = toStringArray(extractedData.studentNames)?.[0] ?? null;
    const title = toStringValue(extractedData.title) ?? toStringValue(extractedData.eventName);
    const filters = buildRegexFilters(
      {
        studentName: studentName ?? undefined,
        title: title ?? undefined,
      },
      ['studentName', 'title'],
    );

    const [achievements, pending] = await Promise.all([
      filters.length > 0
        ? StudentAchievement.find({ $or: filters }).sort({ createdAt: -1 }).limit(25).lean()
        : [],
      this.findPendingCandidates('Student Achievement', extractedData),
    ]);

    return [
      ...achievements.map((record) =>
        toCandidate(record._id, 'student_achievements', {
          studentNames: [record.studentName],
          title: record.title,
          eventName: record.eventName ?? record.title,
          achievementType: record.achievementType,
          date: record.date?.toISOString() ?? null,
        }),
      ),
      ...pending,
    ];
  }

  private async findFacultyAchievementCandidates(
    extractedData: Record<string, unknown>,
  ): Promise<DuplicateRecordCandidate[]> {
    const facultyName = toStringArray(extractedData.facultyNames)?.[0] ?? null;
    const title = toStringValue(extractedData.title);
    const filters = buildRegexFilters(
      {
        facultyName: facultyName ?? undefined,
        title: title ?? undefined,
      },
      ['facultyName', 'title'],
    );

    const [achievements, pending] = await Promise.all([
      filters.length > 0
        ? FacultyAchievement.find({ $or: filters }).sort({ createdAt: -1 }).limit(25).lean()
        : [],
      this.findPendingCandidates('Faculty Achievement', extractedData),
    ]);

    return [
      ...achievements.map((record) =>
        toCandidate(record._id, 'faculty_achievements', {
          facultyNames: [record.facultyName],
          title: record.title,
          organization: record.organization,
          date: record.date?.toISOString() ?? null,
        }),
      ),
      ...pending,
    ];
  }

  private async findEventCandidates(
    extractedData: Record<string, unknown>,
  ): Promise<DuplicateRecordCandidate[]> {
    const eventTitle =
      toStringValue(extractedData.eventName) ?? toStringValue(extractedData.title);
    const filters = buildRegexFilters(
      {
        eventTitle: eventTitle ?? undefined,
        venue: toStringValue(extractedData.location) ?? undefined,
      },
      ['eventTitle', 'venue'],
    );

    const pendingCategory = mapPendingCategory(
      toStringValue(extractedData.eventType) ?? 'Workshop',
    );

    const [events, pending] = await Promise.all([
      filters.length > 0
        ? CompletedEventReport.find({ $or: filters }).sort({ createdAt: -1 }).limit(25).lean()
        : [],
      this.findPendingCandidates(pendingCategory, extractedData),
    ]);

    return [
      ...events.map((record) =>
        toCandidate(record._id, 'completed_event_reports', {
          eventName: record.eventTitle,
          title: record.eventTitle,
          eventType: record.eventType,
          location: record.venue,
          date: record.date?.toISOString() ?? null,
        }),
      ),
      ...pending,
    ];
  }

  private async findPublicationCandidates(
    extractedData: Record<string, unknown>,
  ): Promise<DuplicateRecordCandidate[]> {
    const facultyName = toStringArray(extractedData.facultyNames)?.[0] ?? null;
    const paperTitle = toStringValue(extractedData.publicationTitle);
    const filters = buildRegexFilters(
      {
        facultyName: facultyName ?? undefined,
        paperTitle: paperTitle ?? undefined,
      },
      ['facultyName', 'paperTitle'],
    );

    const [publications, pending] = await Promise.all([
      filters.length > 0
        ? Publication.find({ $or: filters }).sort({ createdAt: -1 }).limit(25).lean()
        : [],
      this.findPendingCandidates('Publication', extractedData),
    ]);

    return [
      ...publications.map((record) =>
        toCandidate(record._id, 'publications', {
          facultyNames: [record.facultyName],
          publicationTitle: record.paperTitle,
          organization: record.journal ?? record.conference ?? null,
          date: record.publicationDate?.toISOString() ?? null,
        }),
      ),
      ...pending,
    ];
  }

  private async findPatentCandidates(
    extractedData: Record<string, unknown>,
  ): Promise<DuplicateRecordCandidate[]> {
    const patentTitle = toStringValue(extractedData.patentTitle) ?? toStringValue(extractedData.title);
    const filters = buildRegexFilters(
      {
        patentTitle: patentTitle ?? undefined,
      },
      ['patentTitle'],
    );

    const [patents, pending] = await Promise.all([
      filters.length > 0
        ? Patent.find({ $or: filters }).sort({ createdAt: -1 }).limit(25).lean()
        : [],
      this.findPendingCandidates('Patent', extractedData),
    ]);

    return [
      ...patents.map((record) =>
        toCandidate(record._id, 'patents', {
          patentTitle: record.patentTitle,
          facultyNames: record.inventors,
          date: record.filingDate?.toISOString() ?? null,
        }),
      ),
      ...pending,
    ];
  }

  private async findPendingCandidates(
    category: string | null,
    extractedData: Record<string, unknown>,
  ): Promise<DuplicateRecordCandidate[]> {
    const query: FilterQuery<typeof PendingRecord> = category ? { category } : {};
    const title =
      toStringValue(extractedData.title) ??
      toStringValue(extractedData.publicationTitle) ??
      toStringValue(extractedData.patentTitle) ??
      toStringValue(extractedData.eventName);

    if (title) {
      query.$or = [
        { originalMessage: new RegExp(escapeRegex(title), 'i') },
        { 'extractedData.title': new RegExp(escapeRegex(title), 'i') },
      ];
    }

    const pendingRecords = await PendingRecord.find(query)
      .sort({ createdAt: -1 })
      .limit(25)
      .lean();

    return pendingRecords.map((record) =>
      toCandidate(record._id, 'pending_records', {
        ...(typeof record.extractedData === 'object' && record.extractedData !== null
          ? (record.extractedData as Record<string, unknown>)
          : {}),
        title:
          toStringValue(
            (record.extractedData as Record<string, unknown> | undefined)?.title,
          ) ?? record.originalMessage,
        description: record.originalMessage,
      }),
    );
  }
}

export const duplicateDetectionRepository = new DuplicateDetectionRepository();
