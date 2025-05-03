import { IDrivers } from "../../models/driver.model";
import { IDriverWallet } from "../../models/driver.wallet.model";
interface DriverLoginResponse {
  driver: {
    _id: unknown;
    name: string;
    email: string;
    profilePic?: string;
  };
  accessToken: string;
  refreshToken: string;
}
export interface IDriverWithVehicle extends Omit<Partial<IDrivers>, "vehicleId"> {
  vehicleDetails: {
    brand: string;
    vehicleModel: string;
    color: string;
    category: string;
  };
}

export interface IDriverService {
  emailVerification(email: string): Promise<void>;
  verifyOTP(email: string, otp: string): Promise<void>;
  reSendOTP(email: string): Promise<void>;
  addInfo(data: IDrivers): Promise<{
    driverId: string;
  }>;
  login(driverData: IDrivers): Promise<DriverLoginResponse>;
  getStatus(driverId: string): Promise<{
    driverStatus: string | undefined;
    vehicleStatus: string | undefined;
    isAvailable: String;
  }>;
  rejectReason(driverId: string): Promise<string | undefined>;
  reApplyDriver(id: string, data: IDrivers): Promise<IDrivers | null>;
  checkGoogleAuth(id: string, email: string): Promise<string | undefined>;
  googleLogin(
    googleId: string,
    email: string,
    profilePic?: string
  ): Promise<DriverLoginResponse>;
  requestPasswordReset(email: string): Promise<void>;
  resetPassword(id: string, token: string, password: string): Promise<void>;
  getDriverInfo(id: string): Promise<Partial<IDrivers>>;
  updateDriverInfo(
    id: string,
    field: keyof IDrivers,
    value: string
  ): Promise<string>;
  toggleAvailability(id: string): Promise<String | undefined>;
  statusOnRide(id: string): Promise<void>;
  getCurrentLocation(id: string): Promise<[number, number]>;
  goBackToOnline(id: string): Promise<void>;
  refreshToken(token: string): Promise<{
    newAccessToken: string;
    newRefreshToken: string;
  }>;
  updateProfilePic(id: string, image: string): Promise<string | undefined>;
}
