import { StudentAchievement } from '../models/StudentAchievement';
import { FacultyAchievement } from '../models/FacultyAchievement';
import { Placement } from '../models/Placement';
import { Internship } from '../models/Internship';
import { Publication } from '../models/Publication';
import { Patent } from '../models/Patent';
import { CompletedEventReport } from '../models/CompletedEventReport';
import { News } from '../models/News';
import { PendingApprovalTargetModule } from '../types/pendingRecordApproval.types';
import { toStringValue } from '../ai/utils/duplicate-similarity.util';
import {
  getFacultyNameFromExtractedData,
  getStudentNameFromExtractedData,
  normalizeExtractedPersonFields,
} from './extractedPersonFields.util';

const compactPatch = (patch: Record<string, unknown>): Record<string, unknown> =>
  Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined && value !== null));

export const enrichExtractedDataFromApprovedRecord = async (
  targetModule: PendingApprovalTargetModule,
  recordId: string,
  extractedData: Record<string, unknown>,
): Promise<Record<string, unknown>> => {
  const patch = await loadApprovedRecordPatch(targetModule, recordId);
  return {
    ...extractedData,
    ...compactPatch(patch),
  };
};

const loadApprovedRecordPatch = async (
  targetModule: PendingApprovalTargetModule,
  recordId: string,
): Promise<Record<string, unknown>> => {
  switch (targetModule) {
    case 'StudentAchievement': {
      const doc = await StudentAchievement.findById(recordId).lean();
      if (!doc) return {};
      return {
        studentName: doc.studentName,
        rollNumber: doc.rollNumber,
        department: doc.department,
        title: doc.title,
        description: doc.description,
        organization: doc.organization,
        achievementType: doc.achievementType,
        date: doc.date?.toISOString(),
        certificates: doc.certificateUrl ? [doc.certificateUrl] : undefined,
        photoUrls: doc.photos,
      };
    }
    case 'FacultyAchievement': {
      const doc = await FacultyAchievement.findById(recordId).lean();
      if (!doc) return {};
      return {
        facultyName: doc.facultyName,
        designation: doc.designation,
        title: doc.title,
        description: doc.description,
        organization: doc.organization,
        achievementType: doc.achievementType,
        date: doc.date?.toISOString(),
        certificates: doc.certificateUrl ? [doc.certificateUrl] : undefined,
        photoUrls: doc.photos,
      };
    }
    case 'Placement': {
      const doc = await Placement.findById(recordId).lean();
      if (!doc) return {};
      return {
        studentName: doc.studentName,
        rollNumber: doc.rollNumber,
        department: doc.department,
        company: doc.company,
        role: doc.role,
        package: doc.package,
        date: doc.joiningDate?.toISOString(),
        joiningDate: doc.joiningDate?.toISOString(),
        certificates: doc.offerLetter ? [doc.offerLetter] : undefined,
      };
    }
    case 'Internship': {
      const doc = await Internship.findById(recordId).lean();
      if (!doc) return {};
      return {
        studentName: doc.studentName,
        rollNumber: doc.rollNumber,
        company: doc.company,
        role: doc.role,
        duration: doc.duration,
        startDate: doc.startDate?.toISOString(),
        endDate: doc.endDate?.toISOString(),
        certificates: doc.certificateUrl ? [doc.certificateUrl] : undefined,
      };
    }
    case 'Publication': {
      const doc = await Publication.findById(recordId).lean();
      if (!doc) return {};
      return {
        facultyName: doc.facultyName,
        publicationTitle: doc.paperTitle,
        title: doc.paperTitle,
        journal: doc.journal,
        conference: doc.conference,
        facultyNames: doc.authors,
        publicationDate: doc.publicationDate?.toISOString(),
        date: doc.publicationDate?.toISOString(),
        certificates: doc.documentUrl ? [doc.documentUrl] : undefined,
      };
    }
    case 'Patent': {
      const doc = await Patent.findById(recordId).lean();
      if (!doc) return {};
      return {
        patentTitle: doc.patentTitle,
        title: doc.patentTitle,
        inventors: doc.inventors,
        facultyNames: doc.inventors,
        patentNumber: doc.patentNumber,
        patentStatus: doc.status,
        filingDate: doc.filingDate?.toISOString(),
        date: doc.filingDate?.toISOString(),
        certificates: doc.documentUrl ? [doc.documentUrl] : undefined,
      };
    }
    case 'CompletedEventReport': {
      const doc = await CompletedEventReport.findById(recordId).lean();
      if (!doc) return {};
      return {
        eventName: doc.eventTitle,
        title: doc.eventTitle,
        eventType: doc.eventType,
        reportType: doc.eventType,
        coordinator: doc.coordinator,
        location: doc.venue,
        venue: doc.venue,
        description: doc.summary,
        summary: doc.summary,
        participants: doc.participants,
        date: doc.date?.toISOString(),
        generatedReportUrl: doc.generatedReportUrl,
        photoUrls: doc.photoUrls,
      };
    }
    case 'News': {
      const doc = await News.findById(recordId).lean();
      if (!doc) return {};
      return {
        headline: doc.headline,
        title: doc.headline,
        description: doc.articleText,
        articleLanguage: doc.articleLanguage,
        imageUrl: doc.imageUrl,
        media: doc.imageUrl,
      };
    }
    default:
      return {};
  }
};

export const applyMoveExtractedDataFallbacks = (
  extractedData: Record<string, unknown>,
  context: {
    senderName?: string;
    groupName?: string;
    originalMessage?: string;
  },
): Record<string, unknown> => {
  let next = normalizeExtractedPersonFields(extractedData);

  if (!getStudentNameFromExtractedData(next) && context.senderName) {
    next.studentName = context.senderName;
  }

  if (!getFacultyNameFromExtractedData(next) && context.senderName) {
    next.facultyName = context.senderName;
  }

  if (!toStringValue(next.company)) {
    next.company =
      toStringValue(next.organization) ??
      toStringValue(next.placement) ??
      toStringValue(next.internship);
  }

  if (!toStringValue(next.eventName) && toStringValue(next.title)) {
    next.eventName = toStringValue(next.title);
  }

  if (!toStringValue(next.title) && context.originalMessage) {
    next.title = context.originalMessage.trim().slice(0, 300);
  }

  if (!toStringValue(next.coordinator) && context.senderName) {
    next.coordinator = context.senderName;
  }

  return next;
};
