import { z } from 'zod';

export const querySchema = z.object({
  search: z.string().trim().optional().default(''),
  sort: z.string().optional().default(''),
  page: z.coerce.number().int().min(1).default(1),
  filter: z.string().optional().default(''),
});

export type QuerySchemaDTO = z.infer<typeof querySchema>;
