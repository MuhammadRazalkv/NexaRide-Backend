import { z } from 'zod';
import { messages } from '../../constants/httpMessages';

export const feedBakReqDTO = z.object({
  rideId: z.string().regex(/^[0-9a-fA-F]{24}$/, messages.INVALID_ID),
  submittedBy: z.enum(['driver', 'user']),
  rating: z.coerce.number().min(0).max(5),
  feedback: z.string().min(5, 'Add minimum or 5 Char').optional(),
});
export type FeedBakReqDTO = z.infer<typeof feedBakReqDTO>;
