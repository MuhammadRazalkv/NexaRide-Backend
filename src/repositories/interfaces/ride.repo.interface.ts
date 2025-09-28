import { IRideHistory } from '../../models/ride.history.model';
import { UpdateResult } from 'mongodb';
import {
  IRideWithDriver,
  IRideWithUser,
  IRideWithUserAndDriver,
} from '../../services/interfaces/ride.service.interface';
import { IComplaints } from '../../models/complaints.modal';
import mongoose, { Types } from 'mongoose';
import { IUser } from '../../models/user.model';
import { IDrivers } from '../../models/driver.model';
import { IFeedback } from '../../models/feedbacks.model';
import { IBaseRepository } from './base.repo.interface';
import { ComplaintsWithUserDriver } from '../../dtos/response/complaint.res.dto';

export interface PopulatedRideHistory extends Omit<IRideHistory, 'userId' | 'driverId'> {
  userId: IUser;
  driverId: IDrivers;
}

export interface IRideRepo extends IBaseRepository<IRideHistory> {
  // createNewRide(data: Partial<IRideHistory>): Promise<IRideHistory>;
  // getUserIdByDriverId(id: string): Promise<IRideHistory | null>;
  // getDriverByUserId(id: string): Promise<IRideHistory | null>;
  // findOngoingRideByDriverId(id: string): Promise<IRideHistory | null>;
  // cancelRide(
  //   driverId: string,
  //   userId: string,
  //   cancelledBy: string
  // ): Promise<UpdateResult>;
  // updateRideStartedAt(rideId: string): Promise<IRideHistory | null>;
  // getRideIdByUserAndDriver(
  //   driverId: string,
  //   userId: string
  // ): Promise<IRideHistory | null>;
  // findRideById(id: string): Promise<IRideHistory | null>;
  // markCompletedWithData(id: string): Promise<IRideHistory | null>;
  // findRideByUserId(
  //   userId: string,
  //   skip: number,
  //   limit: number
  // ): Promise<IRideHistory[] | null>;
  // findRideByDriver(
  //   driverId: string,
  //   skip: number,
  //   limit: number
  // ): Promise<IRideHistory[] | null>;
  // getUserRideCount(userId: string): Promise<number>;
  // getDriverRideCount(driverId: string): Promise<number>;
  getRideInfoWithDriver(rideId: string): Promise<IRideWithDriver | null>;
  getRideInfoWithDriverAndUser(rideId: string): Promise<IRideWithUserAndDriver | null>;
  createComplaint(
    rideId: string,
    filedById: string,
    filedByRole: string,
    reason: string,
    description?: string,
  ): Promise<IComplaints | null>;
  getComplaintInfo(rideId: string, filedById: string): Promise<IComplaints | null>;
  getAllComplaints(
    skip: number,
    limit: number,
    filterBy: string,
  ): Promise<ComplaintsWithUserDriver[] | null>;
  getRideInfoWithUser(rideId: string): Promise<IRideWithUser | null>;
  getComplainsLength(): Promise<number>;
  getComplaintById(id: string): Promise<IComplaints | null>;
  getPopulatedRideInfo(id: string): Promise<PopulatedRideHistory | null>;
  updateComplaintStatus(id: string, type: string): Promise<IComplaints | null>;
  setWarningMailSentTrue(id: string): Promise<void>;
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
