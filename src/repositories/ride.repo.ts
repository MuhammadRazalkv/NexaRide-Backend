import RideHistory, { IRideHistory } from "../models/ride.history.model";
class RideRepo {
  async createNewRide(data: Partial<IRideHistory>) {
    return await RideHistory.insertOne(data);
  }

  async getUserIdByDriverId(id: string) {
    return await RideHistory.findOne({
      driverId: id,
      status: "ongoing",
    }).select("userId");
  }

  async getDriverByUserId(id: string) {
    return await RideHistory.findOne({ userId: id, status: "ongoing" }).select(
      "driverId"
    );
  }
  async findOngoingRideByDriverId(id: string) {
    return await RideHistory.findOne({ driverId: id, status: "ongoing" });
  }

  async cancelRide(driverId: string, userId: string, cancelledBy: string) {
    return await RideHistory.updateOne(
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
    return await RideHistory.findByIdAndUpdate(rideId, {
      startedAt: Date.now(),
    });
  }

  async getRideIdByUserAndDriver(driverId: string, userId: string) {
    return await RideHistory.findOne({ driverId, userId, status: "ongoing" });
  }

  async findRideById(id: string) {
    return await RideHistory.findOne({ _id: id });
  }

  async markCompletedWithData(
    id: string,
    commission: number,
    driverEarnings: number
  ) {
    return await RideHistory.findByIdAndUpdate(id, {
      $set: {
        paymentStatus: "completed",
        status: "completed",
        endedAt: Date.now(),
        commission,
        driverEarnings,
      },
    });
  }

  async findRideByUserId(userId: string) {
    return await RideHistory.find({ userId }).select(
      "driverId pickupLocation dropOffLocation totalFare distance estTime timeTaken status startedAt endedAt canceledAt paymentStatus driverId"
    );
  }
  async findRideByDriver(driverId: string) {
    return await RideHistory.find({ driverId }).select(
      "driverId pickupLocation dropOffLocation totalFare commission driverEarnings distance estTime timeTaken status startedAt endedAt canceledAt paymentStatus driverId"
    );
  }
}

export default new RideRepo();
