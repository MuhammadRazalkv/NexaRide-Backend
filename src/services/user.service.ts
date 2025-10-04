import OTPRepo from '../repositories/otp.repo';
import crypto from 'crypto';
import { html, resetLinkBtn } from '../constants/OTP';
import { hashPassword, comparePassword } from '../utils/passwordManager';

import {
  generateAccessToken,
  generateRefreshToken,
  forgotPasswordToken,
  verifyRefreshToken,
  verifyForgotPasswordToken,
  generateBothTokens,
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
import { getFromRedis, setToRedis } from '../config/redis';
import { getAccessTokenMaxAge, getRefreshTokenMaxAge } from '../utils/env';
import { UserSchemaDTO } from '../dtos/request/auth.req.dto';
import { LoginResDTO } from '../dtos/response/auth.res.dto';
import { UserResDTO } from '../dtos/response/user.dto';
import { UserMapper } from '../mappers/user.mapper';
import { SubscriptionResDTO } from '../dtos/response/subscription.res.dto';
import { PremiumUser } from '../mappers/premium.mapper';

export class UserService implements IUserService {
  constructor(
    private _userRepo: IUserRepo,
    private _subscriptionRepo: ISubscriptionRepo,
  ) {}

  async emailVerification(email: string): Promise<void> {
    const existingUser = await this._userRepo.findOne({ email });
    if (existingUser) throw new AppError(HttpStatus.CONFLICT, messages.EMAIL_ALREADY_EXISTS);
    const OTP = crypto.randomInt(1000, 10000).toString();
    OTPRepo.setOTP(email, OTP);
    OTPRepo.sendOTP(email, 'Your NexaRide OTP', html(OTP)).catch(console.error);
  }

  async verifyOTP(email: string, otp: string): Promise<void> {
    const SOTP = await OTPRepo.getOTP(email);

    if (!SOTP || otp !== SOTP) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.INVALID_OTP);
    }

    OTPRepo.markEmailVerified(email);
    OTPRepo.deleteOTP(email);
  }

  async reSendOTP(email: string): Promise<void> {
    const existingUser = await this._userRepo.findOne({ email });
    if (existingUser) throw new AppError(HttpStatus.CONFLICT, messages.EMAIL_ALREADY_EXISTS);
    const OTP = crypto.randomInt(1000, 10000).toString();
    OTPRepo.setOTP(email, OTP);
    OTPRepo.sendOTP(email, 'Your new  NexaRide OTP', html(OTP)).catch(console.error);
  }

  async addInfo(data: UserSchemaDTO): Promise<LoginResDTO> {
    if (!(await OTPRepo.isEmailVerified(data.email))) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.EMAIL_NOT_VERIFIED);
    }

    // Ensure password exists and hash it
    if (!data.password) throw new AppError(HttpStatus.BAD_REQUEST, messages.PASSWORD_NOT_FOUND);
    data.password = await hashPassword(data.password);

    // Register user
    try {
      const newUser = await this._userRepo.create(data);
      await OTPRepo.deleteVerifiedEmail(data.email);

      // Generate tokens
      return {
        ...generateBothTokens(newUser._id as string, 'user'),
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

  async login(email: string, password: string): Promise<LoginResDTO> {
    // Check if user exists
    const user = await this._userRepo.findOne({ email });
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
      ...generateBothTokens(user._id as string, 'user'),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        profilePic: user.profilePic,
      },
    };
  }

  async googleLogin(email: string, googleId: string, name: string): Promise<LoginResDTO> {
    if (!googleId) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
    }

    const user = await this._userRepo.findOne({ email });

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
        const newUser = await this._userRepo.create(userData);
        return {
          ...generateBothTokens(newUser.id, 'user'),
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
      await this._userRepo.updateById(user.id, { $set: { googleId } });
    }

    const activeUser = await getFromRedis(`RU:${user.id}`);

    if (activeUser) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        'User is already logged in from another device or session.',
      );
    }

    return {
      ...generateBothTokens(user.id, 'user'),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        profilePic: user.profilePic,
      },
    };
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this._userRepo.findOne({ email });
    if (!user) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.USER_NOT_FOUND);
    }

    const token = forgotPasswordToken(user.id, user.email);
    const resetUrl = `${process.env.FRONT_END_URL}/user/reset-password?id=${user._id}&token=${token}`;

    await sendEmail(user.email, 'Password Reset Request - Action Required', resetLinkBtn(resetUrl));
  }

  async resetPassword(id: string, token: string, password: string): Promise<void> {
    if (!id || !token) {
      throw new AppError(HttpStatus.BAD_GATEWAY, messages.MISSING_FIELDS);
    }
    if (!password) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.PASSWORD_NOT_FOUND);
    }
    const user = await this._userRepo.findById(id);
    if (!user) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.USER_NOT_FOUND);
    }

    const verify = verifyForgotPasswordToken(token);
    if (!verify) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.INVALID_TOKEN);
    }

    const encryptedPassword = await hashPassword(password);
    await this._userRepo.updateById(id, {
      $set: { password: encryptedPassword },
    });
  }

  async getUserInfo(id: string): Promise<UserResDTO | null> {
    if (!id) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
    }
    const user = await this._userRepo.findById(id);
    if (!user) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.USER_NOT_FOUND);
    }
    return UserMapper.toUser(user);
  }

  async refreshToken(token: string): Promise<{
    newAccessToken: string;
    newRefreshToken: string;
  }> {
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

  async updateUserName(id: string, name: string): Promise<string | undefined> {
    const res = await this._userRepo.updateById(id, { $set: { name } });
    return res?.name;
  }

  async updateUserPhone(id: string, phone: number): Promise<number | undefined> {
    try {
      const res = await this._userRepo.updateById(id, { $set: { phone } });
      return res?.phone;
    } catch (error: any) {
      if (error instanceof mongoose.Error.CastError) {
        throw new AppError(HttpStatus.BAD_REQUEST, messages.INVALID_ID);
      }

      if (error.code === 11000) {
        throw new AppError(HttpStatus.CONFLICT, `Phone already exists`);
      }

      throw new AppError(HttpStatus.INTERNAL_SERVER_ERROR, messages.DATABASE_OPERATION_FAILED);
    }
  }

  async updateUserPfp(id: string, image: string): Promise<string | undefined> {
    if (!id || !image) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
    }

    const res = await cloudinary.uploader.upload(image, {
      folder: '/UserProfilePic',
      // type: "authenticated",
    });
    const user = await this._userRepo.updateById(id, {
      $set: { profilePic: res.secure_url },
    });
    // const user = await this._userRepo.updatePfp(id, res.public_id);
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
    const user = await this._userRepo.findById(userId);
    if (!user) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.USER_NOT_FOUND);
    }

    const subInfo = await this._subscriptionRepo.findOne({
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
  ): Promise<{ history: SubscriptionResDTO[]; total: number }> {
    if (!userId) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
    }
    const limit = 8;
    const skip = (page - 1) * limit;
    const history = await this._subscriptionRepo.findAll(
      { userId: userId },
      { sort: { takenAt: -1 }, skip, limit },
    );
    const total = await this._subscriptionRepo.countDocuments({ userId });
    return { history: PremiumUser.toSubscriptionList(history), total };
  }

  async logout(refreshToken: string, accessToken: string): Promise<void> {
    const refreshEXP = (getRefreshTokenMaxAge() / 1000) | 0;
    const accessEXP = (getAccessTokenMaxAge() / 1000) | 0;
    await setToRedis(refreshToken, 'Blacklisted', refreshEXP);
    await setToRedis(accessToken, 'BlackListed', accessEXP);
  }
}
