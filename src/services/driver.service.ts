import { IDriverService } from './interfaces/driver.service.interface';
import OTPRepo from '../repositories/otp.repo';
import { html } from '../constants/OTP';
import crypto from 'crypto';
import { hashPassword } from '../utils/passwordManager';
import {
  generateAccessToken,
  generateRefreshToken,
  forgotPasswordToken,
  verifyForgotPasswordToken,
  verifyRefreshToken,
  generateBothTokens,
} from '../utils/jwt';
import { comparePassword } from '../utils/passwordManager';
import sendEmail from '../utils/mailSender';
import { resetLinkBtn } from '../constants/OTP';
import mongoose from 'mongoose';
import { IDriverRepo } from '../repositories/interfaces/driver.repo.interface';
import { IVehicleRepo } from '../repositories/interfaces/vehicle.repo.interface';
import { AppError } from '../utils/appError';
import { HttpStatus } from '../constants/httpStatusCodes';
import { messages } from '../constants/httpMessages';
import cloudinary from '../utils/cloudinary';
import { getDriverInfoRedis, getFromRedis, setToRedis, updateDriverFelids } from '../config/redis';
import { getAccessTokenMaxAge, getRefreshTokenMaxAge } from '../utils/env';
import { DriverSchemaDTO, LoginDTO } from '../dtos/request/auth.req.dto';
import { LoginResDTO } from '../dtos/response/auth.res.dto';
import { DriverMapper } from '../mappers/driver.mapper';
import { DriverResDTO } from '../dtos/response/driver.res.dto';

export class DriverService implements IDriverService {
  constructor(
    private _driverRepo: IDriverRepo,
    private _vehicleRepo: IVehicleRepo,
  ) {}

  async emailVerification(email: string): Promise<void> {
    const existingDriver = await this._driverRepo.findOne({ email });
    if (existingDriver) throw new AppError(HttpStatus.CONFLICT, messages.EMAIL_ALREADY_EXISTS);

    const OTP = crypto.randomInt(1000, 10000).toString();
    console.log('OTP', OTP);
    OTPRepo.setOTP(email, OTP);
    OTPRepo.sendOTP(email, 'Your NexaRide OTP', html(OTP)).catch((error) => {
      throw new AppError(HttpStatus.BAD_GATEWAY, error.message);
    });
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
    const existingUser = await this._driverRepo.findOne({ email });
    if (existingUser) throw new AppError(HttpStatus.BAD_REQUEST, messages.EMAIL_ALREADY_EXISTS);

    const OTP = crypto.randomInt(1000, 10000).toString();
    console.log('resend - OTP', OTP);
    OTPRepo.setOTP(email, OTP);
    OTPRepo.sendOTP(email, 'Your new  NexaRide OTP', html(OTP)).catch((error) => {
      throw new AppError(HttpStatus.BAD_GATEWAY, error.message);
    });
  }

  async addInfo(data: DriverSchemaDTO): Promise<{ driverId: string }> {
    if (!(await OTPRepo.isEmailVerified(data.email))) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.EMAIL_NOT_VERIFIED);
    }

    if (!data.password) throw new AppError(HttpStatus.BAD_REQUEST, messages.PASSWORD_NOT_FOUND);
    data.password = await hashPassword(data.password);

    const randomLocations: [number, number][] = [
      [77.5946, 12.9716],
      [77.6074, 12.9746],
      [77.567, 12.9776],
      [77.5806, 12.9351],
      [77.6484, 12.9784],
      [77.7025, 12.9608],
      [77.6143, 12.926],
      [77.5671, 12.9985],
      [77.5625, 12.9242],
      [77.7135, 12.8951],
    ];

    const randomCoordinate: [number, number] =
      randomLocations[Math.floor(Math.random() * randomLocations.length)];

    const { state, city, street, pin_code, ...rest } = data;
    const updatedData = {
      ...rest,
      address: { state, city, street, pin_code },
      location: { type: 'Point', coordinates: randomCoordinate },
    };
    try {
      const newDriver = await this._driverRepo.create(updatedData);
      await OTPRepo.deleteVerifiedEmail(data.email);

      return { driverId: newDriver._id as string };
    } catch (error: any) {
      if (error instanceof mongoose.Error.CastError) {
        throw new AppError(HttpStatus.BAD_REQUEST, messages.INVALID_ID);
      }

      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];

        throw new AppError(
          HttpStatus.CONFLICT,
          `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`,
        );
      }

      throw new AppError(HttpStatus.INTERNAL_SERVER_ERROR, messages.DATABASE_OPERATION_FAILED);
    }
  }

  async login(driverData: LoginDTO): Promise<LoginResDTO> {
    // Check if user exists
    const driver = await this._driverRepo.findOne({ email: driverData.email });
    if (!driver) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.INVALID_CREDENTIALS);
    }
    if (driver.isBlocked) {
      throw new AppError(HttpStatus.FORBIDDEN, messages.ACCOUNT_BLOCKED);
    }

    // Verify password
    if (!driver.password) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.GOOGLE_REGISTERED_ACCOUNT);
    }

    const success = await comparePassword(driverData.password, driver.password);

    // const success = driver.password == driverData.password
    if (!success) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.INVALID_CREDENTIALS);
    }

    const activeUser = await getFromRedis(`OD:${driver.id}`);

    if (activeUser) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        'Driver is already logged in from another device or session.',
      );
    }

    // Generate tokens
    return {
      ...generateBothTokens(driver.id, 'driver'),
      user: {
        _id: driver._id,
        name: driver.name,
        email: driver.email,
      },
    };
  }

  async getStatus(driverId: string): Promise<{ driverStatus: string; vehicleStatus: string }> {
    const driver = await this._driverRepo.findById(driverId);
    if (!driver || !driver.status)
      throw new AppError(HttpStatus.NOT_FOUND, messages.DRIVER_NOT_FOUND);

    const vehicleId = driver.vehicleId ? driver.vehicleId.toString() : '';
    const vehicle = await this._vehicleRepo.findById(vehicleId);
    if (!vehicle || !vehicle.status) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.VEHICLE_NOT_FOUND);
    }

    return {
      driverStatus: driver.status,
      vehicleStatus: vehicle?.status,
    };
  }

  async rejectReason(driverId: string): Promise<string | undefined> {
    const driver = await this._driverRepo.findById(driverId);

    if (!driver) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.DRIVER_NOT_FOUND);
    }

    if (driver.status !== 'rejected') {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.DRIVER_NOT_REJECTED);
    }

    const reason = driver.rejectionReason;

    return reason;
  }

  async reApplyDriver(id: string, data: DriverSchemaDTO): Promise<DriverResDTO> {
    try {
      if (!data.password) throw new AppError(HttpStatus.BAD_REQUEST, messages.PASSWORD_NOT_FOUND);
      data.password = await hashPassword(data.password);

      const updatedData = await this._driverRepo.updateById(id, {
        $set: { ...data, status: 'pending' },
      });
      if (!updatedData) {
        throw new AppError(HttpStatus.NOT_FOUND, messages.DRIVER_NOT_FOUND);
      }
      return DriverMapper.toDriver(updatedData);
    } catch (error: any) {
      if (error instanceof mongoose.Error.CastError) {
        throw new AppError(HttpStatus.BAD_REQUEST, messages.INVALID_ID);
      }

      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];

        throw new AppError(
          HttpStatus.CONFLICT,
          `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`,
        );
      }

      throw new AppError(HttpStatus.INTERNAL_SERVER_ERROR, messages.DATABASE_OPERATION_FAILED);
    }
  }

  async checkGoogleAuth(id: string, email: string): Promise<string> {
    const existingDriver = await this._driverRepo.findOne({ email });

    if (existingDriver) {
      if (!existingDriver.googleId) {
        await this._driverRepo.updateById(existingDriver.id, {
          $set: { googleId: id },
        });
      }

      return 'Driver already exists , please log in instead';
    } else {
      OTPRepo.markEmailVerified(email);
      throw new AppError(HttpStatus.BAD_REQUEST, messages.DRIVER_NOT_FOUND);
    }
  }

  async googleLogin(googleId: string, email: string, profilePic?: string): Promise<LoginResDTO> {
    const driver = await this._driverRepo.findOne({ email });

    if (!driver) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.DRIVER_NOT_FOUND);
    }

    if (driver?.isBlocked) {
      throw new AppError(HttpStatus.FORBIDDEN, messages.ACCOUNT_BLOCKED);
    }

    if (!driver.profilePic && profilePic) {
      await this._driverRepo.updateById(driver.id, { $set: { profilePic } });
    }

    // If user exists, only update googleId if it's missing
    if (!driver.googleId) {
      await this._driverRepo.updateOne({ email }, { $set: { googleId } });
    }

    const activeUser = await getFromRedis(`OD:${driver.id}`);

    if (activeUser) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        'Driver is already logged in from another device or session.',
      );
    }

    return {
      ...generateBothTokens(driver.id, 'driver'),
      user: {
        _id: driver._id,
        name: driver.name,
        email: driver.email,
        profilePic: driver?.profilePic,
      },
    };
  }

  async requestPasswordReset(email: string): Promise<void> {
    const driver = await this._driverRepo.findOne({ email });
    if (!driver) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.DRIVER_NOT_FOUND);
    }

    const token = forgotPasswordToken(driver.id, driver.email);
    const resetUrl = `${process.env.FRONT_END_URL}/driver/reset-password?id=${driver._id}&token=${token}`;

    await sendEmail(
      driver.email,
      'Password Reset Request - Action Required',
      resetLinkBtn(resetUrl),
    );
  }

  async resetPassword(id: string, token: string, password: string): Promise<void> {
    const user = await this._driverRepo.findById(id);
    if (!user) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.DRIVER_NOT_FOUND);
    }

    const verify = verifyForgotPasswordToken(token);
    if (!verify) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.INVALID_TOKEN);
    }

    const encryptedPassword = await hashPassword(password);
    await this._driverRepo.updateById(id, {
      $set: { password: encryptedPassword },
    });
  }

  async getDriverInfo(id: string): Promise<DriverResDTO> {
    const driver = await this._driverRepo.findById(id);
    if (!driver) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.DRIVER_NOT_FOUND);
    }
    return DriverMapper.toDriver(driver);
  }

  async updateDriverInfo(
    id: string,
    field: keyof DriverSchemaDTO | string,
    value: string,
  ): Promise<string> {
    const addressFields = ['street', 'city', 'state', 'pin_code'];
    if (addressFields.includes(field)) {
      field = `address.${field}`;
    }

    const response = await this._driverRepo.updateById(id, {
      $set: { [field]: value, status: 'pending' },
    });
    if (!response) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.DRIVER_NOT_FOUND);
    }

    //  get the nested value
    const updatedValue = field.split('.').reduce((acc: any, key) => acc?.[key], response);

    return updatedValue;
  }

  async toggleAvailability(id: string): Promise<void> {
    const driver = await this._driverRepo.findById(id);
    if (!driver) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.DRIVER_NOT_FOUND);
    }
    const driverInfo = await getDriverInfoRedis(`driver:${id}`);

    if (!driverInfo) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.DRIVER_NOT_FOUND);
    }
    const newDriverStatus = driverInfo.status == 'online' ? 'offline' : 'online';
    await updateDriverFelids(`driver:${id}`, 'status', newDriverStatus);
  }

  async getCurrentLocation(id: string): Promise<[number, number]> {
    const driver = await this._driverRepo.findById(id);
    if (!driver) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.DRIVER_NOT_FOUND);
    }
    return driver.location.coordinates;
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

    const newAccessToken = generateAccessToken(refresh.id, 'driver');
    const newRefreshToken = generateRefreshToken(refresh.id, 'driver');

    return { newAccessToken, newRefreshToken };
  }

  async updateProfilePic(id: string, image: string) {
    if (!id || !image) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
    }

    const res = await cloudinary.uploader.upload(image, {
      folder: '/DriverProfilePic',
    });
    const driver = await this._driverRepo.updateById(id, {
      $set: { profilePic: res.secure_url },
    });
    return driver?.profilePic;
  }

  async getPriceByCategory(category: string): Promise<number> {
    if (!category) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
    }

    const updatedCategory = category.charAt(0).toUpperCase() + category.slice(1);
    const vehicleCategory = await this._driverRepo.getPriceByCategory(updatedCategory);

    return vehicleCategory.farePerKm;
  }

  async logout(refreshToken: string, accessToken: string): Promise<void> {
    const refreshEXP = (getRefreshTokenMaxAge() / 1000) | 0;
    const accessEXP = (getAccessTokenMaxAge() / 1000) | 0;
    await setToRedis(refreshToken, 'Blacklisted', refreshEXP);
    await setToRedis(accessToken, 'BlackListed', accessEXP);
  }
}
