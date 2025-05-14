import mongoose from "mongoose";
import Driver from "../models/driver.model";
import { IDrivers } from "../models/driver.model";
import Pricing, { IPricing } from "../models/pricing.model";
import { ObjectId } from "mongodb";
import { IDriverRepo } from "./interfaces/driver.repo.interface";

import { BaseRepository } from "./base.repo";
import { AppError } from "../utils/appError";
import { HttpStatus } from "../constants/httpStatusCodes";
import { messages } from "../constants/httpMessages";
import { IDriverWithVehicle } from "../services/interfaces/driver.service.interface";

export class DriverRepo
  extends BaseRepository<IDrivers>
  implements IDriverRepo
{
  constructor() {
    super(Driver);
  }
  async findDriverById(id: mongoose.Types.ObjectId | string) {
    return await this.findById(id as string);
  }
  async findDriverByVehicleId(id: string | mongoose.Types.ObjectId) {
    return this.model.findOne({ vehicleId: id });
  }

  async findDriverByEmail(email: string) {
    return this.model.findOne({ email });
  }

  async createDriver(data: Partial<IDrivers>) {
    try {
      return await this.create(data);
    } catch (error: any) {
      console.error("Database error:", error);

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

  async findByIdAndUpdate(id: string, data: Partial<IDrivers>) {
    try {
      return await this.updateById(id, {
        $set: { ...data, status: "pending" },
      });
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

  async getAllDrivers(
    skip: number,
    limit: number,
    search: string,
    sort: string
  ) {
    return this.model
      .find({ status: "approved", name: { $regex: search, $options: "i" } })
      .sort({ name: sort === "A-Z" ? 1 : -1 })
      .skip(skip)
      .limit(limit)
      .select("_id name email isBlocked")
      .lean();
  }

  async getApprovedDriversCount(search: string) {
    return this.model
      .find({ status: "approved", name: { $regex: search, $options: "i" } })
      .countDocuments();
  }

  async blockUnblockDriver(id: string, status: boolean) {
    return this.updateById(id, { $set: { isBlocked: !status } });
  }

  async getPendingDriverCount() {
    const result = await this.model.aggregate([
      {
        $lookup: {
          from: "vehicles",
          localField: "vehicleId",
          foreignField: "_id",
          as: "vehicleDetails",
        },
      },
      { $unwind: "$vehicleDetails" },
      {
        $match: {
          $or: [{ status: "pending" }, { "vehicleDetails.status": "pending" }],
        },
      },
      { $count: "count" },
    ]);

    return result[0]?.count || 0;
  }

  async getPendingDriversWithVehicle() {
    return this.model.aggregate([
      {
        $lookup: {
          from: "vehicles",
          localField: "vehicleId",
          foreignField: "_id",
          as: "vehicleDetails",
        },
      },
      { $unwind: "$vehicleDetails" },
      {
        $match: {
          $or: [{ status: "pending" }, { "vehicleDetails.status": "pending" }],
        },
      },
      {
        $project: {
          name: 1,
          email: 1,
          phone: 1,
          license_number: 1,
          address: 1,
          dob: 1,
          license_exp: 1,
          status: 1,
          vehicleDetails: {
            _id: 1,
            nameOfOwner: 1,
            addressOfOwner: 1,
            brand: 1,
            vehicleModel: 1,
            color: 1,
            numberPlate: 1,
            regDate: 1,
            expDate: 1,
            insuranceProvider: 1,
            policyNumber: 1,
            vehicleImages: 1,
            status: 1,
            category: 1,
          },
        },
      },
    ]);
  }

  async rejectDriver(id: string, reason: string) {
    return this.updateById(id, {
      $set: { rejectionReason: reason, status: "rejected" },
    });
  }

  async approveDriver(id: string) {
    return this.updateById(id, { $set: { status: "approved" } });
  }

  async setGoogleId(email: string, googleId: string) {
    return this.update({ email }, { $set: { googleId } }); // from BaseRepository
  }

  async setPFP(id: string, profilePic: string) {
    return this.updateById(id, { $set: { profilePic } });
  }

  async changePassword(id: string, password: string) {
    return this.updateById(id, { $set: { password } });
  }

  async findAndUpdate(id: string, field: string, value: string) {
    return this.updateById(id, { $set: { [field]: value, status: "pending" } });
  }

  // async getAvailableDriversNearby(pickupCoords: [number, number]) {
  //   return this.model.aggregate([
  //     {
  //       $geoNear: {
  //         near: { type: "Point", coordinates: pickupCoords },
  //         distanceField: "distance",
  //         maxDistance: 5000,
  //         spherical: true,
  //       },
  //     },
  //     {
  //       $lookup: {
  //         from: "vehicles",
  //         localField: "vehicleId",
  //         foreignField: "_id",
  //         as: "vehicleDetails",
  //       },
  //     },
  //     { $unwind: "$vehicleDetails" },
  //     {
  //       $match: {
  //         isAvailable: "online",
  //       },
  //     },
  //     {
  //       $project: {
  //         name: 1,
  //         location: 1,
  //         vehicleDetails: {
  //           brand: 1,
  //           vehicleModel: 1,
  //           color: 1,
  //           category: 1,
  //         },
  //       },
  //     },
  //   ]);
  // }

  async getAvailableDriversNearby(pickupCoords: [number, number]) {
    return this.model.aggregate([
      {
        $geoNear: {
          near: { type: "Point", coordinates: pickupCoords },
          distanceField: "distance",
          maxDistance: 5000,
          spherical: true,
        },
      },
      // {
      //   $match: {
      //     isAvailable: "online",
      //   },
      // },
      {
        $lookup: {
          from: "vehicles",
          localField: "vehicleId",
          foreignField: "_id",
          as: "vehicleDetails",
        },
      },
      {
        $unwind: {
          path: "$vehicleDetails",
        },
      },
      {
        $lookup: {
          from: "feedbacks",
          localField: "_id",
          foreignField: "ratedAgainstId",
          as: "ratings",
        },
      },
      {
        $addFields: {
          avgRating: { $avg: "$ratings.rating" },
          totalRatings: { $size: "$ratings" },
        },
      },
      {
        $project: {
          name: 1,
          location: 1,
          avgRating: 1,
          totalRatings: 1,
          distance: 1,
          vehicleDetails: {
            brand: 1,
            vehicleModel: 1,
            color: 1,
            category: 1,
          },
        },
      },
    ]);
  }

  async getDriverWithVehicleInfo(id: string): Promise<IDriverWithVehicle> {
    const result = await this.model.aggregate([
      { $match: { _id: new ObjectId(id) } },
      {
        $lookup: {
          from: "vehicles",
          localField: "vehicleId",
          foreignField: "_id",
          as: "vehicleDetails",
        },
      },
      { $unwind: "$vehicleDetails" },
      {
        $project: {
          name: 1,
          location: 1,
          vehicleDetails: {
            brand: 1,
            vehicleModel: 1,
            color: 1,
            category: 1,
          },
        },
      },
    ]);
    if (!result.length) {
      throw new AppError(404, "Driver not found");
    }
    return result[0] as IDriverWithVehicle;
  }

  // async toggleAvailability(id: string, availability: string) {
  //   return this.updateById(id, { $set: { isAvailable: availability } });
  // }

  async assignRandomLocation(id: string, coordinates: number[]) {
    return this.updateById(id, {
      $set: {
        location: {
          type: "Point",
          coordinates,
        },
      },
    });
  }
  async findPrices() {
    return await Pricing.find().select("vehicleClass farePerKm");
  }

  async getPriceByCategory(category: string): Promise<IPricing> {
    return await Pricing.findOne({vehicleClass:category}).select("vehicleClass farePerKm");
  }

  // async goOnRide(id: string) {
  //   return this.updateById(id, { $set: { isAvailable: "onRide" } });
  // }

  // async goBackToOnline(id: string) {
  //   return this.updateById(id, { $set: { isAvailable: "online" } });
  // }

  async updateProfilePic(id: string, url: string) {
    return this.updateById(id, { $set: { profilePic: url } });
  }
}
