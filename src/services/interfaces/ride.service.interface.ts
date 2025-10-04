import { CheckCabs, RideCreateDTO } from '../../interface/ride.interface';
import { IRideHistory } from '../../models/ride.history.model';
import { ComplaintResDTO } from '../../dtos/response/complaint.res.dto';
import {
  AvailableCabs,
  DriverRideHistoryDTO,
  FullRideListView,
  RideHistoryDTO,
  UserRideHistoryDTO,
  UserRideListDTO,
} from '../../dtos/response/ride.res.dto';
import { RideAcceptedDriverDTO } from '../../dtos/response/driver.res.dto';
// interface IDriverMinimal {
//   _id: string | ObjectId;
//   name: string;
//   rating: number;
// }

// export interface IRideWithDriver extends Omit<IRideHistory, 'driverId'> {
//   driverId: IDriverMinimal;
// }
// export interface IRideWithUser extends Omit<IRideHistory, 'userId'> {
//   userId: IDriverMinimal;
// }
// export interface IRideWithUserAndDriver extends Omit<IRideHistory, 'userId' | 'driverId'> {
//   userId: IDriverMinimal;
//   driverId: IDriverMinimal;
// }

export interface IRideService {
  checkCabs(id: string, data: CheckCabs): Promise<AvailableCabs[]>;
  assignRandomLocation(id: string): Promise<number[]>;
  getDriverWithVehicle(id: string): Promise<RideAcceptedDriverDTO>;
  createNewRide(data: RideCreateDTO): Promise<RideHistoryDTO>;
  getUserIdByDriverId(driverId: string): Promise<string | undefined>;
  getDriverByUserId(userId: string): Promise<string>;
  verifyRideOTP(driverId: string, OTP: string): Promise<{ rideId: string; date: number }>;
  cancelRide(driverId: string, userId: string, cancelledBy: 'User' | 'Driver'): Promise<void>;
  getRideIdByUserAndDriver(
    driverId: string,
    userId: string,
  ): Promise<{
    rideId: string;
    fare: number | undefined;
  }>;
  getRideHistory(
    id: string,
    page: number,
    sort: string,
  ): Promise<{ history: UserRideListDTO[] | null; total: number }>;
  getRideHistoryDriver(
    id: string,
    page: number,
    sort: string,
  ): Promise<{ history: FullRideListView[] | null; total: number }>;
  checkPaymentStatus(rideId: string): Promise<string | undefined>;
  findRideById(rideId: string): Promise<RideHistoryDTO | null>;
  findUserRideInfo(
    rideId: string,
    userId: string,
  ): Promise<{
    ride: UserRideHistoryDTO | null;
    complaintInfo: ComplaintResDTO | null;
  }>;
  findDriverRideInfo(
    rideId: string,
    driverId: string,
  ): Promise<{ ride: DriverRideHistoryDTO | null; complaintInfo: ComplaintResDTO | null }>;
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
