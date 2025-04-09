import { CheckCabs } from "../interface/ride.interface";
import Pricing from "../models/pricing.model";
import driverRepo from "../repositories/driver.repo";
import userRepo from "../repositories/user.repo";
import { IRideHistory } from "../models/ride.history.model";
import rideRepo from "../repositories/ride.repo";

class RideService {
  async checkCabs(id: string, data: CheckCabs) {
    const pickupCoords: [number, number] = [
      data.pickUpPoint.lat,
      data.pickUpPoint.lng,
    ];
    console.log("Pickup coords ", pickupCoords);

    const drivers = await driverRepo.getAvailableDriversNearby(pickupCoords);
    const fares = await driverRepo.findPrices();

    const updatedDrivers = drivers.map((driver) => {
      const matchingFare = fares.find(
        (fare) =>
          fare.vehicleClass.toLowerCase() ===
          driver.vehicleDetails.category.toLowerCase()
      );
      const km = data.distance / 1000;
      return {
        ...driver,
        totalFare: matchingFare ? Math.round(matchingFare.farePerKm * km) : 0,
      };
    });

    console.log(updatedDrivers);

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
    await driverRepo.assignRandomLocation(id, randomCoordinate);
    return randomCoordinate;
  }

  async getDriverWithVehicle(id: string) {
    if (!id) {
      throw new Error("Please provide an id");
    }
    const driver = await driverRepo.getDriverWithVehicleInfo(id);
    console.log("Driver  data ", driver);

    return driver;
  }

  async createNewRide(data: Partial<IRideHistory>) {
    const ride = await rideRepo.createNewRide(data);
    return ride;
  }
  async getUserIdByDriverId(driverId:string) {
    const ride = await rideRepo.getUserIdByDriverId(driverId);
    return ride?.userId;
  }
  async getDriverByUserId(userId:string) {
    console.log('User id ',userId);
    
    const ride = await rideRepo.getDriverByUserId(userId);
    
    return ride?.driverId;
  }

  async verifyRideOTP(driverId:string,OTP:string){
    console.log('DRIVER ID ',driverId,'otp',OTP);
    
    if (!driverId || !OTP) {
      throw new Error('Credential missing')
    }
    const ride = await rideRepo.findOngoingRideByDriverId(driverId)
    if (!ride) {
      throw new Error('Ride not found')
    }
    if (ride.OTP !== OTP) {
      throw new Error('Invalid OTP')
    }
    await rideRepo.updateRideStartedAt(ride.id)
    return Date.now()
  }

  async cancelRide(driverId:string,userId:string,cancelledBy:'User'|"Driver"){
    const response = await rideRepo.cancelRide(driverId,userId,cancelledBy)
  }
  async getRideIdByUserAndDriver(driverId:string,userId:string){
    const ride = await rideRepo.getRideIdByUserAndDriver(driverId,userId)
    return {rideId:ride?.id,fare:ride?.totalFare}
  }


  async getRideHistory(id:string){
    const history = await rideRepo.findRideByUserId(id)
    return history
  }
  async getRideHistoryDriver(id:string){
    const history = await rideRepo.findRideByDriver(id)
    return history
  }
}

export default new RideService();
