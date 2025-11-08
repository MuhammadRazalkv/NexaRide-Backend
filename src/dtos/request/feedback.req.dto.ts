import { z } from 'zod';
import { messages } from '../../constants/httpMessages';

export const feedBakReqDTO = z.object({
  rideId: z
    .string({
      required_error: 'Ride ID is required',
      invalid_type_error: 'Ride ID must be a string',
    })
    .regex(/^[0-9a-fA-F]{24}$/, messages.INVALID_ID),

  submittedBy: z.enum(['driver', 'user'], {
    required_error: 'submittedBy is required',
    invalid_type_error: "submittedBy must be either 'driver' or 'user'",
  }),

  rating: z.coerce
    .number({
      required_error: 'Rating is required',
      invalid_type_error: 'Rating must be a number',
    })
    .min(0, 'Rating must be >= 0')
    .max(5, 'Rating must be <= 5'),

  feedback: z
    .string({
      invalid_type_error: 'Feedback must be a string',
    })
    .optional(),
});
export type FeedBakReqDTO = z.infer<typeof feedBakReqDTO>;
