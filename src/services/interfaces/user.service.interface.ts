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
import { ISubscription } from "../../models/subscription.model";
import { IUser } from "../../models/user.model";
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
  subscriptionStatus(userId: string): Promise<{
    isSubscribed: boolean;
    expiresAt: number | undefined;
    type: string | undefined;
  }>;
  subscriptionHistory(
    userId: string,
    page: number
  ): Promise<{ history: ISubscription[]; total: number } >;
  logout(refreshToken:string,accessToken:string):Promise<void>
  // dashboard(userId:string):Promise<{totalRides:number,completedRides:number,cancelledRides:number}>
}
