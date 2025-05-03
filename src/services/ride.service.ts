import { CheckCabs } from "../interface/ride.interface";
import { IRideHistory } from "../models/ride.history.model";
import {
  IRideService,
  IRideWithDriver,
  IRideWithUser,
} from "./interfaces/ride.service.interface";
import { IDriverRepo } from "../repositories/interfaces/driver.repo.interface";
import { IRideRepo } from "../repositories/interfaces/ride.repo.interface";
import { AppError } from "../utils/appError";
import { HttpStatus } from "../constants/httpStatusCodes";
import { messages } from "../constants/httpMessages";
import { IComplaints } from "../models/complaints.modal";
import mongoose from "mongoose";

export class RideService implements IRideService {
  constructor(private driverRepo: IDriverRepo, private rideRepo: IRideRepo) {}

  async checkCabs(id: string, data: CheckCabs) {
    const pickupCoords: [number, number] = [
      data.pickUpPoint.lat,
      data.pickUpPoint.lng,
    ];

    const drivers = await this.driverRepo.getAvailableDriversNearby(
      pickupCoords
    );
    const fares = await this.driverRepo.findPrices();

    const updatedDrivers = drivers.map((driver) => {
      const matchingFare = fares.find(
        (fare: { vehicleClass: string; farePerKm: number }) =>
          fare.vehicleClass.toLowerCase() ===
          driver.vehicleDetails.category.toLowerCase()
      );
      const km = data.distance / 1000;
      return {
        ...driver,
        totalFare: matchingFare ? Math.round(matchingFare.farePerKm * km) : 0,
      };
    });

    return updatedDrivers;
  }

  async assignRandomLocation(id: string) {
    const randomLocations = [
      [77.5946, 12.9716], // MG Road (Central Hub)
      [77.6074, 12.9746], // Brigade Road (Shopping & Dining)
      [77.567, 12.9776], // Cubbon Park (Nature & Leisure)
      [77.5806, 12.9351], // Koramangala (IT & Dining Hub)
      [77.6484, 12.9784], // Indiranagar (Nightlife & Cafes)
      [77.7025, 12.9608], // Whitefield (Tech Park Area)
      [77.6143, 12.926], // HSR Layout (Residential & Startups)
      [77.5671, 12.9985], // Malleshwaram (Traditional Market)
      [77.5625, 12.9242], // Jayanagar (Residential & Shopping)
      [77.7135, 12.8951], // Electronic City (Tech Hub)
    ];

    const randomCoordinate =
      randomLocations[Math.floor(Math.random() * randomLocations.length)];
    await this.driverRepo.assignRandomLocation(id, randomCoordinate);
    return randomCoordinate;
  }

  async getDriverWithVehicle(id: string) {
    if (!id) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
    }
    const driver = await this.driverRepo.getDriverWithVehicleInfo(id);
    return driver;
  }

  async createNewRide(data: Partial<IRideHistory>) {
    const ride = await this.rideRepo.createNewRide(data);
    return ride;
  }
  async getUserIdByDriverId(driverId: string) {
    const ride = await this.rideRepo.getUserIdByDriverId(driverId);
    return ride?.userId as string;
  }

  async getDriverByUserId(userId: string) {
    const ride = await this.rideRepo.getDriverByUserId(userId);

    return ride?.driverId as string;
  }

  async verifyRideOTP(driverId: string, OTP: string) {
    if (!driverId || !OTP) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
    }
    const ride = await this.rideRepo.findOngoingRideByDriverId(driverId);
    if (!ride) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.RIDE_NOT_FOUND);
    }
    if (ride.OTP !== OTP) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.INVALID_OTP);
    }
    await this.rideRepo.updateRideStartedAt(ride.id);
    return { rideId: ride.id, date: Date.now() };
  }

  async cancelRide(
    driverId: string,
    userId: string,
    cancelledBy: "User" | "Driver"
  ) {
    const response = await this.rideRepo.cancelRide(
      driverId,
      userId,
      cancelledBy
    );
  }
  async getRideIdByUserAndDriver(driverId: string, userId: string) {
    const ride = await this.rideRepo.getRideIdByUserAndDriver(driverId, userId);
    return { rideId: ride?.id, fare: ride?.totalFare };
  }

  async getRideHistory(id: string, page: number) {
    const limit = 8;
    const skip = (page - 1) * limit;
    const history = await this.rideRepo.findRideByUserId(id, skip, limit);
    const total = await this.rideRepo.getUserRideCount(id);
    return { history, total };
  }
  async getRideHistoryDriver(id: string, page: number) {
    const limit = 8;
    const skip = (page - 1) * limit;
    const history = await this.rideRepo.findRideByDriver(id, skip, limit);
    const total = await this.rideRepo.getDriverRideCount(id);
    return { history, total };
  }
  async checkPaymentStatus(rideId: string) {
    if (!rideId) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
    }
    const ride = await this.rideRepo.findRideById(rideId);
    return ride?.paymentStatus;
  }

  async findRideById(rideId: string) {
    if (!rideId) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
    }
    const ride = await this.rideRepo.findRideById(rideId);
    return ride;
  }

  async findUserRideInfo(
    rideId: string,
    userId: string
  ): Promise<{
    ride: IRideWithDriver | null;
    complaintInfo: IComplaints | null;
  }> {
    if (!rideId) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
    }
    const ride = await this.rideRepo.getRideInfoWithDriver(rideId);
    console.log("Ride Id In user  ", rideId);
    console.log("user Id  ", userId);

    if (!ride) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.RIDE_NOT_FOUND);
    }
    const complaintInfo = await this.rideRepo.getComplaintInfo(rideId, userId);
    console.log("Complaint info ", complaintInfo);

    return { ride, complaintInfo };
  }

  async fileComplaint(
    id: string,
    rideId: string,
    reason: string,
    by: string,
    description?: string
  ): Promise<IComplaints | null> {
    if (!rideId || rideId === "null" || String(rideId).trim() === "") {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.ID_NOT_PROVIDED);
    }
    if (!reason || (reason == "other" && !description)) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
    }
    const ride = await this.rideRepo.findRideById(rideId);
    if (!ride) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.RIDE_NOT_FOUND);
    }
    console.log("Ride ", ride);

    const complaint = await this.rideRepo.createComplaint(
      rideId,
      id,
      by,
      reason,
      description
    );
    return complaint;
  }

  async findDriverRideInfo(
    rideId: string,
    driverId: string
  ): Promise<{
    ride: IRideWithUser | null;
    complaintInfo: IComplaints | null;
  }> {
    if (!rideId) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
    }

    const ride = await this.rideRepo.getRideInfoWithUser(rideId);
    if (!ride) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.RIDE_NOT_FOUND);
    }
    console.log("rideId", rideId, "driverId", driverId);

    const complaintInfo = await this.rideRepo.getComplaintInfo(
      rideId,
      driverId
    );

    return { ride, complaintInfo };
  }

  async giveFeedBack(
    rideId: string,
    submittedBy: "user" | "driver",
    rating: number,
    feedback?: string
  ): Promise<void> {
    const ride = await this.rideRepo.findRideById(rideId);
    if (!ride) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.RIDE_NOT_FOUND);
    }
    if (rating > 5 || rating < 0) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.RATING_ERROR);
    }
    let ratedById: mongoose.Types.ObjectId;
    let ratedAgainstId: mongoose.Types.ObjectId;
    let ratedAgainstRole: "user" | "driver";
    if (submittedBy == "user") {
      ratedById = new mongoose.Types.ObjectId(ride.userId);
      ratedAgainstId = new mongoose.Types.ObjectId(ride.driverId);
      ratedAgainstRole = "driver";
    } else {
      ratedById = new mongoose.Types.ObjectId(ride.driverId);
      ratedAgainstId = new mongoose.Types.ObjectId(ride.userId);
      ratedAgainstRole = "user";
    }
    await this.rideRepo.createFeedBack(
      ride.id,
      ratedById,
      ratedAgainstId,
      submittedBy,
      ratedAgainstRole,
      rating,
      feedback
    );
  }
}

2;
