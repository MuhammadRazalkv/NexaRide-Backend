import { Response, NextFunction } from 'express';
import { ExtendedRequest } from '../../middlewares/auth.middleware';
export interface IPaymentController {
  addMoneyToWallet(req: ExtendedRequest, res: Response, next: NextFunction): Promise<void>;
  getWalletInfo(req: ExtendedRequest, res: Response, next: NextFunction): Promise<void>;
  webhook(req: ExtendedRequest, res: Response, next: NextFunction): Promise<void>;
  payUsingWallet(req: ExtendedRequest, res: Response, next: NextFunction): Promise<void>;
  payUsingStripe(req: ExtendedRequest, res: Response, next: NextFunction): Promise<void>;
  upgradeToPlus(req: ExtendedRequest, res: Response, next: NextFunction): Promise<void>;
  transactionSummary(req: ExtendedRequest, res: Response, next: NextFunction): Promise<void>;
  earningsSummary(req: ExtendedRequest, res: Response, next: NextFunction): Promise<void>;
}
