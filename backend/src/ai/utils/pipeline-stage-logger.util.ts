import { logger } from '../../utils/logger';

export const PIPELINE_STAGES = {
  MESSAGE_RECEIVED: 'Message Received',
  MESSAGE_VALIDATION: 'Message Validation',
  MEDIA_PROCESSING: 'Media Processing',
  CLOUDINARY_UPLOAD: 'Cloudinary Upload',
  GEMINI_REQUEST: 'Gemini Request',
  GEMINI_RESPONSE: 'Gemini Response',
  CLASSIFICATION: 'Classification',
  PENDING_REVIEW_CREATION: 'Pending Review Creation',
  FACULTY_APPROVAL: 'Faculty Approval',
  FINAL_DATABASE_STORAGE: 'Final Database Storage',
} as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[keyof typeof PIPELINE_STAGES];

export const logPipelineStage = (
  stage: PipelineStage,
  details: Record<string, unknown> = {},
): void => {
  logger.info(`[Pipeline] ${stage}`, details);
};
