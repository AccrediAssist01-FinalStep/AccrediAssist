import { z } from 'zod';

export const whatsappDisconnectQuerySchema = z.object({
  logout: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value === 'true'),
});

export type WhatsAppDisconnectQuery = z.infer<typeof whatsappDisconnectQuerySchema>;
