export interface IOTPRepo {
  setOTP(email: string, otp: string): Promise<void>;
  getOTP(email: string): Promise<string | null>;
  deleteOTP(email: string): Promise<void>;
  markEmailVerified(email: string): Promise<void>;
  isEmailVerified(email: string): Promise<boolean>;
  deleteVerifiedEmail(email: string): Promise<void>;
  sendOTP(to: string, subject: string, msg: string): Promise<void>;
}
