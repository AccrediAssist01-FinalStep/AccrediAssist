import { getConfidenceThreshold } from '../ai/utils/pipeline-status.util';
import { logPipelineStage, PIPELINE_STAGES } from '../ai/utils/pipeline-stage-logger.util';
import { IPendingRecordResponse } from '../types/pendingRecord.types';
import { getAutoReviewUserId } from '../utils/autoReviewUser.util';
import { logger } from '../utils/logger';
import { pendingRecordApprovalService } from './pendingRecordApproval.service';
import { pendingRecordRejectionService } from './pendingRecordRejection.service';

export type AutoReviewAction = 'approved' | 'rejected';

export interface AutoReviewResult {
  action: AutoReviewAction;
  record: IPendingRecordResponse;
  confidenceScore: number;
  threshold: number;
}

export class PendingRecordAutoReviewService {
  async resolveByConfidence(
    pendingRecordId: string,
    confidenceScore: number,
  ): Promise<AutoReviewResult> {
    const threshold = getConfidenceThreshold();
    const userId = await getAutoReviewUserId();

    if (confidenceScore >= threshold) {
      try {
        const record = await pendingRecordApprovalService.approvePendingRecord(
          pendingRecordId,
          userId,
        );

        logPipelineStage(PIPELINE_STAGES.FACULTY_APPROVAL, {
          pendingRecordId,
          autoReview: true,
          action: 'approved',
          confidenceScore,
          threshold,
        });

        logger.info('Pending record auto-approved by confidence score', {
          pendingRecordId,
          confidenceScore,
          threshold,
        });

        return { action: 'approved', record, confidenceScore, threshold };
      } catch (error) {
        const reason = `Auto-rejected: approval failed (${error instanceof Error ? error.message : String(error)}).`;
        const record = await this.autoReject(pendingRecordId, userId, reason, confidenceScore, threshold);
        return { action: 'rejected', record, confidenceScore, threshold };
      }
    }

    const reason = `Auto-rejected: AI confidence score (${confidenceScore}) is below ${threshold}.`;
    const record = await this.autoReject(pendingRecordId, userId, reason, confidenceScore, threshold);
    return { action: 'rejected', record, confidenceScore, threshold };
  }

  private async autoReject(
    pendingRecordId: string,
    userId: string,
    reason: string,
    confidenceScore: number,
    threshold: number,
  ): Promise<IPendingRecordResponse> {
    const record = await pendingRecordRejectionService.rejectPendingRecord(pendingRecordId, userId, {
      reason,
    });

    logPipelineStage(PIPELINE_STAGES.FACULTY_APPROVAL, {
      pendingRecordId,
      autoReview: true,
      action: 'rejected',
      confidenceScore,
      threshold,
      reason,
    });

    logger.info('Pending record auto-rejected by confidence score', {
      pendingRecordId,
      confidenceScore,
      threshold,
      reason,
    });

    return record;
  }
}

export const pendingRecordAutoReviewService = new PendingRecordAutoReviewService();
