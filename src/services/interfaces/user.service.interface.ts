import { UserSchemaDTO } from '../../dtos/request/auth.req.dto';
import { LoginResDTO } from '../../dtos/response/auth.res.dto';
import { SubscriptionResDTO } from '../../dtos/response/subscription.res.dto';
import { UserResDTO } from '../../dtos/response/user.dto';
export default interface IUserService {
  emailVerification(email: string): Promise<void>;
  verifyOTP(email: string, otp: string): Promise<void>;
  reSendOTP(email: string): Promise<void>;
  addInfo(userData: UserSchemaDTO): Promise<LoginResDTO>;
  login(email: string, password: string): Promise<LoginResDTO>;
  googleLogin(email: string, googleId: string, name: string): Promise<LoginResDTO>;
  requestPasswordReset(email: string): Promise<void>;
  resetPassword(id: string, token: string, password: string): Promise<void>;
  getUserInfo(id: string): Promise<UserResDTO | null>;
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
    page: number,
  ): Promise<{ history: SubscriptionResDTO[]; total: number }>;
  logout(id: string, refreshToken: string, accessToken: string): Promise<void>;
  // dashboard(userId:string):Promise<{totalRides:number,completedRides:number,cancelledRides:number}>
}
