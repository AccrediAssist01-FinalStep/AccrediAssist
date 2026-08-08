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
import {
  IPendingRecord,
  IPendingRecordResponse,
  PendingRecordEditChange,
  PendingRecordEditHistoryEntry,
} from '../types/pendingRecord.types';
import { PendingApprovalTargetModule } from '../types/pendingRecordApproval.types';
import {
  mapPendingRecordToTarget,
  resolveApprovalTargetModuleForRecord,
} from '../utils/pendingRecordApproval.mapper';
import { toPendingRecordResponse } from '../utils/pendingRecord.mapper';
import { softDeleteById } from '../database/utils/softDelete';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';
import { aiEventReportExportService } from './ai-event-report-export.service';
import { workshopReportGeneratorService } from '../report-generation/workshop/services/workshop-report-generator.service';
import { pendingRecordApprovalService } from './pendingRecordApproval.service';
import { resolveMoveDestination, buildMoveExtractedDataPatch } from '../utils/pendingRecordMoveDestinations.util';
import {
  applyMoveExtractedDataFallbacks,
  enrichExtractedDataFromApprovedRecord,
} from '../utils/pendingRecordMoveEnrichment.util';
import { normalizeExtractedPersonFields } from '../utils/extractedPersonFields.util';
import { MovePendingRecordBody } from '../validations/pendingRecordMove.validation';

export class PendingRecordMoveService {
  async moveApprovedPendingRecord(
    id: string,
    userId: string,
    input: MovePendingRecordBody,
  ): Promise<IPendingRecordResponse> {
    const existing = await pendingRecordRepository.findById(id);

    if (!existing) {
      throw new NotFoundError('Pending record not found');
    }

    if (existing.status !== 'Approved') {
      throw new BadRequestError('Only approved records can be moved to another module');
    }

    if (!existing.approvedRecordId || !existing.approvedTargetModule) {
      throw new BadRequestError('Approved record destination is missing for this pending record');
    }

    const previousCategory = existing.category;
    const previousTargetModule = existing.approvedTargetModule as PendingApprovalTargetModule;
    const previousRecordId = existing.approvedRecordId.toString();

    const destination = resolveMoveDestination(input.moduleId, input.submoduleId);
    const nextCategory = destination.category;
    const destinationPatch = buildMoveExtractedDataPatch(destination);

    let nextExtractedData = await enrichExtractedDataFromApprovedRecord(
      previousTargetModule,
      previousRecordId,
      existing.extractedData ?? {},
    );

    nextExtractedData = applyMoveExtractedDataFallbacks(nextExtractedData, {
      senderName: existing.senderName,
      groupName: existing.groupName,
      originalMessage: existing.originalMessage,
    });

    nextExtractedData = normalizeExtractedPersonFields({
      ...nextExtractedData,
      ...destinationPatch,
      moveDestinationModule: destination.moduleId,
      moveDestinationSubmodule: destination.submoduleId,
    });

    if (!destinationPatch.activitySubCategory) {
      delete nextExtractedData.activitySubCategory;
    }

    const recordForMapping: IPendingRecord = {
      ...existing,
      category: nextCategory,
      extractedData: nextExtractedData,
    };

    const nextTargetModule = resolveApprovalTargetModuleForRecord(recordForMapping);

    let payload: Record<string, unknown>;
    try {
      payload = mapPendingRecordToTarget(recordForMapping, nextTargetModule);
      payload = this.applyDestinationPayloadOverrides(payload, nextTargetModule, destination);
    } catch (error) {
      const message =
        error instanceof BadRequestError
          ? error.message.replace(
              'Cannot approve pending record',
              'Cannot move record to the selected module',
            )
          : 'Cannot move record to the selected module';
      throw new BadRequestError(message);
    }

    if (
      nextTargetModule === 'CompletedEventReport' &&
      recordForMapping.extractedData?.sourceType === 'ai-event-report'
    ) {
      const usesTemplateGenerator =
        nextCategory === 'Workshop' || nextCategory === 'Industrial Visit';

      const exports = usesTemplateGenerator
        ? await workshopReportGeneratorService.generateFromPendingRecord(recordForMapping)
        : await aiEventReportExportService.generateFromPendingRecord(recordForMapping);

      payload = {
        ...payload,
        generatedReportUrl: exports.pdfUrl,
        docxReportUrl: exports.docxUrl,
      };
    }

    logger.info('Moving approved pending record to another module', {
      pendingRecordId: id,
      userId,
      previousCategory,
      nextCategory,
      moveDestination: `${destination.moduleId}/${destination.submoduleId}`,
      previousTargetModule,
      nextTargetModule,
      previousRecordId,
    });

    logPipelineStage(PIPELINE_STAGES.FACULTY_APPROVAL, {
      pendingRecordId: id,
      userId,
      action: 'move',
      previousCategory,
      nextCategory,
      moveDestination: `${destination.moduleId}/${destination.submoduleId}`,
      previousTargetModule,
      nextTargetModule,
    });

    const approvalResult = await pendingRecordApprovalService.createTargetRecordPublic(
      nextTargetModule,
      payload,
      userId,
    );

    await this.softDeleteTargetRecord(previousTargetModule, previousRecordId, userId);

    const changes: PendingRecordEditChange[] = [
      {
        field: 'category',
        previousValue: previousCategory,
        newValue: nextCategory,
      },
      {
        field: 'moveDestination',
        previousValue: null,
        newValue: `${destination.moduleId}/${destination.submoduleId}`,
      },
      {
        field: 'approvedTargetModule',
        previousValue: previousTargetModule,
        newValue: nextTargetModule,
      },
      {
        field: 'approvedRecordId',
        previousValue: previousRecordId,
        newValue: approvalResult.createdRecordId,
      },
    ];

    const editEntry: PendingRecordEditHistoryEntry = {
      editedBy: new mongoose.Types.ObjectId(userId),
      editedAt: new Date(),
      changes,
    };

    const updated = await pendingRecordRepository.update(
      id,
      {
        category: nextCategory,
        extractedData: nextExtractedData,
        approvedRecordId: approvalResult.createdRecordId,
        approvedTargetModule: approvalResult.targetModule,
        editHistory: [...(existing.editHistory ?? []), editEntry],
      } as Partial<IPendingRecord>,
      userId,
    );

    if (!updated) {
      throw new BadRequestError('Failed to update pending record after move');
    }

    await auditLogRepository.create({
      userId,
      action: 'DELETE',
      module: previousTargetModule,
      description: `Soft-deleted ${previousTargetModule} ${previousRecordId} after moving pending record ${id}`,
    });

    await auditLogRepository.create({
      userId,
      action: 'CREATE',
      module: nextTargetModule,
      description: `Created ${nextTargetModule} ${approvalResult.createdRecordId} from moved pending record ${id}`,
    });

    await auditLogRepository.create({
      userId,
      action: 'UPDATE',
      module: 'PendingRecord',
      description: `Pending record ${id} moved from ${previousCategory} (${previousTargetModule}) to ${destination.label} (${nextTargetModule})`,
    });

    return toPendingRecordResponse(updated);
  }

  private applyDestinationPayloadOverrides(
    payload: Record<string, unknown>,
    targetModule: PendingApprovalTargetModule,
    destination: ReturnType<typeof resolveMoveDestination>,
  ): Record<string, unknown> {
    const patch = buildMoveExtractedDataPatch(destination);
    const next = { ...payload };

    if (targetModule === 'StudentAchievement' || targetModule === 'FacultyAchievement') {
      if (patch.achievementType) {
        next.achievementType = patch.achievementType;
      }
    }

    if (targetModule === 'CompletedEventReport' && patch.eventType) {
      next.eventType = patch.eventType;
    }

    return next;
  }

  private async softDeleteTargetRecord(
    targetModule: PendingApprovalTargetModule,
    recordId: string,
    userId: string,
  ): Promise<void> {
    const model = this.getModelForTargetModule(targetModule);
    const deleted = await softDeleteById(model, recordId, userId);

    if (!deleted) {
      logger.warn('Approved record already removed during move; continuing', {
        targetModule,
        recordId,
      });
    }
  }

  private getModelForTargetModule(targetModule: PendingApprovalTargetModule) {
    switch (targetModule) {
      case 'StudentAchievement':
        return StudentAchievement;
      case 'FacultyAchievement':
        return FacultyAchievement;
      case 'Placement':
        return Placement;
      case 'Internship':
        return Internship;
      case 'Publication':
        return Publication;
      case 'Patent':
        return Patent;
      case 'CompletedEventReport':
        return CompletedEventReport;
      case 'News':
        return News;
      default:
        throw new BadRequestError(`Unsupported target module "${targetModule}"`);
    }
  }
}

export const pendingRecordMoveService = new PendingRecordMoveService();
