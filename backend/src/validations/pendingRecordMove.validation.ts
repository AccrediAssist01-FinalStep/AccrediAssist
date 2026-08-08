import { z } from 'zod';

export const movePendingRecordSchema = z.object({
  moduleId: z.enum(['student', 'faculty', 'department']),
  submoduleId: z.string().trim().min(1),
});

export type MovePendingRecordBody = z.infer<typeof movePendingRecordSchema>;
