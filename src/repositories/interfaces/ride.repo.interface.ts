import { IRideHistory } from '../../models/ride.history.model';
import { IComplaints } from '../../models/complaints.modal';
import mongoose, { Types } from 'mongoose';
import { IUser } from '../../models/user.model';
import { IDrivers } from '../../models/driver.model';
import { IFeedback } from '../../models/feedbacks.model';
import { IBaseRepository } from './base.repo.interface';
import {
  DriverRideHistoryDTO,
  RideHistoryWithDriverAndUser,
  UserRideHistoryDTO,
} from '../../dtos/response/ride.res.dto';

export interface PopulatedRideHistory extends Omit<IRideHistory, 'userId' | 'driverId'> {
  userId: IUser;
  driverId: IDrivers;
}

export interface IRideRepo extends IBaseRepository<IRideHistory> {
  getRideInfoWithDriver(rideId: string): Promise<UserRideHistoryDTO | null>;
  getRideInfoWithDriverAndUser(rideId: string): Promise<RideHistoryWithDriverAndUser | null>;
  getComplaintInfo(rideId: string, filedById: string): Promise<IComplaints | null>;

  getRideInfoWithUser(rideId: string): Promise<DriverRideHistoryDTO | null>;

  getPopulatedRideInfo(id: string): Promise<PopulatedRideHistory | null>;
  createFeedBack(
    rideId: mongoose.Types.ObjectId,
    ratedById: mongoose.Types.ObjectId,
    ratedAgainstId: mongoose.Types.ObjectId,
    ratedByRole: 'user' | 'driver',
    ratedAgainstRole: 'user' | 'driver',
    rating: number,
    feedback?: string,
  ): Promise<IFeedback | null>;
  getAvgRating(
    ratedAgainstId: mongoose.Types.ObjectId,
    ratedAgainstRole: 'user' | 'driver',
  ): Promise<{ totalRatings: number; avgRating: number }>;
  rideCounts(
    id: string,
    requestedBy: 'driver' | 'user',
  ): Promise<{
    totalRides: number;
    completedRides: number;
    cancelledRides: number;
  }>;
  paymentInfos(
    id: string,
    requestedBy: 'driver' | 'user',
  ): Promise<{
    totalTransaction: number;
    usingWallet: number;
    usingStripe: number;
  }>;
}
