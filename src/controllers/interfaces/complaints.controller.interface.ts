import { NextFunction, Response } from 'express';
import { ExtendedRequest } from '../../middlewares/auth.middleware';

export interface IComplaintsController {
  fileComplaint(req: ExtendedRequest, res: Response, next: NextFunction): Promise<void>;
}
