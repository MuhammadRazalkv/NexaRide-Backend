import { z, ZodTypeAny } from 'zod';
import { Response, NextFunction } from 'express';
import { validate } from '../utils/validators/validateZod';
import { ExtendedRequest } from './auth.middleware';

export const validateQuery =
  <T extends ZodTypeAny>(schema: T) =>
  (req: ExtendedRequest<any, z.infer<T>>, res: Response, next: NextFunction) => {
    try {
      console.log(req.query);
      const parsed = validate(schema, req.query);
      req.validatedQuery = parsed;
      next();
    } catch (err) {
      next(err);
    }
  };
