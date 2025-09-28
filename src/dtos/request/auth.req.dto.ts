import { z } from 'zod';

export const loginDTO = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
export type LoginDTO = z.infer<typeof loginDTO>;
