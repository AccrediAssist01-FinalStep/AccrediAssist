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
): number => {
  const extractionConfidence = extraction.confidence ?? 0;
  const classificationConfidence = classification.confidence ?? 0;
  const values = [extractionConfidence, classificationConfidence].filter((value) => value > 0);

  if (values.length === 0) {
    return 0;
  }

  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
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
