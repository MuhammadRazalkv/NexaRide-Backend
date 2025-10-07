import { z } from 'zod';

export const fareSchema = z
  .object({
    basic: z.number().min(0, 'Basic fare must be at least 0'),
    premium: z.number().min(0, 'Premium fare must be at least 0'),
    luxury: z.number().min(0, 'Luxury fare must be at least 0'),
  })
  .refine((fare) => fare.premium > fare.basic, {
    message: 'Premium fare must be higher than Basic fare',
    path: ['premium'],
  })
  .refine((fare) => fare.luxury > fare.premium, {
    message: 'Luxury fare must be higher than Premium fare',
    path: ['luxury'],
  });

export type FareSchemaDTO = z.infer<typeof fareSchema>;
