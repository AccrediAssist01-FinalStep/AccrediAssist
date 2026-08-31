import { getStudentModuleReportDefinition } from '../config/student-module-reports.config';
import type { StudentActivityModuleTable } from './student-activity-module-rows.util';
import {
  collectActivityPhotographCandidates,
  extractRecordImageUrls,
  firstNonEmpty,
  joinCaptionParts,
  resolveActivityPhotographs,
  type ActivityPhotographCandidate,
  type ResolvedActivityPhotograph,
} from '../../utils/activity-module-photographs.util';

export type StudentModulePhotographCandidate = ActivityPhotographCandidate;
export type ResolvedStudentModulePhotograph = ResolvedActivityPhotograph;
export { extractRecordImageUrls, resolveActivityPhotographs as resolveStudentModulePhotographs };

const resolveActivityDetail = (record: Record<string, unknown>, sectionKey?: string): string => {
  switch (sectionKey) {
    case 'internships':
    case 'placements':
      return firstNonEmpty(record.company, record.role, record.title);
    case 'sponsored-projects':
      return firstNonEmpty(record.title, record.organization);
    case 'workshops':
    case 'seminars':
    case 'industrial-visits':
      return firstNonEmpty(record.eventTitle, record.venue, record.title);
    case 'research':
      return firstNonEmpty(record.title, record.paperTitle, record.organization);
    case 'sports':
    case 'cultural':
    case 'technical':
    case 'certifications':
    case 'startup-innovation':
    case 'nss-ncc':
      return firstNonEmpty(record.title, record.organization, record.eventTitle);
    default:
      return firstNonEmpty(
        record.title,
        record.eventTitle,
        record.paperTitle,
        record.company,
        record.organization,
      );
  }
};

export const buildStudentPhotographCaption = (
  record: Record<string, unknown>,
  captionPrefix: string,
  sectionKey?: string,
): string => {
  const studentName = firstNonEmpty(record.studentName, record.coordinator);
  const activityDetail = resolveActivityDetail(record, sectionKey);
  return joinCaptionParts(studentName, activityDetail) || captionPrefix;
};

export const collectStudentModulePhotographCandidates = (
  tables: StudentActivityModuleTable[],
): StudentModulePhotographCandidate[] =>
  collectActivityPhotographCandidates(tables, (record, sectionKey, heading) =>
    buildStudentPhotographCaption(
      record,
      getStudentModuleReportDefinition(sectionKey)?.captionPrefix ?? heading,
      sectionKey,
    ),
  );
