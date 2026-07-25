import { Router } from 'express';
import { searchController } from '../controllers/search.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorizePermission } from '../middleware/authorize.middleware';
import { validate, validateQuery } from '../middleware/validate.middleware';
import { searchListQuerySchema, searchExecuteSchema, searchRequestSchema } from '../validations/search.validation';

const searchRouter = Router();

searchRouter.use(authenticate, authorizePermission('search'));

searchRouter.get('/status', searchController.status);
searchRouter.get('/collections', searchController.collections);

searchRouter.post('/execute', validate(searchExecuteSchema), searchController.execute);

searchRouter.post('/', validate(searchRequestSchema), searchController.search);

searchRouter.get('/', validateQuery(searchListQuerySchema), searchController.searchByQuery);

export default searchRouter;
