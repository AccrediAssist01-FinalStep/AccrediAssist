import mongoose from 'mongoose';
import { pendingRecordRepository } from '../repositories/pendingRecord.repository';
import { auditLogRepository } from '../repositories/auditLog.repository';
import { logPipelineStage, PIPELINE_STAGES } from '../ai/utils/pipeline-stage-logger.util';
import { StudentAchievement } from '../models/StudentAchievement';
import { FacultyAchievement } from '../models/FacultyAchievement';
import { Placement } from '../models/Placement';
import { Internship } from '../models/Internship';
import { Publication } from '../models/Publication';
import { Patent } from '../models/Patent';
import { CompletedEventReport } from '../models/CompletedEventReport';
import { News } from '../models/News';
import { IPendingRecord, IPendingRecordResponse } from '../types/pendingRecord.types';
import {
  PendingApprovalResult,
  PendingApprovalTargetModule,
} from '../types/pendingRecordApproval.types';
import {
  mapPendingRecordToTarget,
  resolveApprovalTargetModuleForRecord,
} from '../utils/pendingRecordApproval.mapper';
import { toPendingRecordResponse } from '../utils/pendingRecord.mapper';
import { BadRequestError, ConflictError, NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';
import { notificationService } from './notification.service';
import { aiEventReportExportService } from './ai-event-report-export.service';
import { workshopReportGeneratorService } from '../report-generation/workshop/services/workshop-report-generator.service';
import { duplicateDetectionAgent } from '../ai/agents/duplicate-detection.agent';

const REVIEWABLE_STATUSES = ['Pending', 'Needs Review'] as const;
const FINAL_STATUSES = ['Approved', 'Rejected'] as const;

const formatMongooseValidationError = (error: unknown): BadRequestError => {
  if (error instanceof mongoose.Error.ValidationError) {
    const messages = Object.values(error.errors).map((item) => item.message);
    return new BadRequestError('Failed to create approved record', messages);
  }

  if (error instanceof Error) {
    return new BadRequestError(error.message);
  }

  return new BadRequestError('Failed to create approved record');
};

export class PendingRecordApprovalService {
  async approvePendingRecord(id: string, userId: string): Promise<IPendingRecordResponse> {
    const existing = await pendingRecordRepository.findById(id);

    if (!existing) {
      throw new NotFoundError('Pending record not found');
    }

    this.ensureReviewable(existing);

    const targetModule = resolveApprovalTargetModuleForRecord(existing);
    let payload = mapPendingRecordToTarget(existing, targetModule);

    await this.assertNoApprovedDuplicate(existing, targetModule);

    if (
      targetModule === 'CompletedEventReport' &&
      existing.extractedData?.sourceType === 'ai-event-report'
    ) {
      const usesTemplateGenerator =
        existing.category === 'Workshop' || existing.category === 'Industrial Visit';

      const exports = usesTemplateGenerator
        ? await workshopReportGeneratorService.generateFromPendingRecord(existing)
        : await aiEventReportExportService.generateFromPendingRecord(existing);
      payload = {
        ...payload,
        generatedReportUrl: exports.pdfUrl,
        docxReportUrl: exports.docxUrl,
      };
    }

    logger.info('Approving pending record', {
      pendingRecordId: id,
      userId,
      category: existing.category,
      targetModule,
    });

    logPipelineStage(PIPELINE_STAGES.FACULTY_APPROVAL, {
      pendingRecordId: id,
      userId,
      category: existing.category,
      targetModule,
      detectedCategory:
        (existing.extractedData as Record<string, unknown> | undefined)?.detectedCategory ?? null,
    });

    const approvalResult = await this.createTargetRecord(targetModule, payload, userId);

    const approved = await pendingRecordRepository.update(
      id,
      {
        status: 'Approved',
        reviewedBy: userId,
        reviewedAt: new Date(),
        approvedRecordId: approvalResult.createdRecordId,
        approvedTargetModule: approvalResult.targetModule,
      } as Partial<IPendingRecord>,
      userId,
    );

    if (!approved) {
      throw new BadRequestError('Failed to approve pending record');
    }

    await auditLogRepository.create({
      userId,
      action: 'CREATE',
      module: targetModule,
      description: `Created ${targetModule} ${approvalResult.createdRecordId} from pending record ${id}`,
    });

    await auditLogRepository.create({
      userId,
      action: 'APPROVE',
      module: 'PendingRecord',
      description: `Pending record ${id} approved into ${targetModule} ${approvalResult.createdRecordId}`,
    });

    const response = toPendingRecordResponse(approved);

    await notificationService.safelyNotify(() =>
      notificationService.notifyFacultyPendingRecordApproved(response),
    );

    return response;
  }

  private ensureReviewable(record: IPendingRecord): void {
    if (FINAL_STATUSES.includes(record.status as (typeof FINAL_STATUSES)[number])) {
      throw new BadRequestError(`Cannot approve a record with status "${record.status}"`);
    }

    if (
      !REVIEWABLE_STATUSES.includes(record.status as (typeof REVIEWABLE_STATUSES)[number])
    ) {
      throw new BadRequestError(`Cannot approve a record with status "${record.status}"`);
    }
  }

  private async assertNoApprovedDuplicate(
    record: IPendingRecord,
    targetModule: PendingApprovalTargetModule,
  ): Promise<void> {
    const guardModules: PendingApprovalTargetModule[] = [
      'StudentAchievement',
      'Placement',
      'Internship',
    ];

    if (!guardModules.includes(targetModule)) {
      return;
    }

    const duplicateCheck = await duplicateDetectionAgent.detect({
      category: record.category,
      extractedData: (record.extractedData ?? {}) as Record<string, unknown>,
    });

    if (!duplicateCheck.result.duplicate || !duplicateCheck.result.matchingRecordId) {
      return;
    }

    const matchingId = duplicateCheck.result.matchingRecordId;
    if (matchingId === record._id.toString()) {
      return;
    }

    const existingApproved = await this.findApprovedRecordById(targetModule, matchingId);
    if (existingApproved) {
      throw new ConflictError('A similar student record already exists. Reject this duplicate pending record instead.');
    }

    const matchingPending = await pendingRecordRepository.findById(matchingId);
    if (
      matchingPending &&
      matchingPending._id.toString() !== record._id.toString() &&
      matchingPending.status === 'Approved' &&
      matchingPending.approvedRecordId
    ) {
      throw new ConflictError(
        'A similar pending record was already approved. Reject this duplicate pending record instead.',
      );
    }
  }

  private async findApprovedRecordById(
    targetModule: PendingApprovalTargetModule,
    id: string,
  ): Promise<unknown | null> {
    switch (targetModule) {
      case 'StudentAchievement':
        return StudentAchievement.findById(id).lean();
      case 'Placement':
        return Placement.findById(id).lean();
      case 'Internship':
        return Internship.findById(id).lean();
      default:
        return null;
    }
  }

  private async createTargetRecord(
    targetModule: PendingApprovalTargetModule,
    payload: Record<string, unknown>,
    userId: string,
  ): Promise<PendingApprovalResult> {
    const approvedBy = new mongoose.Types.ObjectId(userId);

    const storeRecord = async (
      module: PendingApprovalTargetModule,
      createdRecordId: string,
    ): PendingApprovalResult => {
      logPipelineStage(PIPELINE_STAGES.FINAL_DATABASE_STORAGE, {
        targetModule: module,
        createdRecordId,
      });
      return { targetModule: module, createdRecordId };
    };

    try {
      switch (targetModule) {
        case 'StudentAchievement': {
          const created = await StudentAchievement.create({
            ...payload,
            approvedBy,
          });
          return storeRecord(targetModule, created._id.toString());
        }
        case 'FacultyAchievement': {
          const created = await FacultyAchievement.create({
            ...payload,
            approvedBy,
          });
          return storeRecord(targetModule, created._id.toString());
        }
        case 'Placement': {
          const created = await Placement.create({
            ...payload,
            approvedBy,
          });
          return storeRecord(targetModule, created._id.toString());
        }
        case 'Internship': {
          const created = await Internship.create({
            ...payload,
            approvedBy,
          });
          return storeRecord(targetModule, created._id.toString());
        }
        case 'Publication': {
          const created = await Publication.create(payload);
          return storeRecord(targetModule, created._id.toString());
        }
        case 'Patent': {
          const created = await Patent.create(payload);
          return storeRecord(targetModule, created._id.toString());
        }
        case 'CompletedEventReport': {
          const created = await CompletedEventReport.create({
            ...payload,
            approvedBy,
          });
          return storeRecord(targetModule, created._id.toString());
        }
        case 'News': {
          const created = await News.create(payload);
          return storeRecord(targetModule, created._id.toString());
        }
        default:
          throw new BadRequestError('Cannot approve pending record: unsupported target collection');
      }
    } catch (error) {
      if (error instanceof BadRequestError) {
        throw error;
      }

      if (error instanceof mongoose.Error.ValidationError) {
        const messages = Object.values(error.errors).map((item) => item.message);
        logger.warn('Failed to create approved ERP record', {
          targetModule,
          validationErrors: messages,
        });
      }

      throw formatMongooseValidationError(error);
    }
  }
}

export const pendingRecordApprovalService = new PendingRecordApprovalService();
