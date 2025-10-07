import { getFromRedis, removeFromRedis, setToRedis } from '../config/redis';
import { IOTPRepo } from '../interface/otp.repo.interface';
import sendEmail from '../utils/mailSender';

class OTPRepo implements IOTPRepo {
  private OTP_EXPIRATION = 1 * 60;

  async setOTP(email: string, otp: string): Promise<void> {
    await setToRedis(`otp:${email}`, otp, this.OTP_EXPIRATION);
  }

  async getOTP(email: string): Promise<string | null> {
    return await getFromRedis(`otp:${email}`);
  }

  async deleteOTP(email: string) {
    await removeFromRedis(`otp:${email}`);
  }

  // Mark email as verified
  async markEmailVerified(email: string) {
    await setToRedis(`verified:${email}`, 'true', 24 * 60 * 60);
  }

  // Check if email is verified
  async isEmailVerified(email: string): Promise<boolean> {
    const isVerified = await getFromRedis(`verified:${email}`);
    return isVerified === 'true';
  }

  // Delete verified email
  async deleteVerifiedEmail(email: string) {
    await removeFromRedis(`verified:${email}`);
  }

  async sendOTP(to: string, subject: string, msg: string) {
    await sendEmail(to, subject, msg);
  }
}

export default new OTPRepo();
