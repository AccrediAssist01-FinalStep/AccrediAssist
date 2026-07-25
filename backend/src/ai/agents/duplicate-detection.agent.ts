import {
  DuplicateDetectionInput,
  DuplicateDetectionResponse,
} from '../interfaces/duplicate-detection.interface';
import {
  DuplicateDetectionRepository,
  duplicateDetectionRepository,
} from '../repositories/duplicate-detection.repository';
import {
  calculateSimilarityScore,
  getDuplicateThreshold,
  toComparableFields,
} from '../utils/duplicate-similarity.util';

export class DuplicateDetectionAgent {
  constructor(private readonly repository: DuplicateDetectionRepository = duplicateDetectionRepository) {}

  async detect(input: DuplicateDetectionInput): Promise<DuplicateDetectionResponse> {
    const sourceFields = toComparableFields(input.extractedData);
    const candidates = await this.repository.findCandidates(input.category, input.extractedData);
    const threshold = getDuplicateThreshold();

    let bestScore = 0;
    let matchingRecordId: string | null = null;

    for (const candidate of candidates) {
      const score = calculateSimilarityScore(
        input.category,
        sourceFields,
        candidate.fields,
      );

      if (score > bestScore) {
        bestScore = score;
        matchingRecordId = candidate.id;
      }
    }

    return {
      result: {
        duplicate: bestScore >= threshold,
        similarityScore: bestScore,
        matchingRecordId: bestScore >= threshold ? matchingRecordId : null,
      },
    };
  }
}

export const duplicateDetectionAgent = new DuplicateDetectionAgent();
