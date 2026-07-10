import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { studentAchievementService } from '../services/studentAchievement.service';
import { asyncHandler } from '../middleware/asyncHandler';
import { UnauthorizedError } from '../utils/errors';
import { StudentAchievementListQuery } from '../validations/studentAchievement.validation';

class StudentAchievementController extends BaseController {
  list = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const query = req.query as unknown as StudentAchievementListQuery;

    const result = await studentAchievementService.listStudentAchievements(
      {
        search: query.search,
        studentName: query.studentName,
        department: query.department,
        achievementType: query.achievementType,
        fromDate: query.fromDate,
        toDate: query.toDate,
      },
      { page: query.page, limit: query.limit },
      { sortBy: query.sortBy, sortOrder: query.sortOrder },
    );

    this.paginated(res, 'Student achievements retrieved successfully', result.items, result.meta);
  });

  getById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const record = await studentAchievementService.getById(req.params.id);
    this.success(res, 'Student achievement retrieved successfully', record);
  });

  create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = this.requireUserId(req);
    const record = await studentAchievementService.createStudentAchievement(req.body, userId);
    this.created(res, 'Student achievement created successfully', record);
  });

  update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = this.requireUserId(req);
    const record = await studentAchievementService.updateStudentAchievement(
      req.params.id,
      req.body,
      userId,
    );
    this.success(res, 'Student achievement updated successfully', record);
  });

  remove = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = this.requireUserId(req);
    await studentAchievementService.deleteStudentAchievement(req.params.id, userId);
    this.success(res, 'Student achievement deleted successfully');
  });

  private requireUserId(req: Request): string {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    return req.user.id;
  }
}

export const studentAchievementController = new StudentAchievementController();
