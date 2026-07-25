import mongoose from 'mongoose';
import { pendingRecordRepository } from '../repositories/pendingRecord.repository';
import { auditLogRepository } from '../repositories/auditLog.repository';
import {
  EditPendingRecordInput,
  IPendingRecord,
  IPendingRecordResponse,
  PendingRecordEditChange,
  PendingRecordEditHistoryEntry,
} from '../types/pendingRecord.types';
import { toPendingRecordResponse } from '../utils/pendingRecord.mapper';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';

const REVIEWABLE_STATUSES = ['Pending', 'Needs Review'] as const;
const FINAL_STATUSES = ['Approved', 'Rejected'] as const;

const valuesEqual = (left: unknown, right: unknown): boolean =>
  JSON.stringify(left) === JSON.stringify(right);

const buildExtractedDataChanges = (
  previousData: Record<string, unknown>,
  nextData: Record<string, unknown>,
  editedFields: Record<string, unknown>,
): PendingRecordEditChange[] => {
  const changes: PendingRecordEditChange[] = [];

  for (const [field, newValue] of Object.entries(editedFields)) {
    const previousValue = previousData[field] ?? null;

    if (!valuesEqual(previousValue, newValue)) {
      changes.push({
        field: `extractedData.${field}`,
        previousValue,
        newValue,
      });
    }
  }

  return changes;
};

export class PendingRecordEditService {
  async editPendingRecord(
    id: string,
    userId: string,
    input: EditPendingRecordInput,
  ): Promise<IPendingRecordResponse> {
    const existing = await pendingRecordRepository.findById(id);

    if (!existing) {
      throw new NotFoundError('Pending record not found');
    }

    this.ensureEditable(existing);

    const changes: PendingRecordEditChange[] = [];
    const updateData: Partial<IPendingRecord> = {};
    const previousExtractedData = { ...(existing.extractedData ?? {}) };

    if (input.extractedData) {
      updateData.extractedData = {
        ...previousExtractedData,
        ...input.extractedData,
      };
      changes.push(
        ...buildExtractedDataChanges(previousExtractedData, updateData.extractedData, input.extractedData),
      );
    }

    if (input.category && input.category !== existing.category) {
      changes.push({
        field: 'category',
        previousValue: existing.category,
        newValue: input.category,
      });
      updateData.category = input.category;
    }

    let previousConfidenceScore: number | undefined;
    let newConfidenceScore: number | undefined;

    if (input.confidenceScore !== undefined && input.confidenceScore !== existing.confidenceScore) {
      previousConfidenceScore = existing.confidenceScore;
      newConfidenceScore = input.confidenceScore;
      changes.push({
        field: 'confidenceScore',
        previousValue: existing.confidenceScore,
        newValue: input.confidenceScore,
      });
      updateData.confidenceScore = input.confidenceScore;
    }

    if (changes.length === 0) {
      throw new BadRequestError('No changes detected in edit request');
    }

    const editedAt = new Date();
    const editEntry: PendingRecordEditHistoryEntry = {
      editedBy: new mongoose.Types.ObjectId(userId),
      editedAt,
      changes,
      ...(previousConfidenceScore !== undefined ? { previousConfidenceScore } : {}),
      ...(newConfidenceScore !== undefined ? { newConfidenceScore } : {}),
    };

    updateData.editHistory = [...(existing.editHistory ?? []), editEntry];

    logger.info('Editing pending record', {
      pendingRecordId: id,
      userId,
      changedFields: changes.map((change) => change.field),
    });

    const updated = await pendingRecordRepository.update(id, updateData, userId);

    if (!updated) {
      throw new NotFoundError('Pending record not found');
    }

    await auditLogRepository.create({
      userId,
      action: 'UPDATE',
      module: 'PendingRecord',
      description: `Pending record ${id} edited: ${changes.map((change) => change.field).join(', ')}`,
      timestamp: editedAt,
    });

    return toPendingRecordResponse(updated);
  }

  private ensureEditable(record: IPendingRecord): void {
    if (FINAL_STATUSES.includes(record.status as (typeof FINAL_STATUSES)[number])) {
      throw new BadRequestError(`Cannot edit a record with status "${record.status}"`);
    }

    if (
      !REVIEWABLE_STATUSES.includes(record.status as (typeof REVIEWABLE_STATUSES)[number])
    ) {
      throw new BadRequestError(`Cannot edit a record with status "${record.status}"`);
    }
  }
}

export const pendingRecordEditService = new PendingRecordEditService();
