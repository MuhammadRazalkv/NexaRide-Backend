import { z } from 'zod';
import { messages } from '../../constants/httpMessages';

export const checkCabsDTO = z.object({
  pickUpPoint: z.object({
    lat: z.number().min(-90).max(90, { message: 'Latitude must be between -90 and 90' }),
    lng: z.number().min(-180).max(180, { message: 'Longitude must be between -180 and 180' }),
  }),
  dropOffPoint: z.object({
    lat: z.number().min(-90).max(90, { message: 'Latitude must be between -90 and 90' }),
    lng: z.number().min(-180).max(180, { message: 'Longitude must be between -180 and 180' }),
  }),
  distance: z.number().positive({ message: 'Distance must be greater than 0' }),
  time: z.number().positive({ message: 'Time must be greater than 0' }),
});
export type CheckCabs = z.infer<typeof checkCabsDTO>;

export const otpDTO = z
  .string()
  .length(4, 'OTP must be exactly 4 digits')
  .regex(/^\d{4}$/, 'OTP must contain only digits');

export const requestedByDTO = z.enum(['driver', 'user'], {
  errorMap: () => ({
    message: messages.INVALID_PARAMETERS,
  }),
});
