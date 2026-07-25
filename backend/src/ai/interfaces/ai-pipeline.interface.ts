import { PendingRecordStatus, RecordCategory } from '../../database/enums';
import { IPendingRecordResponse } from '../../types/pendingRecord.types';
import { WhatsAppIncomingMessage } from '../../whatsapp/types';
import { ClassificationAgentResponse } from '../interfaces/classification.interface';
import { DuplicateDetectionResponse } from '../interfaces/duplicate-detection.interface';
import { ExtractionAgentResponse, ExtractionResult } from '../interfaces/extraction.interface';
import { ValidationAgentResponse } from '../interfaces/validation.interface';

export interface AiPipelineStageResults {
  extraction: ExtractionAgentResponse;
  classification: ClassificationAgentResponse;
  validation: ValidationAgentResponse;
  duplicateDetection: DuplicateDetectionResponse;
}

export interface AiPipelineResult {
  pendingRecord: IPendingRecordResponse;
  stages: AiPipelineStageResults;
  recordCategory: RecordCategory;
  pendingStatus: PendingRecordStatus;
  confidenceScore: number;
}
