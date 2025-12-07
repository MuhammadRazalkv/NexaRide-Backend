import { NextFunction, Request, Response } from 'express';
import { getFromRedis } from '../config/redis';
import { AppError } from '../utils/appError';
import { HttpStatus } from '../constants/httpStatusCodes';
import { messages } from '../constants/httpMessages';

export const verifySignupSession = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sessionId = req.headers['x-signup-session'];
      if (!sessionId) throw new AppError(HttpStatus.BAD_REQUEST, messages.TOKEN_NOT_PROVIDED);

      const session = await getFromRedis(`signup:${sessionId}`);
      if (!session) throw new AppError(HttpStatus.BAD_REQUEST, messages.INVALID_TOKEN);

      // req.verifiedEmail = data.email;
      // req.signupStep = data.step;

      req.body.email = session;

      next();
    } catch (err) {
      throw new AppError(
        HttpStatus.UNAUTHORIZED,
        err instanceof Error ? err.message : 'Failed to perform action',
      );
    }
  };
};
