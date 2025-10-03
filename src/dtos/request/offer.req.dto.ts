import { z } from 'zod';

export const OfferSchema = z.object({
  title: z.string().min(1, 'Title is required.').trim(),

  type: z.enum(['flat', 'percentage'], {
    errorMap: () => ({
      message: "Invalid offer type. Must be 'flat' or 'percentage'.",
    }),
  }),

  value: z
    .number({ invalid_type_error: 'Value must be a number greater than 0.' })
    .positive('Value must be a number greater than 0.'),

  maxDiscount: z.number().optional(),

  minFare: z.number().min(0, 'Minimum fare cannot be negative.').optional(),

  validFrom: z
    .number()
    .refine((v) => !isNaN(v), { message: 'Valid from date must be a valid timestamp.' }),

  validTill: z
    .number()
    .refine((v) => !isNaN(v), { message: 'Valid till date must be a valid timestamp.' }),

  usageLimitPerUser: z.number().min(1, 'Limit per user must be positive number.'),
});

// Add cross-field refinements
export const OfferSchemaWithRefinements = OfferSchema.superRefine((data, ctx) => {
  if (data.type === 'percentage') {
    if (data.value > 90 || data.value < 1) {
      ctx.addIssue({
        path: ['value'],
        code: 'custom',
        message: 'Percentage value should be between 1 - 90',
      });
    }
    if (!data.maxDiscount || data.maxDiscount <= 0) {
      ctx.addIssue({
        path: ['maxDiscount'],
        code: 'custom',
        message: 'Max discount is required for percentage offers and must be > 0.',
      });
    }
  }

  if (data.validTill <= data.validFrom) {
    ctx.addIssue({
      path: ['validTill'],
      code: 'custom',
      message: 'Valid till must be after valid from.',
    });
  }
});

export type OfferSchemaDTO = z.infer<typeof OfferSchemaWithRefinements>;
