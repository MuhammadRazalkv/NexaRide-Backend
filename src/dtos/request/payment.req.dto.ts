import { z } from 'zod';
import { messages } from '../../constants/httpMessages';
export const amountDTO = z.object({
  amount: z.number().min(50, messages.WALLET_MINIMUM_AMOUNT).max(3000, messages.WALLET_MAX_AMOUNT),
});
export type AmountDTO = z.infer<typeof amountDTO>;
export const subTypeDTO = z.object({
  type: z.enum(['yearly', 'monthly'], {
    errorMap: () => ({
      message: "Invalid subscription type. Must be 'yearly' or 'monthly'.",
    }),
  }),
});
export type SubTypeDTO = z.infer<typeof subTypeDTO>;
