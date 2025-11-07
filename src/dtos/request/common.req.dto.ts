import { z } from 'zod';
import { messages } from '../../constants/httpMessages';
export const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, messages.INVALID_ID);

export const idSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, messages.INVALID_ID),
});
export type IdDTO = z.infer<typeof idSchema>;
