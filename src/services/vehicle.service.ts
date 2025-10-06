import cloudinary from '../utils/cloudinary';
import mongoose from 'mongoose';
import { IVehicleService } from './interfaces/vehicle.interface';
import { IVehicleRepo } from '../repositories/interfaces/vehicle.repo.interface';
import { IDriverRepo } from '../repositories/interfaces/driver.repo.interface';
import { AppError } from '../utils/appError';
import { HttpStatus } from '../constants/httpStatusCodes';
import { messages } from '../constants/httpMessages';
import { VehicleSchemaDTO } from '../dtos/request/auth.req.dto';

export class VehicleService implements IVehicleService {
  constructor(
    private _vehicleRepo: IVehicleRepo,
    private _driverRepo: IDriverRepo,
  ) {}
  async addVehicle(data: VehicleSchemaDTO): Promise<{
    driver: {
      name: any;
      email: any;
      status: string;
    };
  }> {
    // Convert driverId to ObjectId
    const driverId = data.driverId.toString();

    // Check if driver exists
    const driver = await this._driverRepo.findById(driverId);
    if (!driver) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.DRIVER_NOT_FOUND);
    }

    // Upload vehicle images
    const vehicleImages = { ...data.vehicleImages };
    for (const key of ['frontView', 'rearView', 'interiorView'] as const) {
      try {
        const img = vehicleImages[key];
        const res = await cloudinary.uploader.upload(img, {
          folder: '/DriverVehicleImages',
        });
        vehicleImages[key] = res.secure_url;
      } catch (error) {
        console.error(`Failed to upload image ${vehicleImages[key]}:`, error);
        throw new AppError(
          HttpStatus.BAD_GATEWAY,
          error instanceof AppError ? error.message : 'Image upload failed',
        );
      }
    }

    // Register the vehicle with updated images
    const vehicleData = {
      ...data,
      driverId: new mongoose.Types.ObjectId(data.driverId),
      vehicleImages,
    };
    try {
      const vehicle = await this._vehicleRepo.create(vehicleData);
      await this._driverRepo.updateById(driverId, {
        $set: { vehicleId: vehicle._id },
      });
      return {
        driver: {
          name: driver.name,
          email: driver.email,
          status: 'Pending',
        },
      };
    } catch (error: any) {
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

  async reApplyVehicle(
    id: string,
    data: VehicleSchemaDTO,
  ): Promise<{
    driver: {
      name: any;
      email: any;
      status: string;
    };
  }> {
    // Check if driver exists
    const driver = await this._driverRepo.findById(id);
    if (!driver) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.DRIVER_NOT_FOUND);
    }
    if (!driver.vehicleId) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.VEHICLE_NOT_FOUND);
    }
    const vehicleId = String(driver.vehicleId);
    const vehicleDetails = await this._vehicleRepo.findById(vehicleId);
    if (!vehicleDetails) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.VEHICLE_NOT_FOUND);
    }
    // Upload vehicle images
    try {
      const vehicleImages = { ...data.vehicleImages };
      for (const key of ['frontView', 'rearView', 'interiorView'] as const) {
        try {
          const img = vehicleImages[key];
          const res = await cloudinary.uploader.upload(img, {
            folder: '/DriverVehicleImages',
          });
          vehicleImages[key] = res.secure_url;
        } catch (error) {
          throw new AppError(
            HttpStatus.BAD_GATEWAY,
            error instanceof AppError ? error.message : 'Image upload failed',
          );
        }
      }

      // Register the vehicle with updated images
      const vehicleData = { ...data, vehicleImages };

      await this._vehicleRepo.updateById(vehicleId, {
        $set: { ...vehicleData, status: 'pending' },
      });

      return {
        driver: {
          name: driver.name,
          email: driver.email,
          status: 'Pending',
        },
      };
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

  async rejectReason(driverId: string): Promise<string | undefined> {
    const driver = await this._driverRepo.findById(driverId);

    if (!driver) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.DRIVER_NOT_FOUND);
    }
    if (!driver.vehicleId) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.VEHICLE_NOT_FOUND);
    }
    const vehicleId = String(driver.vehicleId);
    const vehicle = await this._vehicleRepo.findById(vehicleId);
    if (!vehicle) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.VEHICLE_NOT_FOUND);
    }
    if (vehicle.status !== 'rejected') {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.DRIVER_NOT_REJECTED);
    }

    return vehicle.rejectionReason;
  }
}
