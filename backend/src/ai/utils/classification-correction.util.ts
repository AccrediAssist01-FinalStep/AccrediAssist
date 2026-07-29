import { ClassificationResult } from '../interfaces/classification.interface';
import { ExtractionResult } from '../interfaces/extraction.interface';
import { isIndustrialVisitContext } from './event-inference.util';

export const correctClassificationForExtraction = (
  classification: ClassificationResult,
  extraction: ExtractionResult,
  originalMessage: string,
): ClassificationResult => {
  if (!isIndustrialVisitContext(originalMessage, extraction)) {
    return classification;
  }

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
};
