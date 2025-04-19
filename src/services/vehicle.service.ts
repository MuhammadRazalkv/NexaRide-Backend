import { IVehicle } from "../models/vehicle.model";
import { INVALID, z } from "zod";
import cloudinary from "../utils/cloudinary";
import mongoose from "mongoose";

import { IVehicleService } from "./interfaces/vehicle.interface";
import { IVehicleRepo } from "../repositories/interfaces/vehicle.repo.interface";
import { IDriverRepo } from "../repositories/interfaces/driver.repo.interface";
import { AppError } from "../utils/appError";
import { HttpStatus } from "../constants/httpStatusCodes";
import { messages } from "../constants/httpMessages";
function validateLicensePlate(value: string): boolean {
  const licensePlateRegex =
    /^[A-Z]{2}[ -]?[0-9]{1,2}[ -]?[A-Z]{1,2}[ -]?[0-9]{1,4}$/;
  return licensePlateRegex.test(value);
}

const vehicleSchema = z.object({
  // driverId: z.string().refine((val) => {
  //   const hexRegex = /^[a-f\d]{24}$/i;
  //   return hexRegex.test(val);
  // }, "Invalid Driver ID"),

  nameOfOwner: z.string().min(1, "Name of owner is required").trim(),

  addressOfOwner: z.string().min(1, "Street address is required").trim(),

  brand: z.string().min(1, "Vehicle brand is required").trim(),

  vehicleModel: z.string().min(1, "Vehicle model is required").trim(),

  color: z.string().min(1, "Vehicle color is required").trim(),

  numberPlate: z
    .string()
    .min(1, "Number plate is required")
    .refine(validateLicensePlate, "Invalid Number Plate Format"),
  regDate: z.preprocess(
    (arg) => {
      if (typeof arg === "string") {
        // Convert string to Date
        const parsedDate = new Date(arg);
        return isNaN(parsedDate.getTime()) ? undefined : parsedDate; // Ensure valid date
      }
      return arg; // Assume it's already a Date or invalid
    },
    z
      .date()
      .refine(
        (date) => date <= new Date(),
        "Registration date cannot be in the future"
      )
  ),

  expDate: z.preprocess(
    (arg) => {
      if (typeof arg === "string") {
        // Convert string to Date
        const parsedDate = new Date(arg);
        return isNaN(parsedDate.getTime()) ? undefined : parsedDate; // Ensure valid date
      }
      return arg; // Assume it's already a Date or invalid
    },
    z
      .date()
      .refine(
        (date) => date >= new Date(),
        "Expiration date must not be in the past"
      )
  ),

  insuranceProvider: z.string().min(1, "Insurance provider is required").trim(),

  policyNumber: z
    .string()
    .regex(/^\d{10}$/, "Policy number must be exactly 10 digits"),

  vehicleImages: z.object({
    frontView: z.string(),
    rearView: z.string(),
    interiorView: z.string(),
  }),
});

export class VehicleService implements IVehicleService {
  constructor(
    private vehicleRepo: IVehicleRepo,
    private driverRepo: IDriverRepo
  ) {}
  async addVehicle(data: IVehicle) {
    if (!data) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
    }

    // Validate driverId before using it
    if (!mongoose.Types.ObjectId.isValid(data.driverId)) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.INVALID_ID);
    }

    // Validate input using Zod
    const parsedData = vehicleSchema.safeParse(data);
    if (!parsedData.success) {
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

    // Convert driverId to ObjectId
    const driverId = new mongoose.Types.ObjectId(data.driverId);

    // Check if driver exists
    const driver = await this.driverRepo.findDriverById(driverId);
    if (!driver) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.DRIVER_NOT_FOUND);
    }

    // Upload vehicle images
    const vehicleImages = { ...parsedData.data.vehicleImages };
    for (const key of ["frontView", "rearView", "interiorView"] as const) {
      try {
        const img = vehicleImages[key];
        const res = await cloudinary.uploader.upload(img, {
          folder: "/DriverVehicleImages",
        });
        vehicleImages[key] = res.secure_url;
      } catch (error) {
        console.error(`Failed to upload image ${vehicleImages[key]}:`, error);
        throw new AppError(
          HttpStatus.BAD_GATEWAY,
          error instanceof AppError ? error.message : "Image upload failed"
        );
      }
    }

    // Register the vehicle with updated images
    const vehicleData = { ...parsedData.data, vehicleImages };
    const vehicle = await this.vehicleRepo.registerNewVehicle(vehicleData);

    driver.vehicleId = vehicle._id as mongoose.Schema.Types.ObjectId;
    await driver.save();

    return {
      driver: {
        name: driver.name,
        email: driver.email,
        status: "Pending",
      },
    };
  }

  async reApplyVehicle(id: string, data: IVehicle) {
    if (!data) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
    }

    // Validate driverId before using it
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.INVALID_ID);
    }

    // Validate input using Zod
    const parsedData = vehicleSchema.safeParse(data);
    if (!parsedData.success) {
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

    // Convert driverId to ObjectId
    const driverId = new mongoose.Types.ObjectId(id);

    // Check if driver exists
    const driver = await this.driverRepo.findDriverById(driverId);
    if (!driver) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.DRIVER_NOT_FOUND);
    }
    if (!driver.vehicleId) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.VEHICLE_NOT_FOUND);
    }
    const vehicleDetails = await this.vehicleRepo.findVehicleById(
      driver.vehicleId
    );
    if (!vehicleDetails) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.VEHICLE_NOT_FOUND);
    }
    // Upload vehicle images
    const vehicleImages = { ...parsedData.data.vehicleImages };
    for (const key of ["frontView", "rearView", "interiorView"] as const) {
      try {
        const img = vehicleImages[key];
        const res = await cloudinary.uploader.upload(img, {
          folder: "/DriverVehicleImages",
        });
        vehicleImages[key] = res.secure_url;
      } catch (error) {
        throw new AppError(
          HttpStatus.BAD_GATEWAY,
          error instanceof AppError ? error.message : "Image upload failed"
        );
      }
    }

    // Register the vehicle with updated images
    const vehicleData = { ...parsedData.data, vehicleImages };
    const vehicle = await this.vehicleRepo.updatedVehicleData(id, vehicleData);

    console.log("Vehicle registered successfully:", vehicle);
    return {
      driver: {
        name: driver.name,
        email: driver.email,
        status: "Pending",
      },
    };
  }

  async rejectReason(driverId: string) {
    const id = new mongoose.Types.ObjectId(driverId);
    const driver = await this.driverRepo.findDriverById(id);

    if (!driver) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.DRIVER_NOT_FOUND);
    }
    if (!driver.vehicleId) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.VEHICLE_NOT_FOUND);
    }

    const vehicle = await this.vehicleRepo.findVehicleById(driver.vehicleId);
    if (!vehicle) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.VEHICLE_NOT_FOUND);
    }
    if (vehicle.status !== "rejected") {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.DRIVER_NOT_REJECTED);
    }

    const reason = vehicle.rejectionReason;

    return {
      reason,
    };
  }
}
