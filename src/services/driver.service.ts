import { IDrivers } from "../models/driver.model";
import {
  IDriverService,
  IDriverWithVehicle,
} from "./interfaces/driver.service.interface";
import OTPRepo from "../repositories/otp.repo";

import { html } from "../constants/OTP";
import crypto from "crypto";
import { z } from "zod";
import { hashPassword } from "../utils/passwordManager";
import {
  generateAccessToken,
  generateRefreshToken,
  forgotPasswordToken,
  verifyForgotPasswordToken,
  verifyRefreshToken,
} from "../utils/jwt";
import { comparePassword } from "../utils/passwordManager";
import sendEmail from "../utils/mailSender";
import { resetLinkBtn } from "../constants/OTP";

import mongoose from "mongoose";

import { IDriverRepo } from "../repositories/interfaces/driver.repo.interface";

import { IVehicleRepo } from "../repositories/interfaces/vehicle.repo.interface";
import { AppError } from "../utils/appError";
import { HttpStatus } from "../constants/httpStatusCodes";
import { messages } from "../constants/httpMessages";
import cloudinary from "../utils/cloudinary";
import {
  getDriverInfoRedis,
  getFromRedis,
  updateDriverFelids,
} from "../config/redis";

const driverSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  email: z.string().email("Invalid email format"),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Phone must be a valid 10-digit Indian number"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  profilePic: z.string().optional(),
  googleId: z.string().optional(),
  state: z.string(),
  // License number: at least 6 characters, allows alphanumeric
  license_number: z
    .string()
    .min(6, "License number must be at least 6 characters")
    .regex(
      /^[A-Z]{2}\d{2} \d{4} \d{7}$/,
      "License number must contain only uppercase letters and digits"
    ),

  // License expiration: Convert string to Date before validating
  license_exp: z.preprocess(
    (arg) => (typeof arg === "string" ? new Date(arg) : arg),
    z.date().min(new Date(), "License expiration date must be in the future")
  ),

  street: z.string().min(3, "Street must be at least 3 characters"),
  city: z.string().min(2, "City must be at least 2 characters"),

  // Postal Code: Must be exactly 6 digits
  pin_code: z
    .string()
    .length(6, "Postal code must be exactly 6 digits")
    .regex(/^\d{6}$/, "Postal code must be only digits"),

  // Date of Birth: Convert string to Date, validate age
  dob: z.preprocess(
    (arg) => (typeof arg === "string" ? new Date(arg) : arg),
    z
      .date()
      .max(new Date(), "Date of Birth cannot be in the future")
      .refine(
        (value) => {
          const today = new Date();
          const minAge = new Date(
            today.getFullYear() - 18,
            today.getMonth(),
            today.getDate()
          );
          return value <= minAge;
        },
        { message: "You must be at least 18 years old" }
      )
      .refine(
        (value) => {
          const today = new Date();
          const maxAge = new Date(
            today.getFullYear() - 100,
            today.getMonth(),
            today.getDate()
          );
          return value >= maxAge;
        },
        { message: "Age cannot exceed 100 years" }
      )
  ),
});

const driverReApplySchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Phone must be a valid 10-digit Indian number"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  profilePic: z.string().optional(),
  state: z.string(),
  // License number: at least 6 characters, allows alphanumeric
  license_number: z
    .string()
    .min(6, "License number must be at least 6 characters")
    .regex(
      /^[A-Z]{2}\d{2} \d{4} \d{7}$/,
      "License number must contain only uppercase letters and digits"
    ),

  // License expiration: Convert string to Date before validating
  license_exp: z.preprocess(
    (arg) => (typeof arg === "string" ? new Date(arg) : arg),
    z.date().min(new Date(), "License expiration date must be in the future")
  ),

  street: z.string().min(3, "Street must be at least 3 characters"),
  city: z.string().min(2, "City must be at least 2 characters"),

  // Postal Code: Must be exactly 6 digits
  pin_code: z
    .string()
    .length(6, "Postal code must be exactly 6 digits")
    .regex(/^\d{6}$/, "Postal code must be only digits"),

  // Date of Birth: Convert string to Date, validate age
  dob: z.preprocess(
    (arg) => (typeof arg === "string" ? new Date(arg) : arg),
    z
      .date()
      .max(new Date(), "Date of Birth cannot be in the future")
      .refine(
        (value) => {
          const today = new Date();
          const minAge = new Date(
            today.getFullYear() - 18,
            today.getMonth(),
            today.getDate()
          );
          return value <= minAge;
        },
        { message: "You must be at least 18 years old" }
      )
      .refine(
        (value) => {
          const today = new Date();
          const maxAge = new Date(
            today.getFullYear() - 100,
            today.getMonth(),
            today.getDate()
          );
          return value >= maxAge;
        },
        { message: "Age cannot exceed 100 years" }
      )
  ),
});

const generateTokens = (driverId: string) => ({
  accessToken: generateAccessToken(driverId, "driver"),
  refreshToken: generateRefreshToken(driverId, "driver"),
});

export class DriverService implements IDriverService {
  constructor(
    private driverRepo: IDriverRepo,
    private vehicleRepo: IVehicleRepo
  ) {}

  async emailVerification(email: string) {
    if (!email)
      throw new AppError(HttpStatus.BAD_REQUEST, messages.EMAIL_NOT_FOUND);
    const existingDriver = await this.driverRepo.findOne({ email });
    if (existingDriver)
      throw new AppError(HttpStatus.CONFLICT, messages.EMAIL_ALREADY_EXISTS);

    const OTP = crypto.randomInt(1000, 10000).toString();
    console.log("OTP", OTP);
    OTPRepo.setOTP(email, OTP);
    OTPRepo.sendOTP(email, "Your NexaRide OTP", html(OTP)).catch((error) => {
      throw new AppError(HttpStatus.BAD_GATEWAY, error.message);
    });
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

    const existingUser = await this.driverRepo.findOne({ email });
    if (existingUser)
      throw new AppError(HttpStatus.BAD_REQUEST, messages.EMAIL_ALREADY_EXISTS);

    const OTP = crypto.randomInt(1000, 10000).toString();
    console.log("resend - OTP", OTP);
    OTPRepo.setOTP(email, OTP);
    OTPRepo.sendOTP(email, "Your new  NexaRide OTP", html(OTP)).catch(
      (error) => {
        throw new AppError(HttpStatus.BAD_GATEWAY, error.message);
      }
    );
  }

  async addInfo(data: IDrivers) {
    if (!data) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
    }

    const parsedData = driverSchema.safeParse(data);
    if (!parsedData.success) {
      // Extracting error messages correctly
      const errorMessages = Object.values(
        parsedData.error.flatten().fieldErrors
      )
        .flat()
        .join(", ");

      throw new AppError(
        HttpStatus.BAD_REQUEST,
        messages.VALIDATION_ERROR + ":" + errorMessages
      );
    }
    if (!parsedData.data.email) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.EMAIL_NOT_FOUND);
    }

    if (!(await OTPRepo.isEmailVerified(parsedData.data.email))) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.EMAIL_NOT_VERIFIED);
    }

    if (!parsedData.data.password)
      throw new AppError(HttpStatus.BAD_REQUEST, messages.PASSWORD_NOT_FOUND);
    parsedData.data.password = await hashPassword(parsedData.data.password);

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

    const { state, city, street, pin_code, ...rest } = parsedData.data;
    const updatedData = {
      ...rest,
      address: { state, city, street, pin_code },
      location: { type: "Point", coordinates: randomCoordinate },
    };
    try {
      const newDriver = await this.driverRepo.create(updatedData);
      await OTPRepo.deleteVerifiedEmail(parsedData.data.email);

      return { driverId: newDriver._id as string };
    } catch (error: any) {
      if (error instanceof mongoose.Error.CastError) {
        throw new AppError(HttpStatus.BAD_REQUEST, messages.INVALID_ID);
      }

      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];

        throw new AppError(
          HttpStatus.CONFLICT,
          `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`
        );
      }

      throw new AppError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        messages.DATABASE_OPERATION_FAILED
      );
    }
  }

  async login(driverData: IDrivers) {
    if (!driverData.email || !driverData.password) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
    }

    // Check if user exists
    const driver = await this.driverRepo.findOne({ email: driverData.email });
    if (!driver) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.INVALID_CREDENTIALS);
    }
    if (driver.isBlocked) {
      throw new AppError(HttpStatus.FORBIDDEN, messages.ACCOUNT_BLOCKED);
    }

    // Verify password
    if (!driver.password) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        messages.GOOGLE_REGISTERED_ACCOUNT
      );
    }

    const success = await comparePassword(driverData.password, driver.password);

    // const success = driver.password == driverData.password
    if (!success) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.INVALID_CREDENTIALS);
    }

    // Generate tokens
    return {
      ...generateTokens(driver._id as string),
      driver: {
        _id: driver._id,
        name: driver.name,
        email: driver.email,
      },
    };
  }

  async getStatus(driverId: string) {
    // const id = new mongoose.Types.ObjectId(driverId);
    const driver = await this.driverRepo.findById(driverId);
    if (!driver)
      throw new AppError(HttpStatus.NOT_FOUND, messages.DRIVER_NOT_FOUND);

    const vehicleId = driver.vehicleId ? driver.vehicleId.toString() : "";
    const vehicle = await this.vehicleRepo.findById(vehicleId);
    if (!vehicle) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.VEHICLE_NOT_FOUND);
    }

    return {
      driverStatus: driver.status,
      vehicleStatus: vehicle?.status,
      // isAvailable: driver.isAvailable,
    };
  }

  async rejectReason(driverId: string) {
    const driver = await this.driverRepo.findById(driverId);

    if (!driver) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.DRIVER_NOT_FOUND);
    }

    if (driver.status !== "rejected") {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.DRIVER_NOT_REJECTED);
    }

    const reason = driver.rejectionReason;

    return reason;
  }

  async reApplyDriver(id: string, data: IDrivers) {
    if (!data) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
    }
    if (!id) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
    }

    const parsedData = driverReApplySchema.safeParse(data);
    if (!parsedData.success) {
      // Extracting error messages correctly
      const errorMessages = Object.values(
        parsedData.error.flatten().fieldErrors
      )
        .flat()
        .join(", ");

      throw new AppError(
        HttpStatus.BAD_REQUEST,
        messages.VALIDATION_ERROR + errorMessages
      );
    }

    if (!parsedData.data.password)
      throw new AppError(HttpStatus.BAD_REQUEST, messages.PASSWORD_NOT_FOUND);
    parsedData.data.password = await hashPassword(parsedData.data.password);

    const updatedData = await this.driverRepo.updateById(id, {
      $set: { ...parsedData.data, status: "pending" },
    });

    return updatedData;
  }

  async checkGoogleAuth(id: string, email: string) {
    const existingDriver = await this.driverRepo.findOne({ email });

    if (existingDriver) {
      if (!existingDriver.googleId) {
        await this.driverRepo.updateById(existingDriver.id, {
          $set: { googleId: id },
        });
      }

      const message = "Driver already exists , please log in instead";
      return message;
    }
    OTPRepo.markEmailVerified(email);
  }

  async googleLogin(googleId: string, email: string, profilePic?: string) {
    if (!email || !googleId) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
    }

    const driver = await this.driverRepo.findOne({ email });

    if (!driver) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.DRIVER_NOT_FOUND);
    }

    if (driver?.isBlocked) {
      throw new AppError(HttpStatus.FORBIDDEN, messages.ACCOUNT_BLOCKED);
    }

    if (!driver.profilePic && profilePic) {
      await this.driverRepo.updateById(driver.id, { $set: { profilePic } });
    }

    // If user exists, only update googleId if it's missing
    if (!driver.googleId) {
      await this.driverRepo.updateOne({ email }, { $set: { googleId } });
    }

    return {
      ...generateTokens(driver._id as string),
      driver: {
        _id: driver._id,
        name: driver.name,
        email: driver.email,
        profilePic: driver?.profilePic,
      },
    };
  }

  async requestPasswordReset(email: string) {
    if (!email) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.EMAIL_NOT_FOUND);
    }
    const driver = await this.driverRepo.findOne({ email });
    if (!driver) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.DRIVER_NOT_FOUND);
    }

    const token = forgotPasswordToken(driver.id, driver.email);
    const resetUrl = `${process.env.FRONT_END_URL}/driver/reset-password?id=${driver._id}&token=${token}`;

    await sendEmail(
      driver.email,
      "Password Reset Request - Action Required",
      resetLinkBtn(resetUrl)
    );
  }

  async resetPassword(id: string, token: string, password: string) {
    if (!id || !token) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
    }
    if (!password) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.PASSWORD_NOT_FOUND);
    }
    const user = await this.driverRepo.findById(id);
    if (!user) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.DRIVER_NOT_FOUND);
    }

    const verify = verifyForgotPasswordToken(token);
    if (!verify) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.INVALID_TOKEN);
    }

    const encryptedPassword = await hashPassword(password);
    await this.driverRepo.updateById(id, {
      $set: { password: encryptedPassword },
    });
  }

  async getDriverInfo(id: string) {
    const driver = await this.driverRepo.findById(id);
    if (!driver) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.DRIVER_NOT_FOUND);
    }
    return {
      name: driver.name,
      email: driver.email,
      phone: driver.phone,
      address: driver.address,
      dob: driver.dob,
      license_exp: driver.license_exp,
      profilePic: driver.profilePic,
      status: driver.status,
      licenseNumber: driver.license_number,
    };
  }

  async updateDriverInfo(
    id: string,
    field: keyof IDrivers | string,
    value: string
  ) {
    if (!id || !field || !value) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
    }

    // Handle nested address fields
    const addressFields = ["street", "city", "state", "pin_code"];
    if (addressFields.includes(field)) {
      field = `address.${field}`;
    }

    const response = await this.driverRepo.updateById(id, {
      $set: { [field]: value, status: "pending" },
    });
    if (!response) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.DRIVER_NOT_FOUND);
    }

    // Safely get the nested value
    const updatedValue = field
      .split(".")
      .reduce((acc: any, key) => acc?.[key], response);

    return updatedValue;
  }

  async toggleAvailability(id: string) {
    const driver = await this.driverRepo.findDriverById(id);
    if (!driver) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.DRIVER_NOT_FOUND);
    }
    const driverInfo = await getDriverInfoRedis(`driver:${id}`);

    if (!driverInfo) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.DRIVER_NOT_FOUND);
    }
    const newDriverStatus =
      driverInfo.status == "online" ? "offline" : "online";
    await updateDriverFelids(`driver:${id}`, "status", newDriverStatus);
  }

  async getCurrentLocation(id: string) {
    const driver = await this.driverRepo.findById(id);
    if (!driver) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.DRIVER_NOT_FOUND);
    }
    return driver.location.coordinates;
  }

  async refreshToken(token: string) {
    if (!token) {
      throw new AppError(HttpStatus.UNAUTHORIZED, messages.TOKEN_NOT_PROVIDED);
    }

    const refresh = verifyRefreshToken(token);
    if (!refresh) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.TOKEN_INVALID);
    }

    const newAccessToken = generateAccessToken(refresh.id, "driver");
    const newRefreshToken = generateRefreshToken(refresh.id, "driver");

    return { newAccessToken, newRefreshToken };
  }

  async updateProfilePic(id: string, image: string) {
    if (!id || !image) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
    }

    const res = await cloudinary.uploader.upload(image, {
      folder: "/DriverProfilePic",
    });
    const driver = await this.driverRepo.updateById(id, {
      $set: { profilePic: res.secure_url },
    });
    return driver?.profilePic;
  }

  async getPriceByCategory(category: string): Promise<number> {
    if (!category) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
    }

    const updatedCategory =
      category.charAt(0).toUpperCase() + category.slice(1);
    const vehicleCategory = await this.driverRepo.getPriceByCategory(
      updatedCategory
    );
    console.log("vehicle category info", vehicleCategory);

    return vehicleCategory.farePerKm;
  }
}
