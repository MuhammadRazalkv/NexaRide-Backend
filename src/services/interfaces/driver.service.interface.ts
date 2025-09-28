import { LoginDTO } from '../../dtos/request/auth.req.dto';
import { LoginResDTO } from '../../dtos/response/auth.res.dto';
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
  addInfo(data: IDrivers): Promise<{
    driverId: string;
  }>;
  login(driverData: LoginDTO): Promise<LoginResDTO>;
  getStatus(driverId: string): Promise<{
    driverStatus: string | undefined;
    vehicleStatus: string | undefined;
    // isAvailable: String;
  }>;
  rejectReason(driverId: string): Promise<string | undefined>;
  reApplyDriver(id: string, data: IDrivers): Promise<IDrivers | null>;
  checkGoogleAuth(id: string, email: string): Promise<string | undefined>;
  googleLogin(googleId: string, email: string, profilePic?: string): Promise<LoginResDTO>;
  requestPasswordReset(email: string): Promise<void>;
  resetPassword(id: string, token: string, password: string): Promise<void>;
  getDriverInfo(id: string): Promise<Partial<IDrivers>>;
  updateDriverInfo(id: string, field: keyof IDrivers, value: string): Promise<string>;
  toggleAvailability(id: string): Promise<void>;
  // statusOnRide(id: string): Promise<void>;
  getCurrentLocation(id: string): Promise<[number, number]>;
  // goBackToOnline(id: string): Promise<void>;
  refreshToken(token: string): Promise<{
    newAccessToken: string;
    newRefreshToken: string;
  }>;
  updateProfilePic(id: string, image: string): Promise<string | undefined>;
  getPriceByCategory(category: string): Promise<number>;
  logout(refreshToken: string, accessToken: string): Promise<void>;
}
