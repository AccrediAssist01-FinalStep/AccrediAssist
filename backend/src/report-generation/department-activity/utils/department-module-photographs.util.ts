import { getDepartmentModuleReportDefinition } from '../config/department-module-reports.config';
import type { DepartmentActivityModuleTable } from './department-activity-module-rows.util';
import {
  collectActivityPhotographCandidates,
  firstNonEmpty,
  joinCaptionParts,
} from '../../utils/activity-module-photographs.util';

const resolveDepartmentActivityDetail = (
  record: Record<string, unknown>,
  sectionKey?: string,
): string => {
  switch (sectionKey) {
    case 'department-events':
    case 'industrial-visits':
      return firstNonEmpty(record.eventTitle, record.venue, record.title);
    case 'department-notifications':
      return firstNonEmpty(record.headline, record.newspaperName, record.title);
    case 'achievement-repository':
      return firstNonEmpty(record.title, record.organization, record.eventTitle);
    case 'accreditation-activities':
    case 'department-achievements':
      return firstNonEmpty(record.title, record.organization, record.eventTitle);
    default:
      return firstNonEmpty(
        record.eventTitle,
        record.headline,
        record.title,
        record.organization,
      );
  }
};

export const buildDepartmentPhotographCaption = (
  record: Record<string, unknown>,
  captionPrefix: string,
  sectionKey?: string,
): string => {
  const personName = firstNonEmpty(
    record.facultyName,
    record.studentName,
    record.coordinator,
  );
  const activityDetail = resolveDepartmentActivityDetail(record, sectionKey);
  return joinCaptionParts(personName, activityDetail) || captionPrefix;
};

export const collectDepartmentModulePhotographCandidates = (
  tables: DepartmentActivityModuleTable[],
) =>
  collectActivityPhotographCandidates(tables, (record, sectionKey, heading) =>
    buildDepartmentPhotographCaption(
      record,
      getDepartmentModuleReportDefinition(sectionKey)?.captionPrefix ?? heading,
      sectionKey,
    ),
  );
