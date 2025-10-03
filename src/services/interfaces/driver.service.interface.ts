import { DriverReApplyDTO, DriverSchemaDTO, LoginDTO } from '../../dtos/request/auth.req.dto';
import { LoginResDTO } from '../../dtos/response/auth.res.dto';
import { DriverResDTO } from '../../dtos/response/driver.res.dto';
import { IDrivers } from '../../models/driver.model';

export interface IDriverWithVehicle extends Omit<Partial<IDrivers>, 'vehicleId'> {
  vehicleDetails: {
    brand: string;
    vehicleModel: string;
    color: string;
    category: 'Basic' | 'Premium' | 'Luxury';
  };
}

export interface IDriverService {
  emailVerification(email: string): Promise<void>;
  verifyOTP(email: string, otp: string): Promise<void>;
  reSendOTP(email: string): Promise<void>;
  addInfo(data: DriverSchemaDTO): Promise<{
    driverId: string;
  }>;
  login(driverData: LoginDTO): Promise<LoginResDTO>;
  getStatus(driverId: string): Promise<{
    driverStatus: string;
    vehicleStatus: string;
  }>;
  rejectReason(driverId: string): Promise<string | undefined>;
  reApplyDriver(id: string, data: DriverReApplyDTO): Promise<DriverResDTO>;
  checkGoogleAuth(id: string, email: string): Promise<string>;
  googleLogin(googleId: string, email: string, profilePic?: string): Promise<LoginResDTO>;
  requestPasswordReset(email: string): Promise<void>;
  resetPassword(id: string, token: string, password: string): Promise<void>;
  getDriverInfo(id: string): Promise<DriverResDTO>;
  updateDriverInfo(id: string, field: keyof DriverSchemaDTO, value: string): Promise<string>;
  toggleAvailability(id: string): Promise<void>;
  getCurrentLocation(id: string): Promise<[number, number]>;
  refreshToken(token: string): Promise<{
    newAccessToken: string;
    newRefreshToken: string;
  }>;
  updateProfilePic(id: string, image: string): Promise<string | undefined>;
  getPriceByCategory(category: string): Promise<number>;
  logout(refreshToken: string, accessToken: string): Promise<void>;
}
