import { z, ZodTypeAny } from 'zod';
import { Response, NextFunction } from 'express';

import { validate } from '../utils/validators/validateZod';
import { ExtendedRequest } from './auth.middleware';

export const validateBody =
  <T extends ZodTypeAny>(schema: T) =>
  (req: ExtendedRequest<z.infer<T>>, res: Response, next: NextFunction) => {
    try {
      console.log(req.body);

      const parsed = validate(schema, req.body);
      req.validatedBody = parsed;
      next();
    } catch (err) {
      next(err);
    }
  };
