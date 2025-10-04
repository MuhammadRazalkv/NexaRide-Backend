import {
  DriverRideHistoryDTO,
  FullRideListView,
  PopulatedRideResDTO,
  RideHistoryDTO,
  RideHistoryWithDriverAndUser,
  RideInfoWithUserAndDriverNameDTO,
  UserRideHistoryDTO,
  UserRideListDTO,
} from '../dtos/response/ride.res.dto';
import { IRideHistory } from '../models/ride.history.model';
import { PopulatedRideHistory } from '../repositories/interfaces/ride.repo.interface';
// import { IRideWithUserAndDriver } from '../services/interfaces/ride.service.interface';

export class RideMapper {
  static toPopulatedRide(data: PopulatedRideHistory): PopulatedRideResDTO {
    return {
      pickupCoords: data.pickupCoords,
      dropOffCoords: data.dropOffCoords,
      baseFare: data.baseFare,
      commission: data.commission,
      distance: data.distance,
      driverEarnings: data.driverEarnings,
      dropOffLocation: data.dropOffLocation,
      estTime: data.estTime,
      offerDiscountAmount: data.offerDiscountAmount,
      OTP: data.OTP,
      paymentStatus: data.paymentStatus,
      paymentMethod: data.paymentMethod,
      pickupLocation: data.pickupLocation,
      premiumDiscount: data.premiumDiscount,
      status: data.status,
      totalFare: data.totalFare,
      appliedOffer: data.appliedOffer,
      cancelledAt: data.cancelledAt,
      cancelledBy: data.cancelledBy,
      endedAt: data.endedAt,
      startedAt: data.startedAt,
      timeTaken: data.timeTaken,
      driverId: {
        _id: data.driverId.id,
        email: data.driverId.email,
        phone: Number(data.driverId.phone),
        name: data.driverId.name,
        profilePic: data.driverId.profilePic,
      },
      userId: {
        _id: data.userId.id,
        email: data.userId.email,
        phone: Number(data.userId.phone),
        name: data.userId.name,
        profilePic: data.userId.profilePic,
      },
    };
  }
  static toFullListView(data: IRideHistory): FullRideListView {
    return {
      _id: data.id,
      driverId: data.driverId.toString(),
      canceledAt: data.cancelledAt,
      commission: data.commission,
      distance: data.distance,
      driverEarnings: data.driverEarnings,
      dropOffLocation: data.dropOffLocation,
      endedAt: data.endedAt,
      estTime: data.estTime,
      paymentStatus: data.paymentStatus,
      pickupLocation: data.pickupLocation,
      startedAt: data.startedAt,
      status: data.status,
      timeTaken: data.timeTaken,
      totalFare: data.totalFare,
    };
  }
  static toFullListViewList(data: IRideHistory[]): FullRideListView[] {
    return data.map((d) => this.toFullListView(d));
  }
  static toRideInfoWithDriverAndUser(
    data: RideHistoryWithDriverAndUser,
  ): RideInfoWithUserAndDriverNameDTO {
    return {
      userId: {
        _id: data.userId._id.toString(),
        name: data.userId.name,
      },
      driverId: {
        _id: data.driverId._id.toString(),
        name: data.driverId.name,
      },
      baseFare: data.baseFare,
      commission: data.commission,
      distance: data.distance,
      driverEarnings: data.driverEarnings,
      dropOffLocation: data.dropOffLocation,
      estTime: data.estTime,
      offerDiscountAmount: data.offerDiscountAmount,
      paymentStatus: data.paymentStatus,
      pickupLocation: data.pickupLocation,
      premiumDiscount: data.premiumDiscount,
      status: data.status,
      totalFare: data.totalFare,
      appliedOffer: data.appliedOffer,
      cancelledAt: data.cancelledAt,
      cancelledBy: data.cancelledBy,
      endedAt: data.endedAt,
      paymentMethod: data.paymentMethod,
      startedAt: data.startedAt,
      timeTaken: data.timeTaken,
    };
  }

  static toFullRide(data: IRideHistory): RideHistoryDTO {
    return {
      id: data.id,
      userId: String(data.userId),
      driverId: String(data.driverId),
      pickupLocation: data.pickupLocation,
      dropOffLocation: data.dropOffLocation,
      totalFare: data.totalFare,
      baseFare: data.baseFare,
      premiumDiscount: data.premiumDiscount,
      offerDiscountAmount: data.offerDiscountAmount,
      commission: data.commission,
      driverEarnings: data.driverEarnings,
      distance: data.distance,
      estTime: data.estTime,
      timeTaken: data.timeTaken,
      status: data.status,
      startedAt: data.startedAt,
      endedAt: data.endedAt,
      cancelledAt: data.cancelledAt,
      paymentStatus: data.paymentStatus,
      paymentMethod: data.paymentMethod,
      pickupCoords: data.pickupCoords,
      dropOffCoords: data.dropOffCoords,
      OTP: data.OTP,
      cancelledBy: data.cancelledBy,
      appliedOffer: data.appliedOffer,
    };
  }

  static toUserRideHistory(data: UserRideHistoryDTO): UserRideHistoryDTO {
    return {
      id: data.id,
      userId: data.userId,
      pickupCoords: data.pickupCoords,
      baseFare: data.baseFare,
      distance: data.distance,
      dropOffLocation: data.dropOffLocation,
      estTime: data.estTime,
      offerDiscountAmount: data.offerDiscountAmount,
      paymentStatus: data.paymentStatus,
      pickupLocation: data.pickupLocation,
      premiumDiscount: data.premiumDiscount,
      status: data.status,
      totalFare: data.totalFare,
      appliedOffer: data.appliedOffer,
      cancelledAt: data.cancelledAt,
      cancelledBy: data.cancelledBy,
      endedAt: data.endedAt,
      paymentMethod: data.paymentMethod,
      startedAt: data.startedAt,
      timeTaken: data.timeTaken,
      driverId: data.driverId,
      dropOffCoords: data.dropOffCoords,
    };
  }
  static toDriverRideHistory(data: DriverRideHistoryDTO): DriverRideHistoryDTO {
    return {
      id: data.id,
      userId: data.userId,
      pickupCoords: data.pickupCoords,
      baseFare: data.baseFare,
      distance: data.distance,
      dropOffLocation: data.dropOffLocation,
      estTime: data.estTime,
      offerDiscountAmount: data.offerDiscountAmount,
      paymentStatus: data.paymentStatus,
      pickupLocation: data.pickupLocation,
      premiumDiscount: data.premiumDiscount,
      status: data.status,
      totalFare: data.totalFare,
      appliedOffer: data.appliedOffer,
      cancelledAt: data.cancelledAt,
      cancelledBy: data.cancelledBy,
      endedAt: data.endedAt,
      paymentMethod: data.paymentMethod,
      startedAt: data.startedAt,
      timeTaken: data.timeTaken,
      driverId: data.driverId,
      dropOffCoords: data.dropOffCoords,
      commission: data.commission,
      driverEarnings: data.driverEarnings,
    };
  }
  static toUserRideListView(data: IRideHistory): UserRideListDTO {
    return {
      _id: data.id,
      driverId: data.driverId.toString(),
      canceledAt: data.cancelledAt,
      distance: data.distance,
      dropOffLocation: data.dropOffLocation,
      endedAt: data.endedAt,
      estTime: data.estTime,
      paymentStatus: data.paymentStatus,
      pickupLocation: data.pickupLocation,
      startedAt: data.startedAt,
      status: data.status,
      timeTaken: data.timeTaken,
      totalFare: data.totalFare,
    };
  }
  static toUserRideList(data: IRideHistory[]): UserRideListDTO[] {
    return data.map((d) => this.toUserRideListView(d));
  }
}
