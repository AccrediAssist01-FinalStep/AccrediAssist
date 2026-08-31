import { getFacultyModuleReportDefinition } from '../config/faculty-module-reports.config';
import type { FacultyActivityModuleTable } from './faculty-activity-module-rows.util';
import {
  collectActivityPhotographCandidates,
  firstNonEmpty,
  joinCaptionParts,
} from '../../utils/activity-module-photographs.util';

const resolveFacultyActivityDetail = (record: Record<string, unknown>, sectionKey?: string): string => {
  switch (sectionKey) {
    case 'fdp':
    case 'workshops':
    case 'seminars':
    case 'guest-lectures':
      return firstNonEmpty(record.eventTitle, record.venue, record.title, record.organization);
    case 'publications':
    case 'book-chapters':
      return firstNonEmpty(record.paperTitle, record.journal, record.conference, record.title);
    case 'patents':
      return firstNonEmpty(record.patentTitle, record.title);
    case 'mous':
    case 'resource-person':
    case 'session-chair-reviewer':
    case 'consultancy':
    case 'sponsored-projects':
      return firstNonEmpty(record.organization, record.title, record.eventTitle);
    case 'certifications':
    case 'awards':
    case 'conferences':
      return firstNonEmpty(record.title, record.organization, record.eventTitle);
    default:
      return firstNonEmpty(
        record.title,
        record.eventTitle,
        record.paperTitle,
        record.patentTitle,
        record.organization,
      );
  }
};

export const buildFacultyPhotographCaption = (
  record: Record<string, unknown>,
  captionPrefix: string,
  sectionKey?: string,
): string => {
  const facultyName = firstNonEmpty(record.facultyName, record.coordinator, record.inventors);
  const activityDetail = resolveFacultyActivityDetail(record, sectionKey);
  return joinCaptionParts(facultyName, activityDetail) || captionPrefix;
};

export const collectFacultyModulePhotographCandidates = (tables: FacultyActivityModuleTable[]) =>
  collectActivityPhotographCandidates(tables, (record, sectionKey, heading) =>
    buildFacultyPhotographCaption(
      record,
      getFacultyModuleReportDefinition(sectionKey)?.captionPrefix ?? heading,
      sectionKey,
    ),
  );
