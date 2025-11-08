import { CheckCabs, RideCreateDTO } from '../interface/ride.interface';
import { IRideService } from './interfaces/ride.service.interface';
import { IDriverRepo } from '../repositories/interfaces/driver.repo.interface';
import { IRideRepo } from '../repositories/interfaces/ride.repo.interface';
import { AppError } from '../utils/appError';
import { HttpStatus } from '../constants/httpStatusCodes';
import { messages } from '../constants/httpMessages';
import mongoose from 'mongoose';
import { getAvailableDriversByGeo } from '../config/redis';
import { calculateFareWithDiscount } from '../utils/offerCalculation';
import { IComplaintsRepo } from '../repositories/interfaces/complaints.repo.interface';
import { ComplaintResDTO } from '../dtos/response/complaint.res.dto';
import { ComplaintsMapper } from '../mappers/complaints.mapper';
import {
  AvailableCabs,
  DriverRideHistoryDTO,
  FullRideListView,
  RideHistoryDTO,
  UserRideHistoryDTO,
  UserRideListDTO,
  VehicleCategory,
} from '../dtos/response/ride.res.dto';
import { RideAcceptedDriverDTO } from '../dtos/response/driver.res.dto';
import { RideMapper } from '../mappers/ride.mapper';

export class RideService implements IRideService {
  constructor(
    private _driverRepo: IDriverRepo,
    private _rideRepo: IRideRepo,
    private _complaintRepo: IComplaintsRepo,
  ) {}

  async checkCabs(id: string, data: CheckCabs): Promise<AvailableCabs[]> {
    const pickupCoords: [number, number] = [data.pickUpPoint.lat, data.pickUpPoint.lng];

    const fares = await this._driverRepo.findPrices();
    const km = data.distance / 1000;

    const vehicleCategories: VehicleCategory[] = ['luxury', 'premium', 'basic'];

    const driversByCategory: Record<VehicleCategory, { id: string; distance: number }[]> = {
      luxury: await getAvailableDriversByGeo('drivers:luxury', pickupCoords[0], pickupCoords[1]),
      premium: await getAvailableDriversByGeo('drivers:premium', pickupCoords[0], pickupCoords[1]),
      basic: await getAvailableDriversByGeo('drivers:basic', pickupCoords[0], pickupCoords[1]),
    };
    console.log('driversByCategory', driversByCategory);

    const updatedCabInfo = [];

    for (const category of vehicleCategories) {
      const driverList = driversByCategory[category];
      if (driverList.length === 0) continue;

      const matchingFare = fares.find((fare) => fare.vehicleClass.toLowerCase() === category);
      if (!matchingFare) continue;

      let rideFare = Math.round(matchingFare.farePerKm * km);

      const { finalFare, bestDiscount, bestOffer, originalFare, isPremiumUser, premiumDiscount } =
        await calculateFareWithDiscount(rideFare, id);

      updatedCabInfo.push({
        category,
        count: driverList.length,
        baseFare: originalFare,
        discountApplied: bestDiscount,
        offerTitle: bestOffer?.title ?? null,
        offerId: bestOffer?._id ?? null,
        isPremiumUser,
        premiumDiscount,
        finalFare,
      });
    }

    return updatedCabInfo;
  }

  async assignRandomLocation(id: string): Promise<number[]> {
    const randomLocations = [
      [77.5946, 12.9716],
      [77.6074, 12.9746],
      [77.567, 12.9776],
      [77.5806, 12.9351],
      [77.6484, 12.9784],
      [77.7025, 12.9608],
      [77.6143, 12.926],
      [77.5671, 12.9985],
      [77.5625, 12.9242],
      [77.7135, 12.8951],
    ];

    const randomCoordinate = randomLocations[Math.floor(Math.random() * randomLocations.length)];
    await this._driverRepo.updateById(id, {
      $set: {
        location: {
          type: 'Point',
          coordinates: randomCoordinate,
        },
      },
    });
    return randomCoordinate;
  }

  async getDriverWithVehicle(id: string): Promise<RideAcceptedDriverDTO> {
    const driver = await this._driverRepo.getDriverWithVehicleInfo(id);

    return driver;
  }

  async createNewRide(data: RideCreateDTO): Promise<RideHistoryDTO> {
    const ride = await this._rideRepo.create(data);
    return RideMapper.toFullRide(ride);
  }
  async getUserIdByDriverId(driverId: string): Promise<string> {
    const ride = await this._rideRepo.findOne({ driverId, status: 'ongoing' });
    return ride?.userId as string;
  }

  async getDriverByUserId(userId: string): Promise<string> {
    const ride = await this._rideRepo.findOne({ userId, status: 'ongoing' });

    return ride?.driverId as string;
  }

  async verifyRideOTP(driverId: string, OTP: string): Promise<{ rideId: string; date: number }> {
    if (!driverId || !OTP) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
    }
    const ride = await this._rideRepo.findOne({ driverId, status: 'ongoing' });

    if (!ride) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.RIDE_NOT_FOUND);
    }
    if (ride.OTP !== OTP) {
      console.log(ride.OTP, OTP);

      throw new AppError(HttpStatus.BAD_REQUEST, messages.INVALID_OTP);
    }
    // await this._rideRepo.updateRideStartedAt(ride.id);
    await this._rideRepo.updateById(ride.id, {
      $set: { startedAt: Date.now() },
    });
    return { rideId: ride.id, date: Date.now() };
  }

  async cancelRide(driverId: string, userId: string, cancelledBy: 'User' | 'Driver') {
    await this._rideRepo.updateOne(
      { driverId, userId, status: 'ongoing' },
      {
        $set: {
          status: 'canceled',
          cancelledAt: Date.now(),
          paymentStatus: 'Not required',
          cancelledBy,
        },
      },
    );
  }

  async getRideIdByUserAndDriver(
    driverId: string,
    userId: string,
  ): Promise<{ rideId: string; fare: number | undefined }> {
    const ride = await this._rideRepo.findOne({ driverId, userId, status: 'ongoing' });
    return { rideId: ride?.id, fare: ride?.totalFare };
  }

  async getRideHistory(
    id: string,
    page: number,
    sort: string,
  ): Promise<{ history: UserRideListDTO[]; total: number }> {
    const limit = 8;
    const skip = (page - 1) * limit;
    const history = await this._rideRepo.findAll(
      { userId: id },
      { sort: { startedAt: sort == 'new' ? -1 : 1 }, skip, limit },
      {
        driverId: 1,
        pickupLocation: 1,
        dropOffLocation: 1,
        totalFare: 1,
        distance: 1,
        estTime: 1,
        timeTaken: 1,
        status: 1,
        startedAt: 1,
        endedAt: 1,
        canceledAt: 1,
        paymentStatus: 1,
      },
    );
    const total = await this._rideRepo.countDocuments({ userId: id });
    return { history: RideMapper.toUserRideList(history), total };
  }

  async getRideHistoryDriver(
    id: string,
    page: number,
    sort: string,
  ): Promise<{ history: FullRideListView[]; total: number }> {
    const limit = 8;
    const skip = (page - 1) * limit;
    const history = await this._rideRepo.findAll(
      { driverId: id },
      { skip, limit, sort: { createdAt: sort == 'new' ? -1 : 1 } },
      {
        driverId: 1,
        pickupLocation: 1,
        dropOffLocation: 1,
        totalFare: 1,
        commission: 1,
        driverEarnings: 1,
        distance: 1,
        estTime: 1,
        timeTaken: 1,
        status: 1,
        startedAt: 1,
        endedAt: 1,
        canceledAt: 1,
        paymentStatus: 1,
      },
    );
    const total = await this._rideRepo.countDocuments({ driverId: id });
    return { history: RideMapper.toFullListViewList(history), total };
  }

  async checkPaymentStatus(rideId: string): Promise<string | undefined> {
    console.log('rideId:- ', rideId);
    if (!rideId) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
    }
    const ride = await this._rideRepo.findById(rideId);
    return ride?.paymentStatus;
  }

  async findRideById(rideId: string): Promise<RideHistoryDTO | null> {
    if (!rideId) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
    }
    const ride = await this._rideRepo.findById(rideId);

    return ride ? RideMapper.toFullRide(ride) : null;
  }

  async findUserRideInfo(
    rideId: string,
    userId: string,
  ): Promise<{
    ride: UserRideHistoryDTO | null;
    complaintInfo: ComplaintResDTO | null;
  }> {
    if (!rideId) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
    }
    const ride = await this._rideRepo.getRideInfoWithDriver(rideId);

    if (!ride) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.RIDE_NOT_FOUND);
    }
    const complaintInfo = await this._complaintRepo.findOne({ rideId, userId });

    return {
      ride: RideMapper.toUserRideHistory(ride),
      complaintInfo: complaintInfo ? ComplaintsMapper.toComplaint(complaintInfo) : null,
    };
  }

  async findDriverRideInfo(
    rideId: string,
    driverId: string,
  ): Promise<{
    ride: DriverRideHistoryDTO | null;
    complaintInfo: ComplaintResDTO | null;
  }> {
    const ride = await this._rideRepo.getRideInfoWithUser(rideId);
    if (!ride) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.RIDE_NOT_FOUND);
    }

    const complaintInfo = await this._complaintRepo.findOne({ rideId, driverId });

    return {
      ride: RideMapper.toDriverRideHistory(ride),
      complaintInfo: complaintInfo ? ComplaintsMapper.toComplaint(complaintInfo) : null,
    };
  }

  async giveFeedBack(
    rideId: string,
    submittedBy: 'user' | 'driver',
    rating: number,
    feedback?: string,
  ): Promise<void> {
    const ride = await this._rideRepo.findById(rideId);
    if (!ride) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.RIDE_NOT_FOUND);
    }

    let ratedById: mongoose.Types.ObjectId;
    let ratedAgainstId: mongoose.Types.ObjectId;
    let ratedAgainstRole: 'user' | 'driver';
    if (submittedBy == 'user') {
      ratedById = new mongoose.Types.ObjectId(ride.userId);
      ratedAgainstId = new mongoose.Types.ObjectId(ride.driverId);
      ratedAgainstRole = 'driver';
    } else {
      ratedById = new mongoose.Types.ObjectId(ride.driverId);
      ratedAgainstId = new mongoose.Types.ObjectId(ride.userId);
      ratedAgainstRole = 'user';
    }
    await this._rideRepo.createFeedBack(
      ride.id,
      ratedById,
      ratedAgainstId,
      submittedBy,
      ratedAgainstRole,
      rating,
      feedback,
    );
  }

  async rideSummary(
    id: string,
    requestedBy: 'user' | 'driver',
  ): Promise<{
    totalRides: number;
    completedRides: number;
    cancelledRides: number;
  }> {
    if (!id) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
    }

    const data = await this._rideRepo.rideCounts(id, requestedBy);

    return data;
  }

  async feedBackSummary(
    id: string,
    requestedBy: 'user' | 'driver',
  ): Promise<{
    avgRating: number;
    totalRatings: number;
  }> {
    if (!id) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
    }
    const data = await this._rideRepo.getAvgRating(new mongoose.Types.ObjectId(id), requestedBy);
    return data;
  }
}
