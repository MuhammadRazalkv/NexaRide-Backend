import { ObjectId } from 'mongoose';
import { CheckCabs } from '../../interface/ride.interface';
import { IRideHistory } from '../../models/ride.history.model';
import { IComplaints } from '../../models/complaints.modal';
import { IDriverWithVehicle } from './driver.service.interface';
interface IDriverMinimal {
  _id: string | ObjectId;
  name: string;
  rating: number;
}

export interface IRideWithDriver extends Omit<IRideHistory, 'driverId'> {
  driverId: IDriverMinimal;
}
export interface IRideWithUser extends Omit<IRideHistory, 'userId'> {
  userId: IDriverMinimal;
}
export interface IRideWithUserAndDriver extends Omit<IRideHistory, 'userId' | 'driverId'> {
  userId: IDriverMinimal;
  driverId:IDriverMinimal
}

export interface IRideService {
  checkCabs(id: string, data: CheckCabs): Promise<any>;
  assignRandomLocation(id: string): Promise<number[]>;
  getDriverWithVehicle(id: string): Promise<IDriverWithVehicle>;
  createNewRide(data: Partial<IRideHistory>): Promise<IRideHistory>;
  getUserIdByDriverId(driverId: string): Promise<string | undefined>;
  getDriverByUserId(userId: string): Promise<string>;
  verifyRideOTP(driverId: string, OTP: string): Promise<{ rideId: string; date: number }>;
  cancelRide(driverId: string, userId: string, cancelledBy: 'User' | 'Driver'): Promise<void>;
  getRideIdByUserAndDriver(
    driverId: string,
    userId: string,
  ): Promise<{
    rideId: any;
    fare: number | undefined;
  }>;
  getRideHistory(
    id: string,
    page: number,
    sort: string,
  ): Promise<{ history: IRideHistory[] | null; total: number }>;
  getRideHistoryDriver(
    id: string,
    page: number,
    sort: string,
  ): Promise<{ history: IRideHistory[] | null; total: number }>;
  checkPaymentStatus(rideId: string): Promise<string | undefined>;
  findRideById(rideId: string): Promise<IRideHistory | null>;
  findUserRideInfo(
    rideId: string,
    userId: string,
  ): Promise<{
    ride: IRideWithDriver | null;
    complaintInfo: IComplaints | null;
  }>;
  fileComplaint(
    id: string,
    rideId: string,
    reason: string,
    by: string,
    description?: string,
  ): Promise<IComplaints | null>;
  findDriverRideInfo(
    rideId: string,
    driverId: string,
  ): Promise<{ ride: IRideWithUser | null; complaintInfo: IComplaints | null }>;
  giveFeedBack(
    rideId: string,
    submittedBy: string,
    rating: number,
    feedback?: string,
  ): Promise<void>;
  rideSummary(
    id: string,
    requestedBy: 'user' | 'driver',
  ): Promise<{
    totalRides: number;
    completedRides: number;
    cancelledRides: number;
  }>;
  feedBackSummary(
    id: string,
    requestedBy: 'user' | 'driver',
  ): Promise<{
    avgRating: number;
    totalRatings: number;
  }>;
}
