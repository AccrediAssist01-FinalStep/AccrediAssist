import { z } from 'zod';
import { AGGREGATION_MODULE_KEYS } from '../interfaces/aggregation.interface';

export const aggregationFiltersSchema = z.object({
  department: z.string().trim().optional(),
  academicYear: z.string().trim().optional(),
  semester: z.union([z.literal(1), z.literal(2)]).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  category: z.string().trim().optional(),
  faculty: z.string().trim().optional(),
  student: z.string().trim().optional(),
  modules: z.array(z.enum(AGGREGATION_MODULE_KEYS)).optional(),
});

export type AggregationFiltersBody = z.infer<typeof aggregationFiltersSchema>;
