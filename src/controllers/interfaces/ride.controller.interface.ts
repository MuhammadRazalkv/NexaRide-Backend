import { Request, Response, NextFunction } from 'express';
import { ExtendedRequest } from '../../middlewares/auth.middleware';
export interface IRideController {
  checkCabs(req: ExtendedRequest, res: Response, next: NextFunction): Promise<void>;
  assignRandomLocation(req: ExtendedRequest, res: Response, next: NextFunction): Promise<void>;
  verifyRideOTP(req: ExtendedRequest, res: Response, next: NextFunction): Promise<void>;
  getRideHistory(req: ExtendedRequest, res: Response, next: NextFunction): Promise<void>;
  getRideHistoryDriver(req: ExtendedRequest, res: Response, next: NextFunction): Promise<void>;
  checkPaymentStatus(req: ExtendedRequest, res: Response, next: NextFunction): Promise<void>;
  getRIdeInfoForUser(req: ExtendedRequest, res: Response, next: NextFunction): Promise<void>;
  fileComplaint(req: ExtendedRequest, res: Response, next: NextFunction): Promise<void>;
  // getRIdeInfoForDriver(req:ExtendedRequest,res:Response , next:NextFunction):Promise<void>
  getRIdeInfoForDriver(req: ExtendedRequest, res: Response, next: NextFunction): Promise<void>;
  giveFeedBack(req: ExtendedRequest, res: Response, next: NextFunction): Promise<void>;
  rideSummary(req: ExtendedRequest, res: Response, next: NextFunction): Promise<void>;
  feedBackSummary(req: ExtendedRequest, res: Response, next: NextFunction): Promise<void>;
}
