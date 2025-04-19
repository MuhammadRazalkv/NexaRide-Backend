import mongoose from "mongoose";
import { ObjectId } from "mongoose";
import { IVehicle } from "../models/vehicle.model";
import Vehicle from "../models/vehicle.model";
import { IVehicleRepo } from "./interfaces/vehicle.repo.interface";
import { BaseRepository } from "./base.repo"; 
import { HttpStatus } from "../constants/httpStatusCodes";
import { AppError } from "../utils/appError";
import { messages } from "../constants/httpMessages";
export class VehicleRepo extends BaseRepository<IVehicle> implements IVehicleRepo {
  constructor() {
    super(Vehicle);
  }

  async findVehicleById(vehicleId: string | ObjectId) {
    return this.findById(vehicleId.toString()); 
  }

  async registerNewVehicle(data: Partial<IVehicle>) {
    try {
      return await this.create(data); 
    } catch (error: any) {
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        throw new AppError(HttpStatus.CONFLICT,`${field.charAt(0).toUpperCase() + field.slice(1)} already exists`);
      }

      throw new AppError(HttpStatus.INTERNAL_SERVER_ERROR,messages.DATABASE_OPERATION_FAILED);
    }
  }

  async updatedVehicleData(id: string | ObjectId, data: Partial<IVehicle>) {
    try {
      return await this.updateById(id.toString(), {
        $set: { ...data, status: "pending" },
      }); 
    } catch (error: any) {
      if (error instanceof mongoose.Error.CastError) {
        throw new AppError(HttpStatus.BAD_REQUEST,messages.INVALID_ID);
      }

      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        
        throw new AppError(HttpStatus.CONFLICT,`${field.charAt(0).toUpperCase() + field.slice(1)} already exists`);
      }

      throw new AppError(HttpStatus.INTERNAL_SERVER_ERROR,messages.DATABASE_OPERATION_FAILED);

    }
  }

  async getVehicleInfo(vehicleId: string) {
    return this.model
      .findById(vehicleId)
      .select(
        "_id nameOfOwner addressOfOwner brand vehicleModel color numberPlate regDate expDate insuranceProvider policyNumber vehicleImages status rejectionReason verified"
      )
      .lean();
  }

  async approveVehicle(id: string, category: string) {
    return this.updateById(id.toString(), {
      $set: { status: "approved", category },
    });
  }

  async rejectVehicle(id: string, reason: string) {
    return this.updateById(id.toString(), {
      $set: { rejectionReason: reason, status: "rejected" },
    }); 
  }
}


