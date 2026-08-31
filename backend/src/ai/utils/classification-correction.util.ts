import { ClassificationResult } from '../interfaces/classification.interface';
import { ExtractionResult } from '../interfaces/extraction.interface';
import { isFacultySponsoredProjectContext } from './achievement-inference.util';
import { isIndustrialVisitContext } from './event-inference.util';
import {
  isFacultyMouContext,
  isFacultyResourcePersonContext,
  isSessionChairReviewerContext,
  isStudentSponsoredProjectContext,
} from './specialized-activity.util';

const hasFacultyNames = (extraction: ExtractionResult): boolean =>
  Boolean(extraction.facultyNames?.length);

export const correctClassificationForExtraction = (
  classification: ClassificationResult,
  extraction: ExtractionResult,
  originalMessage: string,
): ClassificationResult => {
  if (isFacultyMouContext(extraction, originalMessage)) {
    if (classification.category !== 'Faculty Achievement') {
      return {
        category: 'Faculty Achievement',
        confidence: Math.max(classification.confidence ?? 0, 92),
        reasoning: classification.reasoning ?? 'Message describes a faculty MoU with an organization.',
      };
    }
  }

  if (isFacultyResourcePersonContext(extraction, originalMessage)) {
    if (classification.category !== 'Faculty Achievement') {
      return {
        category: 'Faculty Achievement',
        confidence: Math.max(classification.confidence ?? 0, 92),
        reasoning:
          classification.reasoning ?? 'Message describes faculty participation as a resource person.',
      };
    }
  }

  if (isSessionChairReviewerContext(extraction, originalMessage)) {
    if (classification.category !== 'Faculty Achievement') {
      return {
        category: 'Faculty Achievement',
        confidence: Math.max(classification.confidence ?? 0, 92),
        reasoning:
          classification.reasoning ??
          'Message describes faculty work as a session chair or reviewer.',
      };
    }
  }

  if (isStudentSponsoredProjectContext(extraction, originalMessage)) {
    if (classification.category !== 'Student Achievement') {
      return {
        category: 'Student Achievement',
        confidence: Math.max(classification.confidence ?? 0, 90),
        reasoning:
          classification.reasoning ?? 'Message describes a student project with organizational sponsorship.',
      };
    }
  }

  if (isFacultySponsoredProjectContext(extraction, originalMessage)) {
    if (classification.category !== 'Faculty Achievement') {
      return {
        category: 'Faculty Achievement',
        confidence: Math.max(classification.confidence ?? 0, 90),
        reasoning:
          classification.reasoning ??
          'Message describes a faculty sponsored or funded research project.',
      };
    }
  }

  if (isIndustrialVisitContext(originalMessage, extraction)) {
    if (classification.category === 'Completed Event Report') {
      return {
        ...classification,
        confidence: Math.max(classification.confidence ?? 0, 90),
      };
    }

    return {
      category: 'Completed Event Report',
      confidence: Math.max(classification.confidence ?? 0, 92),
      reasoning:
        classification.reasoning ??
        'Message describes an industrial/industry visit report for the department.',
    };
  }

  if (
    hasFacultyNames(extraction) &&
    /\b(sponsored project|funded project|research grant|funding from|received.*project)\b/i.test(
      originalMessage,
    ) &&
    classification.category === 'Student Achievement'
  ) {
    return {
      category: 'Faculty Achievement',
      confidence: Math.max(classification.confidence ?? 0, 88),
      reasoning:
        classification.reasoning ?? 'Faculty sponsored project detected; not a student achievement.',
    };
  }

  return classification;
};
