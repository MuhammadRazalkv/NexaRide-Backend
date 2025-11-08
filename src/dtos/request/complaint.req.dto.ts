import { z } from 'zod';
import { messages } from '../../constants/httpMessages';

export const complaintReqDTO = z
  .object({
    rideId: z.string().regex(/^[0-9a-fA-F]{24}$/, messages.INVALID_ID),
    filedByRole: z.enum(['user', 'driver'], {
      errorMap: () => ({
        message: 'Invalid role . You must be a driver or user to file a complaint',
      }),
    }),
    complaintReason: z.string().min(3, 'Provide a valid reason'),
    description: z.string().trim().min(3, 'Provide a valid description').optional(),
  })
  .superRefine((data, ctx) => {
    if (data.complaintReason.toLowerCase() === 'other' && !data.description) {
      ctx.addIssue({
        path: ['description'],
        code: 'custom',
        message: "Description is required when reason is 'other'",
      });
    }
  });
export type ComplaintReqDTO = z.infer<typeof complaintReqDTO>;
