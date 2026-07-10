/**
 * CRUD infrastructure integration tests.
 *
 * Prerequisites:
 *   1. cp backend/.env.example backend/.env (set MONGODB_URI)
 *   2. npm install
 *   3. npm run test:crud-infrastructure
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import dotenv from 'dotenv';
import { Types } from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../database/connection';
import { Placement } from '../models/Placement';
import { BaseRepository } from '../repositories/base.repository';
import { asyncHandler } from '../middleware/asyncHandler';
import { validate, validateParams, validateQuery } from '../middleware/validate.middleware';
import { errorHandler } from '../middleware/error.middleware';
import { idParamSchema, paginationSchema } from '../validations/common.validation';
import {
  buildSuccessResponse,
  buildErrorResponse,
  buildPaginatedResponse,
  sendSuccess,
  sendError,
  sendCreated,
  sendPaginatedSuccess,
  sendNoContent,
} from '../utils/apiResponse';
import {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  ErrorCode,
} from '../utils/errors';
import { IPlacement } from '../types/placement.types';

dotenv.config();

const assert = (condition: boolean, message: string): void => {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
  console.log(`PASS: ${message}`);
};

const createMockResponse = () => {
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: unknown) {
      this.body = data;
      return this;
    },
    send() {
      return this;
    },
  };
  return res as Response & { statusCode: number; body: unknown };
};

const runMiddleware = async (
  middleware: (req: Request, res: Response, next: NextFunction) => void,
  req: Partial<Request>,
): Promise<Error | null> => {
  return new Promise((resolve) => {
    const res = createMockResponse();
    middleware(req as Request, res, (error?: unknown) => {
      resolve(error instanceof Error ? error : null);
    });
  });
};

class PlacementRepository extends BaseRepository<IPlacement> {
  constructor() {
    super(Placement);
  }
}

const testErrorClasses = (): void => {
  console.log('\n--- Error classes ---');

  const badRequest = new BadRequestError('Invalid input', ['field: required']);
  assert(badRequest.statusCode === 400, 'BadRequestError has status 400');
  assert(badRequest.code === ErrorCode.BAD_REQUEST, 'BadRequestError has BAD_REQUEST code');

  const unauthorized = new UnauthorizedError();
  assert(unauthorized.statusCode === 401, 'UnauthorizedError has status 401');

  const forbidden = new ForbiddenError();
  assert(forbidden.statusCode === 403, 'ForbiddenError has status 403');

  const notFound = new NotFoundError('Record not found');
  assert(notFound.statusCode === 404, 'NotFoundError has status 404');

  const conflict = new ConflictError();
  assert(conflict.statusCode === 409, 'ConflictError has status 409');

  const validation = new ValidationError('Validation failed', ['email: invalid']);
  assert(validation.statusCode === 422, 'ValidationError has status 422');

  const legacy = new AppError('Legacy error', 418);
  assert(legacy.statusCode === 418, 'AppError backward compatibility works');
};

const testResponseHelpers = (): void => {
  console.log('\n--- Response helpers ---');

  const success = buildSuccessResponse('OK', { id: '1' });
  assert(success.success === true, 'buildSuccessResponse sets success true');
  assert(success.message === 'OK', 'buildSuccessResponse sets message');
  assert((success.data as { id: string }).id === '1', 'buildSuccessResponse sets data');

  const error = buildErrorResponse('Failed', ['field: required']);
  assert(error.success === false, 'buildErrorResponse sets success false');
  assert(error.errors?.length === 1, 'buildErrorResponse sets errors');

  const paginated = buildPaginatedResponse('Listed', [{ id: '1' }], {
    total: 1,
    page: 1,
    limit: 20,
    totalPages: 1,
  });
  assert(paginated.data?.items.length === 1, 'buildPaginatedResponse sets items');
  assert(paginated.data?.meta.total === 1, 'buildPaginatedResponse sets meta');

  const res1 = createMockResponse();
  sendSuccess(res1, 'Success', { ok: true });
  assert(res1.statusCode === 200, 'sendSuccess returns 200');
  assert((res1.body as { success: boolean }).success === true, 'sendSuccess returns success envelope');

  const res2 = createMockResponse();
  sendCreated(res2, 'Created', { id: '1' });
  assert(res2.statusCode === 201, 'sendCreated returns 201');

  const res3 = createMockResponse();
  sendPaginatedSuccess(res3, 'Listed', [{ id: '1' }], {
    total: 1,
    page: 1,
    limit: 20,
    totalPages: 1,
  });
  assert((res3.body as { data: { items: unknown[] } }).data.items.length === 1, 'sendPaginatedSuccess works');

  const res4 = createMockResponse();
  sendNoContent(res4);
  assert(res4.statusCode === 204, 'sendNoContent returns 204');

  const res5 = createMockResponse();
  sendError(res5, 'Bad', 400, ['invalid']);
  assert(res5.statusCode === 400, 'sendError returns custom status');
  assert((res5.body as { success: boolean }).success === false, 'sendError returns error envelope');
};

const testValidationMiddleware = async (): Promise<void> => {
  console.log('\n--- Validation middleware ---');

  const bodySchema = z.object({ name: z.string().min(2) });
  const validBodyError = await runMiddleware(validate(bodySchema), {
    body: { name: 'A' },
  });
  assert(validBodyError instanceof ValidationError, 'validate(body) rejects invalid body');
  assert(validBodyError?.statusCode === 422, 'validate(body) returns 422');

  const validBodyReq = { body: { name: 'Valid Name' } } as Partial<Request>;
  const validBodyPass = await runMiddleware(validate(bodySchema), validBodyReq);
  assert(validBodyPass === null, 'validate(body) accepts valid body');
  assert(validBodyReq.body?.name === 'Valid Name', 'validate(body) preserves parsed body');

  const invalidIdError = await runMiddleware(validateParams(idParamSchema), {
    params: { id: 'invalid-id' },
  });
  assert(invalidIdError instanceof ValidationError, 'validateParams rejects invalid ObjectId');

  const validIdReq = { params: { id: new Types.ObjectId().toString() } } as Partial<Request>;
  const validIdPass = await runMiddleware(validateParams(idParamSchema), validIdReq);
  assert(validIdPass === null, 'validateParams accepts valid ObjectId');

  const queryReq = { query: { page: '2', limit: '10' } } as Partial<Request>;
  const queryPass = await runMiddleware(validateQuery(paginationSchema), queryReq);
  assert(queryPass === null, 'validateQuery accepts pagination query');
  assert(queryReq.query?.page === 2, 'validateQuery coerces page to number');
  assert(queryReq.query?.limit === 10, 'validateQuery coerces limit to number');
};

const testAsyncHandler = async (): Promise<void> => {
  console.log('\n--- Async handler ---');

  let nextError: Error | null = null;
  const next = (error?: unknown) => {
    nextError = error instanceof Error ? error : null;
  };

  const failingHandler = asyncHandler(async () => {
    throw new NotFoundError('Missing');
  });

  await failingHandler({} as Request, createMockResponse(), next);
  assert(nextError instanceof NotFoundError, 'asyncHandler forwards rejected errors to next()');

  let successCalled = false;
  const successHandler = asyncHandler(async (_req, res) => {
    sendSuccess(res, 'OK');
    successCalled = true;
  });

  nextError = null;
  await successHandler({} as Request, createMockResponse(), next);
  assert(successCalled, 'asyncHandler runs successful handlers');
  assert(nextError === null, 'asyncHandler does not call next on success');
};

const testErrorMiddleware = (): void => {
  console.log('\n--- Error middleware ---');

  const res1 = createMockResponse();
  errorHandler(new ValidationError('Validation failed', ['name: required']), {} as Request, res1, () => undefined);
  assert(res1.statusCode === 422, 'errorHandler maps ValidationError to 422');

  const res2 = createMockResponse();
  errorHandler(new Error('Unexpected'), {} as Request, res2, () => undefined);
  assert(res2.statusCode === 500, 'errorHandler maps unknown errors to 500');
};

const testBaseRepository = async (): Promise<void> => {
  console.log('\n--- Base repository ---');

  await connectDatabase();
  await Placement.deleteMany({ company: 'CRUD Infra Test Co' });

  const repository = new PlacementRepository();

  const created = await repository.create({
    studentName: 'Infra Tester',
    company: 'CRUD Infra Test Co',
    role: 'Engineer',
  });
  assert(!!created._id, 'BaseRepository.create saves a document');
  assert(created.isDeleted === false, 'BaseRepository.create respects base schema');

  const found = await repository.findById(created._id.toString());
  assert(!!found, 'BaseRepository.findById returns active document');

  const updated = await repository.update(created._id.toString(), { package: '10 LPA' });
  assert(updated?.package === '10 LPA', 'BaseRepository.update modifies document');

  const paginated = await repository.findAll({ company: 'CRUD Infra Test Co' }, { page: 1, limit: 10 });
  assert(!Array.isArray(paginated), 'BaseRepository.findAll with pagination returns paginated result');
  if (!Array.isArray(paginated)) {
    assert(paginated.items.length === 1, 'BaseRepository paginated items length is correct');
    assert(paginated.meta.total === 1, 'BaseRepository paginated meta total is correct');
  }

  const deleted = await repository.softDelete(created._id.toString());
  assert(deleted?.isDeleted === true, 'BaseRepository.softDelete marks document deleted');

  const hidden = await repository.findById(created._id.toString());
  assert(!hidden, 'BaseRepository.findById excludes soft-deleted documents');

  await Placement.deleteMany({ company: 'CRUD Infra Test Co' });
  await disconnectDatabase();
};

const runTests = async (): Promise<void> => {
  console.log('Running CRUD infrastructure tests...');

  testErrorClasses();
  testResponseHelpers();
  await testValidationMiddleware();
  await testAsyncHandler();
  testErrorMiddleware();
  await testBaseRepository();

  console.log('\nAll CRUD infrastructure tests passed.');
};

runTests().catch(async (error) => {
  console.error('\nCRUD infrastructure tests failed:', error);
  await disconnectDatabase().catch(() => undefined);
  process.exit(1);
});
