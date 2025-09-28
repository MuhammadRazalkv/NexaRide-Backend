import { IUser } from '../models/user.model';
import OTPRepo from '../repositories/otp.repo';
import crypto from 'crypto';
import { html, resetLinkBtn } from '../constants/OTP';
import { hashPassword, comparePassword } from '../utils/passwordManager';
import { z } from 'zod';
import {
  generateAccessToken,
  generateRefreshToken,
  forgotPasswordToken,
  verifyRefreshToken,
  verifyForgotPasswordToken,
} from '../utils/jwt';
import sendEmail from '../utils/mailSender';
import cloudinary from '../utils/cloudinary';

import IUserService from './interfaces/user.service.interface';
import { IUserRepo } from '../repositories/interfaces/user.repo.interface';
import { AppError } from '../utils/appError';
import { messages } from '../constants/httpMessages';
import { HttpStatus } from '../constants/httpStatusCodes';
import { ISubscriptionRepo } from '../repositories/interfaces/subscription.repo.interface';
import mongoose from 'mongoose';
import { ISubscription } from '../models/subscription.model';
import { getFromRedis, setToRedis } from '../config/redis';
import { getAccessTokenMaxAge, getRefreshTokenMaxAge } from '../utils/env';

const userSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  email: z.string().email('Invalid email format'),
  phone: z.number().min(1000000000, 'Phone must be a 10-digit number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  profilePic: z.string().optional(),
  googleId: z.string().optional(),
});

const generateTokens = (userId: string) => ({
  accessToken: generateAccessToken(userId, 'user'),
  refreshToken: generateRefreshToken(userId, 'user'),
});

export class UserService implements IUserService {
  constructor(
    private userRepo: IUserRepo,
    private subscriptionRepo: ISubscriptionRepo,
  ) {}

  async emailVerification(email: string) {
    if (!email) throw new AppError(HttpStatus.BAD_REQUEST, messages.EMAIL_NOT_FOUND);
    const existingUser = await this.userRepo.findOne({ email });
    if (existingUser) throw new AppError(HttpStatus.CONFLICT, messages.EMAIL_ALREADY_EXISTS);
    const OTP = crypto.randomInt(1000, 10000).toString();
    OTPRepo.setOTP(email, OTP);
    OTPRepo.sendOTP(email, 'Your NexaRide OTP', html(OTP)).catch(console.error);
  }

  async verifyOTP(email: string, otp: string) {
    if (!email || !otp) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
    }
    const SOTP = await OTPRepo.getOTP(email);

    if (!SOTP || otp !== SOTP) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.INVALID_OTP);
    }

    OTPRepo.markEmailVerified(email);
    OTPRepo.deleteOTP(email);
  }

  async reSendOTP(email: string) {
    if (!email) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.EMAIL_NOT_FOUND);
    }
    const existingUser = await this.userRepo.findOne({ email });
    if (existingUser) throw new AppError(HttpStatus.CONFLICT, messages.EMAIL_ALREADY_EXISTS);
    const OTP = crypto.randomInt(1000, 10000).toString();
    OTPRepo.setOTP(email, OTP);
    OTPRepo.sendOTP(email, 'Your new  NexaRide OTP', html(OTP)).catch(console.error);
  }

  async addInfo(userData: IUser) {
    const parsedData = userSchema.safeParse(userData);
    if (!parsedData.success) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        messages.VALIDATION_ERROR + parsedData.error.errors.map((err) => err.message).join(', '),
      );
    }

    // Check if email is verified
    if (!(await OTPRepo.isEmailVerified(parsedData.data.email))) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.EMAIL_NOT_VERIFIED);
    }

    // Ensure password exists and hash it
    if (!parsedData.data.password)
      throw new AppError(HttpStatus.BAD_REQUEST, messages.PASSWORD_NOT_FOUND);
    parsedData.data.password = await hashPassword(parsedData.data.password);

    // Register user
    try {
      const newUser = await this.userRepo.create(parsedData.data);
      await OTPRepo.deleteVerifiedEmail(parsedData.data.email);

      // Generate tokens
      return {
        ...generateTokens(newUser._id as string),
        user: {
          _id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: 'User',
          profilePic: newUser.profilePic,
        },
      };
    } catch (error: any) {
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        const info = field === 'phone' ? 'number' : 'address';
        throw new AppError(
          HttpStatus.CONFLICT,
          `${field.charAt(0).toUpperCase() + field.slice(1)} ${info} already exists`,
        );
      }
      throw new AppError(HttpStatus.INTERNAL_SERVER_ERROR, messages.DATABASE_OPERATION_FAILED);
    }
  }

  async login(email: string, password: string) {
    if (!email || !password) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.INVALID_CREDENTIALS);
    }

    // Check if user exists
    const user = await this.userRepo.findOne({ email });
    if (!user) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.INVALID_CREDENTIALS);
    }
    if (user.isBlocked) {
      throw new AppError(HttpStatus.FORBIDDEN, messages.ACCOUNT_BLOCKED);
    }

    // Verify password
    if (!user.password) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.GOOGLE_REGISTERED_ACCOUNT);
    }
    const success = await comparePassword(password, user.password);
    if (!success) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.INVALID_CREDENTIALS);
    }
    const activeUser = await getFromRedis(`RU:${user.id}`);

    if (activeUser) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        'User is already logged in from another device or session.',
      );
    }

    // Generate tokens
    return {
      ...generateTokens(user._id as string),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: 'User',
        profilePic: user.profilePic,
      },
    };
  }

  async googleLogin(email: string, googleId: string, name: string) {
    if (!email || !googleId) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
    }

    const user = await this.userRepo.findOne({ email });

    if (user?.isBlocked) {
      throw new AppError(HttpStatus.FORBIDDEN, messages.ACCOUNT_BLOCKED);
    }

    if (!user) {
      // New user registration
      try {
        const userData = {
          email,
          googleId,
          name,
        };
        const newUser = await this.userRepo.create(userData);
        return {
          ...generateTokens(newUser._id as string),
          user: {
            _id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            profilePic: newUser.profilePic,
          },
        };
      } catch (error: any) {
        if (error.code === 11000) {
          const field = Object.keys(error.keyPattern)[0];
          const info = field === 'phone' ? 'number' : 'address';
          throw new AppError(
            HttpStatus.CONFLICT,
            `${field.charAt(0).toUpperCase() + field.slice(1)} ${info} already exists`,
          );
        }
        throw new AppError(HttpStatus.INTERNAL_SERVER_ERROR, messages.DATABASE_OPERATION_FAILED);
      }
    }

    // If user exists, only update googleId if it's missing
    if (!user.googleId) {
      await this.userRepo.updateById(user.id, { $set: { googleId } });
    }

    const activeUser = await getFromRedis(`RU:${user.id}`);

    if (activeUser) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        'User is already logged in from another device or session.',
      );
    }

    return {
      ...generateTokens(user._id as string),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        profilePic: user.profilePic,
      },
    };
  }

  async requestPasswordReset(email: string) {
    if (!email) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.EMAIL_NOT_FOUND);
    }
    const user = await this.userRepo.findOne({ email });
    if (!user) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.USER_NOT_FOUND);
    }

    const token = forgotPasswordToken(user.id, user.email);
    const resetUrl = `${process.env.FRONT_END_URL}/user/reset-password?id=${user._id}&token=${token}`;

    await sendEmail(user.email, 'Password Reset Request - Action Required', resetLinkBtn(resetUrl));
  }

  async resetPassword(id: string, token: string, password: string) {
    if (!id || !token) {
      throw new AppError(HttpStatus.BAD_GATEWAY, messages.MISSING_FIELDS);
    }
    if (!password) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.PASSWORD_NOT_FOUND);
    }
    const user = await this.userRepo.findById(id);
    if (!user) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.USER_NOT_FOUND);
    }

    const verify = verifyForgotPasswordToken(token);
    if (!verify) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.INVALID_TOKEN);
    }

    const encryptedPassword = await hashPassword(password);
    await this.userRepo.updateById(id, {
      $set: { password: encryptedPassword },
    });
  }

  async getUserInfo(id: string) {
    if (!id) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
    }
    const user = await this.userRepo.findById(id);
    return user;
  }

  async refreshToken(token: string) {
    if (!token) {
      throw new AppError(HttpStatus.UNAUTHORIZED, messages.TOKEN_NOT_PROVIDED);
    }

    const refresh = verifyRefreshToken(token);
    if (!refresh) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.TOKEN_INVALID);
    }

    const newAccessToken = generateAccessToken(refresh.id, 'user');
    const newRefreshToken = generateRefreshToken(refresh.id, 'user');

    return { newAccessToken, newRefreshToken };
  }

  async updateUserName(id: string, name: string) {
    if (!id || !name) {
      throw new Error('Fields are missing');
    }

    const res = await this.userRepo.updateById(id, { $set: { name } });
    return res?.name;
  }

  async updateUserPhone(id: string, phone: number) {
    if (!id || !phone) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
    }

    try {
      const res = await this.userRepo.updateById(id, { $set: { phone } });
      return res?.phone;
    } catch (error: any) {
      if (error instanceof mongoose.Error.CastError) {
        throw new AppError(HttpStatus.BAD_REQUEST, messages.INVALID_ID);
      }

      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];

        throw new AppError(HttpStatus.CONFLICT, `Phone already exists`);
      }

      throw new AppError(HttpStatus.INTERNAL_SERVER_ERROR, messages.DATABASE_OPERATION_FAILED);
    }
  }

  async updateUserPfp(id: string, image: string) {
    if (!id || !image) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
    }

    const res = await cloudinary.uploader.upload(image, {
      folder: '/UserProfilePic',
      // type: "authenticated",
    });
    const user = await this.userRepo.updateById(id, {
      $set: { profilePic: res.secure_url },
    });
    // const user = await this.userRepo.updatePfp(id, res.public_id);
    // const profilePicUrl = generateSignedCloudinaryUrl(user?.profilePic)
    return user?.profilePic;
  }

  async subscriptionStatus(userId: string): Promise<{
    isSubscribed: boolean;
    expiresAt: number | undefined;
    type: string | undefined;
  }> {
    if (!userId) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
    }
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.USER_NOT_FOUND);
    }

    const subInfo = await this.subscriptionRepo.findOne({
      userId,
      expiresAt: { $gt: Date.now() },
    });

    return {
      isSubscribed: subInfo ? true : false,
      expiresAt: subInfo?.expiresAt,
      type: subInfo?.type,
    };
  }

  async subscriptionHistory(
    userId: string,
    page: number,
  ): Promise<{ history: ISubscription[]; total: number }> {
    if (!userId) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
    }
    const limit = 8;
    const skip = (page - 1) * limit;
    const history = await this.subscriptionRepo.findAll(
      { userId: userId },
      { sort: { takenAt: -1 }, skip, limit },
    );
    const total = await this.subscriptionRepo.countDocuments({ userId });
    return { history, total };
  }

  async logout(refreshToken: string, accessToken: string): Promise<void> {
    const refreshEXP = (getRefreshTokenMaxAge() / 1000) | 0;
    const accessEXP = (getAccessTokenMaxAge() / 1000) | 0;
    await setToRedis(refreshToken, 'Blacklisted', refreshEXP);
    await setToRedis(accessToken, 'BlackListed', accessEXP);
  }
}
