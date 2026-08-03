import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { pendingReviewService } from '../services/pendingReview.service';
import { pendingRecordEditService } from '../services/pendingRecordEdit.service';
import { asyncHandler } from '../middleware/asyncHandler';
import { UnauthorizedError } from '../utils/errors';
import {
  signCloudinaryDeliveryUrl,
  signCloudinaryDeliveryUrls,
} from '../utils/cloudinary-url.util';
import { PendingRecordListQuery } from '../validations/pendingRecord.validation';
import { EditPendingRecordBody } from '../validations/pendingRecordEdit.validation';
import { IPendingRecordResponse } from '../types/pendingRecord.types';

const signPendingRecordMedia = async (
  record: IPendingRecordResponse,
): Promise<IPendingRecordResponse> => {
  const data = { ...(record.extractedData ?? {}) };
  const metadata =
    typeof data.mediaMetadata === 'object' && data.mediaMetadata !== null
      ? { ...(data.mediaMetadata as Record<string, unknown>) }
      : null;

  if (typeof data.media === 'string') {
    data.media = (await signCloudinaryDeliveryUrl(data.media)) ?? data.media;
  }

  if (Array.isArray(data.mediaReferences)) {
    data.mediaReferences = await signCloudinaryDeliveryUrls(
      data.mediaReferences.filter((item): item is string => typeof item === 'string'),
    );
  }

  if (Array.isArray(data.certificates)) {
    data.certificates = await signCloudinaryDeliveryUrls(
      data.certificates.filter((item): item is string => typeof item === 'string'),
    );
  }

  if (typeof data.originalPdfUrl === 'string') {
    data.originalPdfUrl =
      (await signCloudinaryDeliveryUrl(data.originalPdfUrl)) ?? data.originalPdfUrl;
  }

  if (metadata && typeof metadata.secureUrl === 'string') {
    metadata.secureUrl =
      (await signCloudinaryDeliveryUrl(metadata.secureUrl)) ?? metadata.secureUrl;
    data.mediaMetadata = metadata;
  }

  if (Array.isArray(data.media)) {
    data.media = await Promise.all(
      data.media.map(async (item) => {
        if (!item || typeof item !== 'object') return item;
        const mediaItem = { ...(item as Record<string, unknown>) };
        if (typeof mediaItem.url === 'string') {
          mediaItem.url =
            (await signCloudinaryDeliveryUrl(mediaItem.url)) ?? mediaItem.url;
        }
        return mediaItem;
      }),
    );
  }

  if (Array.isArray(data.evidence)) {
    data.evidence = await Promise.all(
      data.evidence.map(async (item) => {
        if (!item || typeof item !== 'object') return item;
        const evidenceItem = { ...(item as Record<string, unknown>) };
        if (typeof evidenceItem.url === 'string') {
          evidenceItem.url =
            (await signCloudinaryDeliveryUrl(evidenceItem.url)) ?? evidenceItem.url;
        }
        return evidenceItem;
      }),
    );
  }

  if (Array.isArray(data.photoUrls)) {
    data.photoUrls = await signCloudinaryDeliveryUrls(
      data.photoUrls.filter((item): item is string => typeof item === 'string'),
    );
  }

  return { ...record, extractedData: data };
};

class PendingReviewController extends BaseController {
  list = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const query = req.query as unknown as PendingRecordListQuery;

    const result = await pendingReviewService.getAllPendingRecords({
      search: query.search,
      title: query.title,
      status: query.status,
      category: query.category,
      groupName: query.groupName,
      senderName: query.senderName,
      pagination: {
        page: query.page,
        limit: query.limit,
      },
      sort: {
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      },
    });

    this.paginated(res, 'Pending records retrieved successfully', result.items, result.meta);
  });

  getById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const record = await pendingReviewService.getPendingRecordById(req.params.id);
    this.success(
      res,
      'Pending record retrieved successfully',
      await signPendingRecordMedia(record),
    );
  });

  update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = this.requireUserId(req);
    const body = req.body as EditPendingRecordBody;
    const record = await pendingRecordEditService.editPendingRecord(req.params.id, userId, body);
    this.success(res, 'Pending record updated successfully', record);
  });

  downloadAttachment = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    this.requireUserId(req);
    const record = await pendingReviewService.getPendingRecordById(req.params.id);
    const extracted = record.extractedData ?? {};
    const metadata =
      typeof extracted.mediaMetadata === 'object' && extracted.mediaMetadata !== null
        ? (extracted.mediaMetadata as { contentBase64?: string; mimeType?: string; fileName?: string })
        : {};
    const contentBase64 = metadata.contentBase64;

    if (!contentBase64) {
      res.status(404).json({ success: false, message: 'No attachment bytes stored for this record' });
      return;
    }

    const buffer = Buffer.from(contentBase64, 'base64');
    const mimeType = metadata.mimeType ?? 'application/octet-stream';
    const fileName = metadata.fileName ?? 'attachment';

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${fileName.replace(/"/g, '')}"`);
    res.send(buffer);
  });

  private requireUserId(req: Request): string {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    return req.user.id;
  }
}

export const pendingReviewController = new PendingReviewController();
