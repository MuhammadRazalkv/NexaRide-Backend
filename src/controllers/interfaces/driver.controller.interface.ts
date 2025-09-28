import { Request, Response, NextFunction } from 'express';
import { ExtendedRequest } from '../../middlewares/auth.middleware';
export default interface IDriverController {
  emailVerification(req: Request, res: Response, next: NextFunction): Promise<void>;
  verifyOTP(req: Request, res: Response, next: NextFunction): Promise<void>;
  addInfo(req: Request, res: Response, next: NextFunction): Promise<void>;
  addVehicle(req: Request, res: Response, next: NextFunction): Promise<void>;
  login(req: Request, res: Response, next: NextFunction): Promise<void>;
  checkGoogleAuth(req: Request, res: Response, next: NextFunction): Promise<void>;
  getStatus(req: ExtendedRequest, res: Response, next: NextFunction): Promise<void>;
  rejectReason(req: ExtendedRequest, res: Response, next: NextFunction): Promise<void>;
  reApplyDriver(req: ExtendedRequest, res: Response, next: NextFunction): Promise<void>;
  vehicleRejectReason(req: ExtendedRequest, res: Response, next: NextFunction): Promise<void>;
  reApplyVehicle(req: ExtendedRequest, res: Response, next: NextFunction): Promise<void>;
  googleLogin(req: Request, res: Response, next: NextFunction): Promise<void>;
  requestPasswordReset(req: Request, res: Response, next: NextFunction): Promise<void>;
  getDriverInfo(req: ExtendedRequest, res: Response, next: NextFunction): Promise<void>;
  updateDriverInfo(req: ExtendedRequest, res: Response, next: NextFunction): Promise<void>;
  updateAvailability(req: ExtendedRequest, res: Response, next: NextFunction): Promise<void>;
  getCurrentLocation(req: ExtendedRequest, res: Response, next: NextFunction): Promise<void>;
  refreshToken(req: Request, res: Response, next: NextFunction): Promise<void>;
  logout(req: Request, res: Response, next: NextFunction): Promise<void>;
}
