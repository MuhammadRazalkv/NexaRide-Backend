import mongoose from "mongoose";
import { ObjectId } from "mongoose";
import { IVehicle } from "../models/VehicleModel";
import Vehicle from "../models/VehicleModel";

class VehicleRepo {
  async findVehicleById(vehicle_id: string | ObjectId) {
    return await Vehicle.findById(vehicle_id)
  }

  async registerNewVehicle(data: Partial<IVehicle>) {
    try {

      return await Vehicle.create(data)
    } catch (error: any) {
      console.error("Database error:", error);

      // Handle duplicate key errors (MongoDB error code 11000)
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        throw new Error(`${field.charAt(0).toUpperCase() + field.slice(1)}  already exists`);
      }

      throw new Error("Database operation failed. Please try again.");
    }
  }

  async updatedVehicleData(id: string | ObjectId, data: Partial<IVehicle>) {
    try {
      return await Vehicle.findByIdAndUpdate(
        id,
        { $set: { ...data, status: "pending" } },
        { new: true }
      );

    } catch (error: any) {
      if (error instanceof mongoose.Error.CastError) {
        throw new Error("Invalid ID format");
      }
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        const info = field === "phone" ? "number" : "address";
        throw new Error(`${field.charAt(0).toUpperCase() + field.slice(1)} ${info} already exists`);
      }
      throw new Error("Database operation failed. Please try again.");

    }
  }

  async getVehicleInfo(vehicleId: string) {
    return await Vehicle.findById(vehicleId)
      .select('_id nameOfOwner addressOfOwner brand vehicleModel color numberPlate regDate expDate insuranceProvider policyNumber vehicleImages status rejectionReason verified')
      .lean();
  }


  async approveVehicle(id: string,category:string) {
    return await Vehicle.findByIdAndUpdate(id,
      { $set: { status: 'approved',category } },
      { new: true }
    );
  }

  async rejectVehicle(id: string, reason: string) {
    return await Vehicle.findByIdAndUpdate(id,
      { $set: { rejectionReason: reason, status: 'rejected' } },
      { new: true }
    );
  }



}

export default new VehicleRepo()