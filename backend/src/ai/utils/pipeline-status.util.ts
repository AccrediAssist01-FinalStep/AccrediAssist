import { env } from '../../config/env';
import { PendingRecordStatus } from '../../database/enums';
import { ClassificationResult } from '../interfaces/classification.interface';
import { DuplicateDetectionResult } from '../interfaces/duplicate-detection.interface';
import { ExtractionResult } from '../interfaces/extraction.interface';
import { ValidationResult } from '../interfaces/validation.interface';

export const getConfidenceThreshold = (): number => env.AI_CONFIDENCE_THRESHOLD;

export const calculatePipelineConfidenceScore = (
  extraction: ExtractionResult,
  classification: ClassificationResult,
  validation?: ValidationResult,
): number => {
  const extractionConfidence = extraction.confidence ?? 0;
  const classificationConfidence = classification.confidence ?? 0;
  const values = [extractionConfidence, classificationConfidence].filter((value) => value > 0);

  if (values.length === 0) {
    return 0;
  }

  let score = Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);

  if (validation?.validationStatus === 'invalid') {
    score = Math.min(score, Math.max(getConfidenceThreshold() - 5, 0));
  }

  if (classification.confidence !== null && classification.confidence < 50) {
    score = Math.min(score, classification.confidence);
  }

  const hasNamedEntity =
    Boolean(extraction.studentNames?.length) ||
    Boolean(extraction.facultyNames?.length) ||
    Boolean(extraction.company) ||
    Boolean(extraction.publicationTitle) ||
    Boolean(extraction.patentTitle) ||
    Boolean(extraction.eventName);

  if (!hasNamedEntity) {
    score = Math.min(score, 45);
  }

  return Math.max(0, score);
};

export const resolvePendingRecordStatus = (input: {
  validation: ValidationResult;
  duplicateDetection: DuplicateDetectionResult;
  confidenceScore: number;
}): PendingRecordStatus => {
  if (input.validation.validationStatus === 'invalid') {
    return 'Needs Review';
  }

  if (input.duplicateDetection.duplicate) {
    return 'Needs Review';
  }

  if (input.confidenceScore < getConfidenceThreshold()) {
    return 'Needs Review';
  }

  return 'Pending';
};
