import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { HttpStatus } from '../constants/httpStatusCodes';
import { messages } from '../constants/httpMessages';
import { UserRepository } from '../repositories/user.repo';
import { DriverRepo } from '../repositories/driver.repo';
import { getFromRedis } from '../config/redis';

const ACCESS_SECRET = process.env.ACCESS_SECRET || 'access_secret';
export interface ExtendedRequest extends Request {
  id?: string;
}
interface JwtPayload {
  id: string;
  role: string;
}

export const authenticateWithRoles = (
  role: 'user' | 'driver' | 'admin',
  repo?: UserRepository | DriverRepo,
) => {
  return async (req: ExtendedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      console.log('No token error ');

      res.status(HttpStatus.UNAUTHORIZED).json({ message: messages.FORBIDDEN });
      return;
    }

    try {
      const decoded = jwt.verify(token, ACCESS_SECRET) as JwtPayload;

      if (decoded.role !== role) {
        console.log('No matching role ');

        res.status(HttpStatus.FORBIDDEN).json({ message: messages.FORBIDDEN });
        return;
      }

      const blackListed = await getFromRedis(token);
      if (blackListed) {
        res.status(HttpStatus.UNAUTHORIZED).json({ message: 'Token is blacklisted' });
        return;
      }
      req.id = decoded.id;

      if (decoded.role !== 'admin' && repo) {
        const user = await repo.findById(req.id);
        if (!user) {
          res.status(HttpStatus.NOT_FOUND).json({ message: messages.USER_NOT_FOUND });
          return;
        }

        if (user.isBlocked) {
          res.status(HttpStatus.FORBIDDEN).json({
            message: messages.ACCOUNT_BLOCKED,
          });
          return;
        }
      }

      next();
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        console.log('TokenExpiredError ', role);

        res.status(HttpStatus.UNAUTHORIZED).json({ message: messages.TOKEN_EXPIRED });
        return;
      }
      if (error.name === 'JsonWebTokenError') {
        console.log('JsonWebTokenError ', role);

        res.status(HttpStatus.UNAUTHORIZED).json({ message: messages.INVALID_TOKEN });
        return;
      }
      next(error);
    }
  };
};
