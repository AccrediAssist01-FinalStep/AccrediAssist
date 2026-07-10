import { Response } from 'express';
import {
  sendCreated,
  sendNoContent,
  sendPaginatedSuccess,
  sendSuccess,
} from '../utils/apiResponse';
import { PaginationMeta } from '../types/api.types';

export abstract class BaseController {
  protected success<T>(
    res: Response,
    message: string,
    data?: T,
    statusCode = 200,
  ): Response {
    return sendSuccess(res, message, data, statusCode);
  }

  protected created<T>(res: Response, message: string, data: T): Response {
    return sendCreated(res, message, data);
  }

  protected paginated<T>(
    res: Response,
    message: string,
    items: T[],
    meta: PaginationMeta,
  ): Response {
    return sendPaginatedSuccess(res, message, items, meta);
  }

  protected noContent(res: Response): Response {
    return sendNoContent(res);
  }
}
