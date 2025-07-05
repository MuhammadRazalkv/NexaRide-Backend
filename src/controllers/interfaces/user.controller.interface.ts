import { Request, Response, NextFunction } from "express";
import { ExtendedRequest } from "../../middlewares/auth.middleware";

export interface IUserController {
  emailVerification(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void>;
  verifyOTP(req: Request, res: Response, next: NextFunction): Promise<void>;
  addInfo(req: Request, res: Response, next: NextFunction): Promise<void>;
  reSendOTP(req: Request, res: Response, next: NextFunction): Promise<void>;
  login(req: Request, res: Response, next: NextFunction): Promise<void>;
  googleLogin(req: Request, res: Response, next: NextFunction): Promise<void>;
  requestPasswordReset(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void>;
  resetPassword(req: Request, res: Response, next: NextFunction): Promise<void>;
  getUserInfo(req: ExtendedRequest, res: Response, next: NextFunction): Promise<void>;
  refreshToken(req: Request, res: Response, next: NextFunction): Promise<void>;
  updateUserName(req: ExtendedRequest, res: Response,next:NextFunction): Promise<void>;
  updateUserPhone(req: ExtendedRequest, res: Response, next: NextFunction): Promise<void>;
  updateUserPfp(req: ExtendedRequest, res: Response, next: NextFunction): Promise<void>;
  subscriptionStatus(req: ExtendedRequest, res: Response, next: NextFunction): Promise<void>;
  subscriptionHistory(req: ExtendedRequest, res: Response, next: NextFunction): Promise<void>;
  logout(req: Request, res: Response, next: NextFunction): Promise<void>;
  // rideSummary(req: ExtendedRequest, res: Response, next: NextFunction): Promise<void>;
}
