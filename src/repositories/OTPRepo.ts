import redis from "../config/redis";
import { IOTPRepo } from "../interface/IOTPRepo";
import sendEmail from "../utils/mailSender";

class OTPRepo implements IOTPRepo {
    private OTP_EXPIRATION = 1 * 60;

    async setOTP(email: string, otp: string): Promise<void> {
        await redis.set(`otp:${email}`, otp, "EX", this.OTP_EXPIRATION)
    }

    async getOTP(email: string): Promise<string | null> {
        return await redis.get(`otp:${email}`);
    }

    async deleteOTP(email: string) {
        await redis.del(`otp:${email}`);
    }

    // Mark email as verified
    async markEmailVerified(email: string) {
        await redis.set(`verified:${email}`, "true", "EX", 24 * 60 * 60); // Expire in 24 hours
    }

    // Check if email is verified
    async isEmailVerified(email: string): Promise<boolean> {
        const isVerified = await redis.get(`verified:${email}`);
        return isVerified === "true";
    }

    // Delete verified email (optional, if needed)
    async deleteVerifiedEmail(email: string) {
        await redis.del(`verified:${email}`);
    }
    

    async sendOTP(to : string , subject : string , msg : string){
        await sendEmail(to,subject,msg)
    }

}

export default new OTPRepo()