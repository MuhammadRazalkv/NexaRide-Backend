import RideHistory, { IRideHistory } from '../models/ride.history.model';
// import {
//   IRideWithDriver,
//   IRideWithUser,
//   IRideWithUserAndDriver,
// } from '../services/interfaces/ride.service.interface';
import { BaseRepository } from './base.repo';
import { IRideRepo, PopulatedRideHistory } from './interfaces/ride.repo.interface';
import Complaints, { IComplaints } from '../models/complaints.modal';
import mongoose from 'mongoose';
import Feedback, { IFeedback } from '../models/feedbacks.model';
import { ComplaintsWithUserDriver } from '../dtos/response/complaint.res.dto';
import {
  DriverRideHistoryDTO,
  RideHistoryWithDriverAndUser,
  UserRideHistoryDTO,
} from '../dtos/response/ride.res.dto';

export class RideRepo extends BaseRepository<IRideHistory> implements IRideRepo {
  constructor() {
    super(RideHistory);
  }

  // async createNewRide(data: Partial<IRideHistory>) {
  //   return await RideHistory.insertOne(data);
  // }

  // async getUserIdByDriverId(id: string) {
  //   return await this.model
  //     .findOne({ driverId: id, status: "ongoing" })
  //     .select("userId");
  // }

  // async getDriverByUserId(id: string) {
  //   return await this.model
  //     .findOne({ userId: id, status: "ongoing" })
  //     .select("driverId");
  // }

  // async findOngoingRideByDriverId(id: string) {
  //   return await this.model.findOne({ driverId: id, status: "ongoing" });
  // }

  // async cancelRide(driverId: string, userId: string, cancelledBy: string) {
  //   return await this.model.updateOne(
  //     { driverId, userId, status: "ongoing" },
  //     {
  //       $set: {
  //         status: "canceled",
  //         cancelledAt: Date.now(),
  //         paymentStatus: "Not required",
  //         cancelledBy,
  //       },
  //     }
  //   );
  // }

  // async updateRideStartedAt(rideId: string) {
  //   return await this.model.findByIdAndUpdate(rideId, {
  //     startedAt: Date.now(),
  //   });
  // }

  // async getRideIdByUserAndDriver(driverId: string, userId: string) {
  //   return await this.model.findOne({
  //     driverId,
  //     userId,
  //     status: "ongoing",
  //   });
  // }

  // async findRideById(id: string) {
  //   return await this.model.findOne({ _id: id });
  // }

  // async markCompletedWithData(id: string) {
  //   return await this.model.findByIdAndUpdate(id, {
  //     $set: {
  //       paymentStatus: "completed",
  //       status: "completed",
  //       endedAt: Date.now(),
  //     },
  //   });
  // }

  // async findRideByUserId(userId: string, skip: number, limit: number) {
  //   return await this.model
  //     .find({ userId })
  //     .skip(skip)
  //     .limit(limit)
  //     .sort({ startedAt: -1 })
  //     .select(
  //       "driverId pickupLocation dropOffLocation totalFare distance estTime timeTaken status startedAt endedAt canceledAt paymentStatus driverId"
  //     );
  // }
  // async getUserRideCount(userId: string) {
  //   return await this.model.find({ userId }).countDocuments();
  // }
  // async getDriverRideCount(driverId: string) {
  //   return await this.model.find({ driverId }).countDocuments();
  // }

  // async findRideByDriver(driverId: string, skip: number, limit: number) {
  //   return await this.model
  //     .find({ driverId })
  //     .skip(skip)
  //     .limit(limit)
  //     .sort({ startedAt: -1 })
  //     .select(
  //       "driverId pickupLocation dropOffLocation totalFare commission driverEarnings distance estTime timeTaken status startedAt endedAt canceledAt paymentStatus driverId"
  //     );
  // }

  async getRideInfoWithDriver(rideId: string): Promise<UserRideHistoryDTO | null> {
    return (await this.model
      .findById(rideId)
      .select('-commission -driverEarnings -OTP')
      .populate({
        path: 'driverId',
        select: 'name',
      })
      .lean()
      .exec()) as UserRideHistoryDTO | null;
  }

  async getComplaintInfo(rideId: string, filedById: string): Promise<IComplaints | null> {
    const rideObjectId = new mongoose.Types.ObjectId(rideId);
    const filedByObjectId = new mongoose.Types.ObjectId(filedById);

    return await Complaints.findOne({
      rideId: rideObjectId,
      filedById: filedByObjectId,
    });
  }

  async getRideInfoWithUser(rideId: string): Promise<DriverRideHistoryDTO | null> {
    return (await this.model
      .findById(rideId)
      .select('-OTP')
      .populate({
        path: 'userId',
        select: 'name',
      })
      .lean()
      .exec()) as DriverRideHistoryDTO | null;
  }

  // async getPopulatedRideInfo(rideId:string){
  //   return this.model.findById(rideId)
  //   .populate('userId','name email')
  //   .populate('driverId','name email')
  // }

  async getPopulatedRideInfo(id: string): Promise<PopulatedRideHistory | null> {
    const ride = await RideHistory.findById(id)
      .populate('userId', 'name email phone profilePic')
      .populate('driverId', 'name email phone profilePic')
      .lean();

    return ride as unknown as PopulatedRideHistory | null;
  }

  async updateComplaintStatus(id: string, type: string): Promise<IComplaints | null> {
    return await Complaints.findOneAndUpdate({ _id: id }, { status: type }, { new: true });
  }

  async setWarningMailSentTrue(id: string): Promise<void> {
    await Complaints.findOneAndUpdate({ _id: id }, { warningMailSend: true });
  }

  async createFeedBack(
    rideId: mongoose.Types.ObjectId,
    ratedById: mongoose.Types.ObjectId,
    ratedAgainstId: mongoose.Types.ObjectId,
    ratedByRole: 'user' | 'driver',
    ratedAgainstRole: 'user' | 'driver',
    rating: number,
    feedback?: string,
  ): Promise<IFeedback | null> {
    return await Feedback.create({
      rideId,
      ratedById,
      ratedAgainstId,
      ratedByRole,
      ratedAgainstRole,
      rating,
      feedback,
    });
  }

  async getAvgRating(
    ratedAgainstId: mongoose.Types.ObjectId,
    ratedAgainstRole: 'user' | 'driver',
  ): Promise<{ totalRatings: number; avgRating: number }> {
    const result = await Feedback.aggregate([
      {
        $match: {
          ratedAgainstId,
          ratedAgainstRole,
        },
      },
      {
        $group: {
          _id: '$ratedToId',
          avgRating: { $avg: '$rating' },
          totalRatings: { $sum: 1 },
        },
      },
    ]);

    if (result.length === 0) {
      return { avgRating: 0, totalRatings: 0 };
    }

    return {
      avgRating: parseFloat(result[0].avgRating.toFixed(1)),
      totalRatings: result[0].totalRatings,
    };
  }

  async rideCounts(
    id: string,
    requestedBy: 'driver' | 'user',
  ): Promise<{
    totalRides: number;
    completedRides: number;
    cancelledRides: number;
  }> {
    const matchField = requestedBy === 'driver' ? 'driverId' : 'userId';

    const result = await RideHistory.aggregate([
      {
        $match: {
          [matchField]: new mongoose.Types.ObjectId(id),
        },
      },
      {
        $group: {
          _id: null,
          totalRides: { $sum: 1 },
          completedRides: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
          cancelledRides: {
            $sum: { $cond: [{ $eq: ['$status', 'canceled'] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalRides: 1,
          completedRides: 1,
          cancelledRides: 1,
        },
      },
    ]);
    return (
      result[0] || {
        totalRides: 0,
        completedRides: 0,
        cancelledRides: 0,
      }
    );
  }

  async paymentInfos(
    id: string,
    requestedBy: 'driver' | 'user',
  ): Promise<{
    totalTransaction: number;
    usingWallet: number;
    usingStripe: number;
  }> {
    const matchField = requestedBy === 'driver' ? 'driverId' : 'userId';
    const result = await RideHistory.aggregate([
      {
        $match: {
          [matchField]: new mongoose.Types.ObjectId(id),
          status: 'completed',
        },
      },
      {
        $group: {
          _id: null,
          totalTransaction: { $sum: '$totalFare' },
          usingWallet: {
            $sum: {
              $cond: [{ $eq: ['$paymentMethod', 'wallet'] }, '$totalFare', 0],
            },
          },
          usingStripe: {
            $sum: {
              $cond: [{ $eq: ['$paymentMethod', 'stripe'] }, '$totalFare', 0],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalTransaction: 1,
          usingWallet: 1,
          usingStripe: 1,
        },
      },
    ]);
    return (
      result[0] || {
        totalTransaction: 0,
        usingStripe: 0,
        usingWallet: 0,
      }
    );
  }

  async getRideInfoWithDriverAndUser(rideId: string): Promise<RideHistoryWithDriverAndUser | null> {
    return (await this.model
      .findById(rideId)
      .select('-OTP')
      .populate({
        path: 'userId',
        select: 'name',
      })
      .populate({
        path: 'driverId',
        select: 'name',
      })
      .lean()
      .exec()) as RideHistoryWithDriverAndUser | null;
  }
}
