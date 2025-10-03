import { z } from 'zod';
import { messages } from '../../constants/httpMessages';
export const amountDTO = z
  .number()
  .min(50, messages.WALLET_MINIMUM_AMOUNT)
  .max(3000, messages.WALLET_MAX_AMOUNT);
export const subTypeDTO = z.enum(['yearly', 'monthly'], {
  errorMap: () => ({
    message: "Invalid subscription type. Must be 'yearly' or 'monthly'.",
  }),
});
