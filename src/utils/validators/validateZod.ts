import { ZodSchema } from 'zod';
import { AppError } from '../appError';
import { HttpStatus } from '../../constants/httpStatusCodes';

export function validate<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    const errorMessages = result.error.errors.map((err) => err.message).join(', ');
    throw new AppError(HttpStatus.BAD_REQUEST, errorMessages);
  }

  return result.data;
}
