import { ObjectId } from "mongoose";
import { CheckCabs } from "../../interface/ride.interface";
import { IRideHistory } from "../../models/ride.history.model";
interface IDriverMinimal {
  _id: string | ObjectId
  name: string;
  rating: number;
}

export interface IRideWithDriver extends Omit<IRideHistory, "driverId"> {
  driverId: IDriverMinimal;
}


export interface IRideService {
  checkCabs(id: string, data: CheckCabs): Promise<any>;
  assignRandomLocation(id: string): Promise<number[]>;
  getDriverWithVehicle(id: string): Promise<any>;
  createNewRide(data: Partial<IRideHistory>): Promise<IRideHistory>;
  getUserIdByDriverId(driverId: string): Promise<string | undefined>;
  getDriverByUserId(userId: string): Promise<string>;
  verifyRideOTP(driverId: string, OTP: string): Promise<number>;
  cancelRide(
    driverId: string,
    userId: string,
    cancelledBy: "User" | "Driver"
  ): Promise<void>;
  getRideIdByUserAndDriver(
    driverId: string,
    userId: string
  ): Promise<{
    rideId: any;
    fare: number | undefined;
  }>;
  getRideHistory(id: string,page:number): Promise<{history:IRideHistory[] | null,total:number}>;
  getRideHistoryDriver(id: string,page:number): Promise<{history:IRideHistory[] | null,total:number}>;
  checkPaymentStatus(rideId: string): Promise<string | undefined>;
  findRideById(rideId:string):Promise<IRideHistory | null>
  findUserRideInfo(rideId:string):Promise<IRideWithDriver | null>
}
