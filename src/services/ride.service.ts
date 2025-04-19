import { CheckCabs } from "../interface/ride.interface";
import { IRideHistory } from "../models/ride.history.model";
import { IRideService, IRideWithDriver } from "./interfaces/ride.service.interface";
import { IDriverRepo } from "../repositories/interfaces/driver.repo.interface";
import { IRideRepo } from "../repositories/interfaces/ride.repo.interface";
import { AppError } from "../utils/appError";
import { HttpStatus } from "../constants/httpStatusCodes";
import { messages } from "../constants/httpMessages";
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
    return Date.now();
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

  async findRideById(rideId:string){
    if (!rideId) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
    }
    const ride = await this.rideRepo.findRideById(rideId);
    return ride
  }

  async findUserRideInfo(rideId: string): Promise<IRideWithDriver | null> {
    if (!rideId) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
    }
    const ride = await this.rideRepo.getRideInfoWithDriver(rideId)
    if (!ride) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.RIDE_NOT_FOUND);
      
    }
    return ride
  }

}
