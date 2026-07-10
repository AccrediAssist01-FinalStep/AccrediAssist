import { FilterQuery, Types } from 'mongoose';
import { Notification } from '../models/Notification';
import { BaseRepository, PaginatedResult } from './base.repository';
import {
  buildPaginationMeta,
  getPagination,
  PaginationOptions,
  withActiveFilter,
} from '../database/utils/queryHelpers';
import {
  INotification,
  NotificationFilters,
  NotificationSort,
} from '../types/notification.types';

export class NotificationRepository extends BaseRepository<INotification> {
  constructor() {
    super(Notification);
  }

  private buildUserFilterQuery(
    userId: string,
    filters: NotificationFilters = {},
  ): FilterQuery<INotification> {
    const query: FilterQuery<INotification> = {
      userId: new Types.ObjectId(userId),
    };

    if (filters.isRead !== undefined) {
      query.isRead = filters.isRead;
    }

    if (filters.type) {
      query.type = filters.type;
    }

    return query;
  }

  async findForUser(
    userId: string,
    filters: NotificationFilters = {},
    pagination: PaginationOptions,
    sort: NotificationSort,
  ): Promise<PaginatedResult<INotification>> {
    const query = withActiveFilter(this.buildUserFilterQuery(userId, filters));
    const pageOptions = getPagination(pagination);
    const sortOrder = sort.sortOrder === 'asc' ? 1 : -1;

    const [items, total] = await Promise.all([
      this.model
        .find(query)
        .sort({ [sort.sortBy]: sortOrder })
        .skip(pageOptions.skip)
        .limit(pageOptions.limit)
        .exec(),
      this.model.countDocuments(query).exec(),
    ]);

    return {
      items,
      meta: buildPaginationMeta(total, pageOptions),
    };
  }

  async countUnreadForUser(userId: string): Promise<number> {
    return this.model
      .countDocuments(
        withActiveFilter({
          userId: new Types.ObjectId(userId),
          isRead: false,
        }),
      )
      .exec();
  }

  async markAsReadForUser(id: string, userId: string): Promise<INotification | null> {
    return this.model
      .findOneAndUpdate(
        withActiveFilter({
          _id: id,
          userId: new Types.ObjectId(userId),
        }),
        { isRead: true },
        { new: true, runValidators: true },
      )
      .exec();
  }
}

export const notificationRepository = new NotificationRepository();
