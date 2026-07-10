import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { facultyAchievementService } from '../services/facultyAchievement.service';
import { asyncHandler } from '../middleware/asyncHandler';
import { UnauthorizedError } from '../utils/errors';
import { FacultyAchievementListQuery } from '../validations/facultyAchievement.validation';

class FacultyAchievementController extends BaseController {
  list = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const query = req.query as unknown as FacultyAchievementListQuery;

    const result = await facultyAchievementService.listFacultyAchievements(
      {
        search: query.search,
        facultyName: query.facultyName,
        designation: query.designation,
        achievementType: query.achievementType,
        fromDate: query.fromDate,
        toDate: query.toDate,
      },
      { page: query.page, limit: query.limit },
      { sortBy: query.sortBy, sortOrder: query.sortOrder },
    );

    this.paginated(res, 'Faculty achievements retrieved successfully', result.items, result.meta);
  });

  getById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const record = await facultyAchievementService.getById(req.params.id);
    this.success(res, 'Faculty achievement retrieved successfully', record);
  });

  create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = this.requireUserId(req);
    const record = await facultyAchievementService.createFacultyAchievement(req.body, userId);
    this.created(res, 'Faculty achievement created successfully', record);
  });

  update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = this.requireUserId(req);
    const record = await facultyAchievementService.updateFacultyAchievement(
      req.params.id,
      req.body,
      userId,
    );
    this.success(res, 'Faculty achievement updated successfully', record);
  });

  remove = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = this.requireUserId(req);
    await facultyAchievementService.deleteFacultyAchievement(req.params.id, userId);
    this.success(res, 'Faculty achievement deleted successfully');
  });

  private requireUserId(req: Request): string {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    return req.user.id;
  }
}

export const facultyAchievementController = new FacultyAchievementController();
