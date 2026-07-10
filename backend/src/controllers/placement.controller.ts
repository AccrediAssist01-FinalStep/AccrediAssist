import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { placementService } from '../services/placement.service';
import { asyncHandler } from '../middleware/asyncHandler';
import { UnauthorizedError } from '../utils/errors';
import { PlacementListQuery } from '../validations/placement.validation';

class PlacementController extends BaseController {
  list = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const query = req.query as unknown as PlacementListQuery;

    const result = await placementService.listPlacements(
      {
        search: query.search,
        company: query.company,
        department: query.department,
      },
      { page: query.page, limit: query.limit },
      { sortBy: query.sortBy, sortOrder: query.sortOrder },
    );

    this.paginated(res, 'Placements retrieved successfully', result.items, result.meta);
  });

  getById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const record = await placementService.getById(req.params.id);
    this.success(res, 'Placement retrieved successfully', record);
  });

  create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = this.requireUserId(req);
    const record = await placementService.createPlacement(req.body, userId);
    this.created(res, 'Placement created successfully', record);
  });

  update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = this.requireUserId(req);
    const record = await placementService.updatePlacement(req.params.id, req.body, userId);
    this.success(res, 'Placement updated successfully', record);
  });

  remove = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = this.requireUserId(req);
    await placementService.deletePlacement(req.params.id, userId);
    this.success(res, 'Placement deleted successfully');
  });

  private requireUserId(req: Request): string {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    return req.user.id;
  }
}

export const placementController = new PlacementController();
