import { IVehicle } from "../models/vehicle.model";
import cloudinary from "../utils/cloudinary";
import mongoose from "mongoose";
import { IVehicleService } from "./interfaces/vehicle.interface";
import { IVehicleRepo } from "../repositories/interfaces/vehicle.repo.interface";
import { IDriverRepo } from "../repositories/interfaces/driver.repo.interface";
import { AppError } from "../utils/appError";
import { HttpStatus } from "../constants/httpStatusCodes";
import { messages } from "../constants/httpMessages";
import { validateVehicleSchema } from "../utils/validators/vehicleSchemaValidators";

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
    // const parsedData = vehicleSchema.safeParse(data);
    const parsedData = validateVehicleSchema(data);
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
    const driverId = data.driverId.toString();

    // Check if driver exists
    const driver = await this.driverRepo.findById(driverId);
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
    try {
      const vehicle = await this.vehicleRepo.registerNewVehicle(vehicleData);
      await this.driverRepo.updateById(driverId, {
        $set: { vehicleId: vehicle._id },
      });
      return {
        driver: {
          name: driver.name,
          email: driver.email,
          status: "Pending",
        },
      };
    } catch (error: any) {
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

  async reApplyVehicle(id: string, data: IVehicle) {
    if (!data) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
    }

    // Validate driverId before using it
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.INVALID_ID);
    }

    // Validate input using Zod
    const parsedData = validateVehicleSchema(data);
    // const parsedData = vehicleSchema.safeParse(data);
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
    const driverId = id.toString();

    // Check if driver exists
    const driver = await this.driverRepo.findById(driverId);
    if (!driver) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.DRIVER_NOT_FOUND);
    }
    if (!driver.vehicleId) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.VEHICLE_NOT_FOUND);
    }
    const vehicleId = String(driver.vehicleId);
    const vehicleDetails = await this.vehicleRepo.findById(vehicleId);
    if (!vehicleDetails) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.VEHICLE_NOT_FOUND);
    }
    // Upload vehicle images
    try {
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

      await this.vehicleRepo.updateById(vehicleId, {
        $set: { ...vehicleData, status: "pending" },
      });


      return {
        driver: {
          name: driver.name,
          email: driver.email,
          status: "Pending",
        },
      };
    } catch (error: any) {
      console.log(error);

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

  async rejectReason(driverId: string) {
    const driver = await this.driverRepo.findById(driverId);

    if (!driver) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.DRIVER_NOT_FOUND);
    }
    if (!driver.vehicleId) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.VEHICLE_NOT_FOUND);
    }
    const vehicleId = String(driver.vehicleId);
    const vehicle = await this.vehicleRepo.findById(vehicleId);
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
