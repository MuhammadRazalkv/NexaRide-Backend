import RideHistory, { IRideHistory } from "../models/ride.history.model";
import { IRideWithDriver } from "../services/interfaces/ride.service.interface";
import { BaseRepository } from "./base.repo";
import { IRideRepo } from "./interfaces/ride.repo.interface";
import Driver from "../models/driver.model";

export class RideRepo
  extends BaseRepository<IRideHistory>
  implements IRideRepo
{
  constructor() {
    super(RideHistory);
  }

  async createNewRide(data: Partial<IRideHistory>) {
    return await RideHistory.insertOne(data);
  }

  async getUserIdByDriverId(id: string) {
    return await this.model
      .findOne({ driverId: id, status: "ongoing" })
      .select("userId");
  }

  async getDriverByUserId(id: string) {
    return await this.model
      .findOne({ userId: id, status: "ongoing" })
      .select("driverId");
  }

  async findOngoingRideByDriverId(id: string) {
    return await this.model.findOne({ driverId: id, status: "ongoing" });
  }

  async cancelRide(driverId: string, userId: string, cancelledBy: string) {
    return await this.model.updateOne(
      { driverId, userId, status: "ongoing" },
      {
        $set: {
          status: "canceled",
          canceledAt: Date.now(),
          cancelledBy,
        },
      }
    );
  }

  async updateRideStartedAt(rideId: string) {
    return await this.model.findByIdAndUpdate(rideId, {
      startedAt: Date.now(),
    });
  }

  async getRideIdByUserAndDriver(driverId: string, userId: string) {
    return await this.model.findOne({
      driverId,
      userId,
      status: "ongoing",
    });
  }

  async findRideById(id: string) {
    return await this.model.findOne({ _id: id });
  }

  async markCompletedWithData(
    id: string,
    commission: number,
    driverEarnings: number
  ) {
    return await this.model.findByIdAndUpdate(id, {
      $set: {
        paymentStatus: "completed",
        status: "completed",
        endedAt: Date.now(),
        commission,
        driverEarnings,
      },
    });
  }

  async findRideByUserId(userId: string, skip: number, limit: number) {
    return await this.model
      .find({ userId })
      .skip(skip)
      .limit(limit)
      .sort({ startedAt: -1 })
      .select(
        "driverId pickupLocation dropOffLocation totalFare distance estTime timeTaken status startedAt endedAt canceledAt paymentStatus driverId"
      );
  }
  async getUserRideCount(userId: string) {
    return await this.model.find({ userId }).countDocuments();
  }
  async getDriverRideCount(driverId: string) {
    return await this.model.find({ driverId }).countDocuments();
  }

  async findRideByDriver(driverId: string, skip: number, limit: number) {
    return await this.model
      .find({ driverId })
      .skip(skip)
      .limit(limit)
      .sort({ startedAt: -1 })
      .select(
        "driverId pickupLocation dropOffLocation totalFare commission driverEarnings distance estTime timeTaken status startedAt endedAt canceledAt paymentStatus driverId"
      );
  }

  async getRideInfoWithDriver(rideId: string): Promise<IRideWithDriver | null> {
    return await this.model.findById(rideId).select('-commission -driverEarnings -OTP').populate({
      path: "driverId",
      select: "name",
    }).lean().exec() as IRideWithDriver | null;
  }
}
