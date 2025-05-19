interface IUserReturn {
  user: {
    _id: unknown;
    name: string;
    email: string;
    role?: string;
    profilePic?: string;
  };
  accessToken: string;
  refreshToken: string;
}
import { IUser } from "../../models/user.model";
import { IWallet } from "../../models/user.wallet.model";
export default interface IUserService {
  emailVerification(email: string): Promise<void>;
  verifyOTP(email: string, otp: string): Promise<void>;
  reSendOTP(email: string): Promise<void>;
  addInfo(userData: IUser): Promise<IUserReturn>;
  login(email: string, password: string): Promise<IUserReturn>;
  googleLogin(
    email: string,
    googleId: string,
    name: string
  ): Promise<Partial<IUserReturn>>;
  requestPasswordReset(email: string): Promise<void>;
  resetPassword(id: string, token: string, password: string): Promise<void>;
  getUserInfo(id: string): Promise<IUser | null>;
  refreshToken(token: string): Promise<{
    newAccessToken: string;
    newRefreshToken: string;
  }>;
  updateUserName(id: string, name: string): Promise<string | undefined>;
  updateUserPhone(id: string, phone: number): Promise<number | undefined>;
  updateUserPfp(id: string, image: string): Promise<string | undefined>;
  subscriptionStatus(
    userId: string
  ): Promise<{
    isSubscribed: boolean;
    expiresAt: number | undefined;
    type: string | undefined;
  }>;
}
