import { IDrivers } from "../models/DriverModel";
import { IVehicle } from "../models/VehicleModel";
import driverRepo from "../repositories/driverRepo";
import OTPRepo from "../repositories/OTPRepo";
import vehicleRepo from "../repositories/vehicleRepo";
import { html } from "../constants/OTP";
import crypto from "crypto";
import { z } from "zod";
import { hashPassword } from "../utils/passwordManager";
import {
  generateAccessToken,
  generateRefreshToken,
  forgotPasswordToken,
  verifyForgotPasswordToken,
} from "../utils/jwt";
import { comparePassword } from "../utils/passwordManager";
import sendEmail from "../utils/mailSender";
import { resetLinkBtn } from "../constants/OTP";

import mongoose from "mongoose";

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
  accessToken: generateAccessToken(driverId),
  refreshToken: generateRefreshToken(driverId),
});

class DriverService {
  async emailVerification(email: string) {
    if (!email) throw new Error("Email not found");
    const existingDriver = await driverRepo.findDriverByEmail(email);
    if (existingDriver) throw new Error("Driver already exists");

    const OTP = crypto.randomInt(1000, 10000).toString();
    console.log("OTP", OTP);
    OTPRepo.setOTP(email, OTP);
    OTPRepo.sendOTP(email, "Your NexaRide OTP", html(OTP)).catch((error) => {
      throw new Error(error);
    });
  }

  async verifyOTP(email: string, otp: string) {
    if (!email || !otp) {
      throw new Error("Email or  OTP is missing");
    }
    const SOTP = await OTPRepo.getOTP(email);

    if (!SOTP || otp !== SOTP) {
      throw new Error("Invalid or expired OTP");
    }

    OTPRepo.markEmailVerified(email);
    OTPRepo.deleteOTP(email);
  }

  async reSendOTP(email: string) {
    if (!email) {
      throw new Error("Email is missing");
    }
    if (!email) throw new Error("Email not found");
    const existingUser = await driverRepo.findDriverByEmail(email);
    if (existingUser) throw new Error("User already exists");

    const OTP = crypto.randomInt(1000, 10000).toString();
    console.log("resend - OTP", OTP);
    OTPRepo.setOTP(email, OTP);
    OTPRepo.sendOTP(email, "Your new  NexaRide OTP", html(OTP)).catch(
      console.error
    );
  }

  async addInfo(data: IDrivers) {
    if (!data) {
      throw new Error("Data is missing");
    }

    const parsedData = driverSchema.safeParse(data);
    if (!parsedData.success) {
      console.error("Zod validation error:", parsedData.error.format());

      // Extracting error messages correctly
      const errorMessages = Object.values(
        parsedData.error.flatten().fieldErrors
      )
        .flat()
        .join(", ");
      console.log("The error message should be this ", errorMessages);

      throw new Error("Invalid input: " + errorMessages);
    }
    if (!parsedData.data.email) {
      throw new Error("Email is required");
    }

    if (!(await OTPRepo.isEmailVerified(parsedData.data.email))) {
      throw new Error("Email is not verified");
    }

    if (!parsedData.data.password) throw new Error("Password is required");
    parsedData.data.password = await hashPassword(parsedData.data.password);

    const randomLocations:[number,number][] = [
      [77.5946, 12.9716], 
      [77.6074, 12.9746],
      [77.5670, 12.9776], 
      [77.5806, 12.9351], 
      [77.6484, 12.9784], 
      [77.7025, 12.9608], 
      [77.6143, 12.9260], 
      [77.5671, 12.9985], 
      [77.5625, 12.9242], 
      [77.7135, 12.8951], 
  ];
  
  
  const randomCoordinate:[number,number] = randomLocations[Math.floor(Math.random() * randomLocations.length)];


    const { state, city, street, pin_code, ...rest } = parsedData.data;
    const updatedData = {
      ...rest,
      address: { state, city, street, pin_code },
      location:{type:'Point',coordinates:randomCoordinate}
    };

    const newDriver = await driverRepo.createDriver(updatedData);
    await OTPRepo.deleteVerifiedEmail(parsedData.data.email);

    return { driverId: newDriver._id };
  }

  async login(driverData: IDrivers) {
    try {
      if (!driverData.email || !driverData.password) {
        throw new Error("Fields are missing");
      }

      // Check if user exists
      const driver = await driverRepo.findDriverByEmail(driverData.email);
      if (!driver) {
        throw new Error("Driver not found");
      }
      if (driver.isBlocked) {
        throw new Error(
          "Your account access has been restricted. Please contact support for assistance"
        );
      }

      // Verify password
      if (!driver.password) {
        throw new Error(
          "This account was registered using Google. Please log in with Google."
        );
      }

      const success = await comparePassword(
        driverData.password,
        driver.password
      );
      console.log("success ", success);

      // const success = driver.password == driverData.password
      if (!success) {
        throw new Error("Invalid email or password");
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
    } catch (error: unknown) {
      console.error("Error in DriverService -> login:", error);
      if (error instanceof Error) throw error;
      throw new Error("Internal server error");
    }
  }

  async getStatus(driverId: string) {
    try {
      const id = new mongoose.Types.ObjectId(driverId);
      const driver = await driverRepo.findDriverById(id);
      if (!driver) throw new Error("Driver not found");

      const vehicleId = driver.vehicleId ? driver.vehicleId.toString() : "";
      const vehicle = await vehicleRepo.findVehicleById(vehicleId);
      if (!vehicle) {
        throw new Error("Vehicle not found");
      }

      return {
        driverStatus: driver.status,
        vehicleStatus: vehicle?.status,
        isAvailable: driver.isAvailable,
      };
    } catch (error) {
      console.error("Error in DriverService -> getStatus:", error);
      if (error instanceof Error) throw error;
      throw new Error("Internal server error");
    }
  }

  async rejectReason(driverId: string) {
    try {
      const id = new mongoose.Types.ObjectId(driverId);
      const driver = await driverRepo.findDriverById(id);

      if (!driver) {
        throw new Error("Driver not found. Please ensure you have registered.");
      }

      if (driver.status !== "rejected") {
        throw new Error(
          "There seems to be an issue with your application status. Please log in again to check your current status."
        );
      }

      const reason = driver.rejectionReason;

      return {
        reason,
      };
    } catch (error) {
      console.error("Error in DriverService -> rejectReason:", error);
      if (error instanceof Error) throw error;
      throw new Error("Internal server error");
    }
  }

  async reApplyDriver(id: string, data: IDrivers) {
    if (!data) {
      throw new Error("Data is missing");
    }
    if (!id) {
      throw new Error("Id is missing");
    }

    const parsedData = driverReApplySchema.safeParse(data);
    if (!parsedData.success) {
      console.error("Zod validation error:", parsedData.error.format());

      // Extracting error messages correctly
      const errorMessages = Object.values(
        parsedData.error.flatten().fieldErrors
      )
        .flat()
        .join(", ");
      console.log("The error message should be this ", errorMessages);

      throw new Error("Invalid input: " + errorMessages);
    }

    if (!parsedData.data.password) throw new Error("Password is required");
    parsedData.data.password = await hashPassword(parsedData.data.password);

    const updatedData = await driverRepo.findByIdAndUpdate(id, parsedData.data);

    return { updatedData };
  }

  async checkGoogleAuth(id: string, email: string) {
    const existingDriver = await driverRepo.findDriverByEmail(email);

    if (existingDriver) {
      if (!existingDriver.googleId) {
        await driverRepo.setGoogleId(id, email);
      }

      const message = "Driver already exists , please log in instead";
      return message;
    }
    OTPRepo.markEmailVerified(email);
  }

  async googleLogin(googleId: string, email: string, profilePic?: string) {
    try {
      if (!email || !googleId) {
        throw new Error("Credentials missing");
      }

      const driver = await driverRepo.findDriverByEmail(email);

      if (!driver) {
        throw new Error("Driver not found .");
      }

      if (driver?.isBlocked) {
        throw new Error(
          "Your account access has been restricted. Please contact support for assistance"
        );
      }

      if (!driver.profilePic && profilePic) {
        await driverRepo.setPFP(driver.id, profilePic);
      }

      // If user exists, only update googleId if it's missing
      if (!driver.googleId) {
        await driverRepo.setGoogleId(googleId, email);
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
    } catch (error: unknown) {
      if (error instanceof Error) throw error;
      throw new Error("Internal server error");
    }
  }

  async requestPasswordReset(email: string) {
    try {
      if (!email) {
        throw new Error("Email not found");
      }
      const driver = await driverRepo.findDriverByEmail(email);
      if (!driver) {
        throw new Error("Driver not found ");
      }

      const token = await forgotPasswordToken(driver.id, driver.email);
      const resetUrl = `http://localhost:5173/driver/reset-password?id=${driver._id}&token=${token}`;

      await sendEmail(
        driver.email,
        "Password Reset Request - Action Required",
        resetLinkBtn(resetUrl)
      );
      console.log("Email has been sent ");
    } catch (error: unknown) {
      if (error instanceof Error) throw error;
      throw new Error("Internal server error");
    }
  }

  async resetPassword(id: string, token: string, password: string) {
    try {
      if (!id || !token) {
        throw new Error("Credentials missing");
      }
      if (!password) {
        throw new Error("Password is missing");
      }
      const user = await driverRepo.findDriverById(id);
      if (!user) {
        throw new Error("Driver not exists!");
      }

      const verify = verifyForgotPasswordToken(token);
      if (!verify) {
        throw new Error("Token is invalid or expired.");
      }

      const encryptedPassword = await hashPassword(password);
      await driverRepo.changePassword(id, encryptedPassword);
    } catch (error) {
      if (error instanceof Error) throw error;
      throw new Error("Internal server error");
    }
  }

  async getDriverInfo(id: string) {
    const driver = await driverRepo.findDriverById(id);
    if (!driver) {
      throw new Error("Driver not found");
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

  async updateDriverInfo(id: string, field: keyof IDrivers, value: string) {
    if (!id || !field || !value) {
      throw new Error("Credentials missing ");
    }
    const response = await driverRepo.findAndUpdate(id, field, value);
    if (!response) {
      throw new Error("Driver not found ");
    }
    return response[field];
  }

  async toggleAvailability(id: string) {
    const driver = await driverRepo.findDriverById(id);
    if (!driver) {
      throw new Error("Driver not found");
    }
    const type = driver.isAvailable == 'online' ? 'offline' : 'online'
    const updatedDriver = await driverRepo.toggleAvailability(
      id,
      type
    );
    return updatedDriver?.isAvailable;
  }

  async statusOnRide(id: string) {
    const driver = await driverRepo.findDriverById(id);
    if (!driver) {
      throw new Error("Driver not found");
    }
    await driverRepo.goOnRide(id)
  }

  async getCurrentLocation(id:string){
    const driver = await driverRepo.findDriverById(id)
    if (!driver) {
      throw new Error('Driver not found')
    }
    return driver.location.coordinates
  }
}

export default new DriverService();
