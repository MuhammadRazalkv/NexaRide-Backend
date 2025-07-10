import {
  generateRefreshToken,
  generateAccessToken,
  verifyRefreshToken,
} from "../utils/jwt";
import sendEmail from "../utils/mailSender";
import {
  driverApprovalEmail,
  vehicleApprovalEmail,
  rejectionEmail,
  warningMail,
} from "../constants/OTP";
import { AppError } from "../utils/appError";
import { HttpStatus } from "../constants/httpStatusCodes";
import { messages } from "../constants/httpMessages";
import {
  IAdminService,
  IPremiumUsers,
} from "./interfaces/admin.service.interface";
import { IUserRepo } from "../repositories/interfaces/user.repo.interface";
import { IDriverRepo } from "../repositories/interfaces/driver.repo.interface";
import { IVehicleRepo } from "../repositories/interfaces/vehicle.repo.interface";
import { IAdminRepo } from "../repositories/interfaces/admin.repo.interface";
import {
  IComplaintsWithUserDriver,
  IRideRepo,
  PopulatedRideHistory,
} from "../repositories/interfaces/ride.repo.interface";
import { IComplaints } from "../models/complaints.modal";
import { ISubscriptionRepo } from "../repositories/interfaces/subscription.repo.interface";

import { ICommission } from "../models/commission.model";
import { ICommissionRepo } from "../repositories/interfaces/commission.repo.interface";
import { IDrivers } from "../models/driver.model";
import mongoose from "mongoose";
import { IVehicle } from "../models/vehicle.model";
import { IUser } from "../models/user.model";
import { getAccessTokenMaxAge, getRefreshTokenMaxAge } from "../utils/env";
import { setToRedis } from "../config/redis";
import { IRideHistory } from "../models/ride.history.model";
import { IRideWithUserAndDriver } from "./interfaces/ride.service.interface";

const generateTokens = () => ({
  accessToken: generateAccessToken(process.env.ADMIN_EMAIL as string, "admin"),
  refreshToken: generateRefreshToken(
    process.env.ADMIN_EMAIL as string,
    "admin"
  ),
});

interface IFare {
  basic: number;
  premium: number;
  luxury: number;
}
interface IUpdateFare {
  vehicleClass: "Basic" | "Premium" | "Luxury";
  farePerKm: number;
}

export class AdminService implements IAdminService {
  constructor(
    private userRepo: IUserRepo,
    private driverRepo: IDriverRepo,
    private vehicleRepo: IVehicleRepo,
    private adminRepo: IAdminRepo,
    private rideRepo: IRideRepo,
    private subscriptionRepo: ISubscriptionRepo,
    private commissionRepo: ICommissionRepo
  ) {}
  async login(email: string, password: string) {
    if (!email || !password) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
    }
    if (
      email !== process.env.ADMIN_EMAIL ||
      password !== process.env.ADMIN_PASSWORD
    ) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.INVALID_CREDENTIALS);
    }

    // Generate tokens
    return {
      ...generateTokens(),
    };
  }

  async getUsers(page: number, search: string, sort: string) {
    const limit = 5;
    const skip = (page - 1) * limit;

    // const users = await this.userRepo.getAllUsers(skip, limit, search, sort);
    const users = await this.userRepo.findAll(
      {
        name: { $regex: search, $options: "i" },
      },
      { sort: { name: sort === "A-Z" ? 1 : -1 }, skip: skip, limit: limit }
    );

    const total = await this.userRepo.countDocuments({
      name: { $regex: search, $options: "i" },
    });
    return {
      users,
      total,
    };
  }

  async changeUserStatus(id: string) {
    const user = await this.userRepo.findById(id);
    if (!user) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.USER_NOT_FOUND);
    }

    if (!user.softBlock) {
      const ongoingRide = await this.rideRepo.findOne({
        userId: id,
        status: "ongoing",
      });

      if (ongoingRide) {
        const updatedSoftUser = await this.userRepo.updateById(id, {
          $set: { softBlock: true },
        });
        if (updatedSoftUser) {
          return {
            message:
              "User is currently on a ride and will be blocked after completion",
            user: {
              id: updatedSoftUser._id,
              name: updatedSoftUser.name,
              isBlocked: updatedSoftUser.isBlocked,
              softBlock: updatedSoftUser.softBlock,
            },
          };
        }
      }

      const updatedUser = await this.userRepo.updateById(id, {
        $set: { isBlocked: !user.isBlocked },
      });

      if (updatedUser) {
        return {
          message: updatedUser.isBlocked
            ? "User blocked successfully"
            : "User unblocked successfully",
          user: {
            id: updatedUser._id,
            name: updatedUser.name,
            isBlocked: updatedUser.isBlocked,
            softBlock: updatedUser.softBlock,
          },
        };
      }
      throw new AppError(HttpStatus.BAD_REQUEST, messages.SERVER_ERROR);
    }
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "User will be blocked after the ride is completed"
    );
  }

  async getDrivers(page: number, search: string, sort: string) {
    const limit = 5;
    const skip = (page - 1) * 5;

    const drivers = await this.driverRepo.findAll(
      { status: "approved", name: { $regex: search, $options: "i" } },
      { sort: { name: sort === "A-Z" ? 1 : -1 }, skip, limit }
    );

    const total = await this.driverRepo.countDocuments({
      status: "approved",
      name: { $regex: search, $options: "i" },
    });
    return {
      drivers,
      total,
    };
  }

  async getPendingDriverCount() {
    const count = await this.driverRepo.getPendingDriverCount();
    return {
      count,
    };
  }

  async changeDriverStatus(id: string) {
    const driver = await this.driverRepo.findById(id);
    if (!driver) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.DRIVER_NOT_FOUND);
    }

    if (!driver.softBlock) {
      const ongoingRide = await this.rideRepo.findOne({
        driverId: id,
        status: "ongoing",
      });
      if (ongoingRide) {
        const updatedSoftBlock = await this.driverRepo.updateById(id, {
          $set: { softBlock: true },
        });
        if (updatedSoftBlock) {
          return {
            message:
              "User is currently on a ride and will be blocked after completion",
            driver: updatedSoftBlock,
          };
        }
      }

      const updatedDriver = await this.driverRepo.updateById(id, {
        $set: { isBlocked: !driver.isBlocked },
      });

      if (updatedDriver) {
        return {
          message: updatedDriver.isBlocked
            ? "Driver blocked successfully"
            : "Driver unblocked successfully",
          driver: updatedDriver,
        };
      }
    }

    throw new AppError(HttpStatus.INTERNAL_SERVER_ERROR, messages.SERVER_ERROR);
  }

  async getPendingDriversWithVehicle() {
    const drivers = await this.driverRepo.getPendingDriversWithVehicle();
    return {
      drivers,
    };
  }

  async rejectDriver(id: string, reason: string) {
    if (!id || !reason) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
    }
    const driver = await this.driverRepo.findById(id);
    if (!driver) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.DRIVER_NOT_FOUND);
    }

    const updatedDriver = await this.driverRepo.updateById(id, {
      $set: { rejectionReason: reason, status: "rejected" },
    });

    if (updatedDriver) {
      await sendEmail(
        updatedDriver.email,
        "Driver rejection",
        rejectionEmail(
          updatedDriver.name,
          updatedDriver?.rejectionReason || "Due to incorrect info",
          "Driver"
        )
      );
      return {
        message: "Driver rejected successfully",
        driver: updatedDriver,
      };
    }
    throw new AppError(HttpStatus.INTERNAL_SERVER_ERROR, messages.SERVER_ERROR);
  }

  async approveDriver(id: string) {
    if (!id) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
    }
    const driver = await this.driverRepo.findById(id);
    if (!driver) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.DRIVER_NOT_FOUND);
    }

    const updatedDriver = await this.driverRepo.updateById(id, {
      $set: { status: "approved" },
    });

    if (updatedDriver) {
      await sendEmail(
        driver.email,
        "Driver approval ",
        driverApprovalEmail(driver.name)
      );
      return {
        message: "Driver approved successfully",
        driver: updatedDriver,
      };
    }
    throw new AppError(HttpStatus.INTERNAL_SERVER_ERROR, messages.SERVER_ERROR);
  }

  async getVehicleInfo(id: string) {
    if (!id) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
    }

    const vehicle = await this.vehicleRepo.findById(id, {
      _id: 1,
      nameOfOwner: 1,
      addressOfOwner: 1,
      brand: 1,
      vehicleModel: 1,
      color: 1,
      numberPlate: 1,
      regDate: 1,
      expDate: 1,
      insuranceProvider: 1,
      policyNumber: 1,
      vehicleImages: 1,
      status: 1,
      rejectionReason: 1,
      verified: 1,
    });
    if (!vehicle) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.VEHICLE_NOT_FOUND);
    }

    return vehicle;
  }

  async approveVehicle(id: string, category: string) {
    if (!id) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
    }
    const vehicle = await this.vehicleRepo.findById(id);
    if (!vehicle) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.VEHICLE_NOT_FOUND);
    }
    const driver = await this.driverRepo.findOne({ vehicleId: id });
    if (!driver) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.DRIVER_NOT_FOUND);
    }

    const updatedVehicle = await this.vehicleRepo.updateById(id, {
      $set: { status: "approved", category },
    });
    if (updatedVehicle) {
      await sendEmail(
        driver?.email,
        "Vehicle approval",
        vehicleApprovalEmail(driver.name)
      );
      return {
        message: "Vehicle approved successfully",
        vehicle: updatedVehicle,
      };
    }
    throw new AppError(HttpStatus.INTERNAL_SERVER_ERROR, messages.SERVER_ERROR);
  }

  async rejectVehicle(id: string, reason: string) {
    if (!id || !reason) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
    }
    const vehicle = await this.vehicleRepo.findById(id);
    if (!vehicle) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.VEHICLE_NOT_FOUND);
    }
    const driver = await this.driverRepo.findOne({ vehicleId: id });
    if (!driver) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.DRIVER_NOT_FOUND);
    }
    const updatedVehicle = await this.vehicleRepo.updateById(id, {
      $set: { rejectionReason: reason, status: "rejected" },
    });

    if (updatedVehicle) {
      await sendEmail(
        driver.email,
        "Vehicle rejection",
        rejectionEmail(
          driver.name,
          updatedVehicle.rejectionReason || "Due to incorrect info",
          "Vehicle"
        )
      );
      return {
        message: "Vehicle rejected successfully",
        vehicle: updatedVehicle,
      };
    }
    throw new AppError(HttpStatus.INTERNAL_SERVER_ERROR, messages.SERVER_ERROR);
  }

  async updateFare(fare: IFare) {
    if (!fare) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
    }
    const updates: IUpdateFare[] = [
      { vehicleClass: "Basic", farePerKm: fare.basic },
      { vehicleClass: "Premium", farePerKm: fare.premium },
      { vehicleClass: "Luxury", farePerKm: fare.luxury },
    ];

    const fares = await this.adminRepo.updateFare(updates);
    const res: IFare = fares.reduce((acc, fare) => {
      const key = fare.vehicleClass.toLowerCase() as keyof IFare;
      acc[key] = fare.farePerKm;
      return acc;
    }, {} as IFare);
    return res;
  }

  async getFares() {
    const fares = await this.adminRepo.getFares();
    const res: IFare = fares.reduce((acc, fare) => {
      const key = fare.vehicleClass.toLowerCase() as keyof IFare;
      acc[key] = fare.farePerKm;
      return acc;
    }, {} as IFare);

    return res;
  }

  async refreshToken(token: string) {
    if (!token) {
      throw new AppError(HttpStatus.UNAUTHORIZED, messages.TOKEN_NOT_PROVIDED);
    }

    const refresh = verifyRefreshToken(token);
    if (!refresh) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.TOKEN_INVALID);
    }

    const { accessToken, refreshToken } = generateTokens();

    return { newAccessToken: accessToken, newRefreshToken: refreshToken };
  }

  async getAllComplaints(
    page: number,
    filterBy: string
  ): Promise<{
    complaints: IComplaintsWithUserDriver[] | null;
    total: number;
  }> {
    const limit = 5;
    const skip = (page - 1) * 5;
    const complaints = await this.rideRepo.getAllComplaints(
      skip,
      limit,
      filterBy
    );
    const total = await this.rideRepo.getComplainsLength();
    console.log(complaints);

    return { complaints, total };
  }

  async getComplaintInDetail(complaintId: string): Promise<{
    complaint: IComplaints | null;
    rideInfo: PopulatedRideHistory | null;
  }> {
    const complaint = await this.rideRepo.getComplaintById(complaintId);
    if (!complaint) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.NOT_FOUND);
    }
    const ride = await this.rideRepo.getPopulatedRideInfo(complaint.rideId);
    if (!ride) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.RIDE_NOT_FOUND);
    }
    return { complaint, rideInfo: ride };
  }

  async changeComplaintStatus(
    complaintId: string,
    type: string
  ): Promise<IComplaints | null> {
    const complaint = await this.rideRepo.getComplaintById(complaintId);

    if (!complaint) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.NOT_FOUND);
    }
    if (complaint.status !== "pending") {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        "The complaint status has updated already "
      );
    }
    const updatedComplaint = await this.rideRepo.updateComplaintStatus(
      complaintId,
      type
    );

    return updatedComplaint;
  }

  async sendWarningMail(id: string): Promise<void> {
    if (!id) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.ID_NOT_PROVIDED);
    }
    const complaint = await this.rideRepo.getComplaintById(id);
    if (!complaint) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.NOT_FOUND);
    }
    const ride = await this.rideRepo.getPopulatedRideInfo(complaint.rideId);
    if (!ride) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.RIDE_NOT_FOUND);
    }
    let email: string;
    let name: string;
    if (complaint.filedByRole == "driver") {
      name = ride.userId.name;
      email = ride.userId.email;
    } else {
      email = ride.driverId.email;
      name = ride.driverId.name;
    }

    await sendEmail(
      email,
      "NexaRide: Important Notice About Your Account Activity",
      warningMail(
        name,
        String(complaint.id).slice(-4),
        String(ride.id).slice(-4),
        complaint.complaintReason,
        new Date(complaint.createdAt).toDateString(),
        complaint?.description
      )
    ).catch((error) => {
      throw new AppError(HttpStatus.INTERNAL_SERVER_ERROR, error.message);
    });

    await this.rideRepo.setWarningMailSentTrue(id);
  }

  async dashBoard(): Promise<{
    users: number;
    drivers: number;
    completedRides: number;
    premiumUsers: number;
    monthlyCommissions: { month: string; totalCommission: number }[];
  }> {
    const users = await this.userRepo.countDocuments();
    const drivers = await this.driverRepo.countDocuments();
    const completedRides = await this.rideRepo.countDocuments({
      status: "completed",
    });
    const premiumUsers = await this.subscriptionRepo.countDocuments({
      expiresAt: { $gt: Date.now() },
    });
    const monthlyCommissions = await this.commissionRepo.getMonthlyCommission();
    return { users, drivers, completedRides, premiumUsers, monthlyCommissions };
  }

  async rideEarnings(page: number): Promise<{
    commissions: ICommission[];
    totalEarnings: number;
    totalCount: number;
  }> {
    const limit = 5;
    const skip = (page - 1) * 5;

    const commissions = await this.commissionRepo.findAll(
      {},
      { sort: { createdAt: -1 }, skip, limit }
    );
    const totalEarnings = await this.commissionRepo.totalEarnings();
    const totalCount = await this.commissionRepo.countDocuments();
    return { commissions, totalEarnings, totalCount };
  }

  async premiumUsers(
    page: number,
    filterBy: string
  ): Promise<{
    premiumUsers: IPremiumUsers[];
    total: number;
    totalEarnings: number;
  }> {
    const limit = 5;
    const skip = (page - 1) * 5;
    const premiumUsers = await this.subscriptionRepo.subscriptionInfoWithUser(
      filterBy,
      skip,
      limit
    );
    const totalEarnings = await this.subscriptionRepo.totalEarnings();
    const total = await this.subscriptionRepo.countDocuments();

    return { premiumUsers, totalEarnings, total };
  }

  async diverInfo(driverId: string): Promise<IDrivers> {
    if (!driverId) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
    }
    const driver = await this.driverRepo.findById(driverId);
    if (!driver) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.DRIVER_NOT_FOUND);
    }
    return driver;
  }

  async driverRideAndRating(driverId: string): Promise<{
    totalRides: number;
    ratings: { avgRating: number; totalRatings: number };
  }> {
    if (!driverId) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
    }
    const id = new mongoose.Types.ObjectId(driverId);

    const driver = await this.driverRepo.findById(driverId);
    if (!driver) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.DRIVER_NOT_FOUND);
    }
    const totalRides = await this.rideRepo.countDocuments({ driverId });
    const ratings = await this.rideRepo.getAvgRating(id, "driver");
    return { totalRides, ratings };
  }

  async vehicleInfoByDriverId(driverId: string): Promise<IVehicle> {
    if (!driverId) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
    }
    const driver = await this.driverRepo.findById(driverId);
    if (!driver) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.DRIVER_NOT_FOUND);
    }
    const vehicleId = String(driver.vehicleId);
    const vehicle = await this.vehicleRepo.findById(vehicleId);
    if (!vehicle) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.VEHICLE_NOT_FOUND);
    }
    return vehicle;
  }

  async userInfo(userId: string): Promise<IUser> {
    if (!userId) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
    }
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.USER_NOT_FOUND);
    }
    return user;
  }

  async userRideAndRating(userId: string): Promise<{
    totalRides: number;
    ratings: { avgRating: number; totalRatings: number };
  }> {
    if (!userId) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
    }
    const id = new mongoose.Types.ObjectId(userId);

    const driver = await this.userRepo.findById(userId);
    if (!driver) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.DRIVER_NOT_FOUND);
    }
    const totalRides = await this.rideRepo.countDocuments({ userId });
    const ratings = await this.rideRepo.getAvgRating(id, "user");
    return { totalRides, ratings };
  }

  async rideHistory(
    page: number,
    sort: string,
    filter: "all" | "completed" | "canceled" | "ongoing"
  ): Promise<{ history: IRideHistory[] | null; total: number }> {
    const limit = 8;
    const skip = (page - 1) * limit;
    const filterBy = filter === "all" ? {} : { status: filter };
    console.log("Filer by ", filterBy);

    const history = await this.rideRepo.findAll(
      filterBy,
      { skip, limit, sort: { createdAt: sort == "new" ? -1 : 1 } },
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
      }
    );
    const total = await this.rideRepo.countDocuments(filterBy);
    // console.log('Total ',total);
    // console.log("History ", history);

    return { history, total };
  }

  async rideInfo(rideId: string): Promise<IRideWithUserAndDriver> {
    const rideInfo = await this.rideRepo.getRideInfoWithDriverAndUser(rideId);
    if (!rideInfo) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.RIDE_NOT_FOUND);
    }

    return rideInfo;
  }

  async logout(refreshToken: string, accessToken: string): Promise<void> {
    const refreshEXP = (getRefreshTokenMaxAge() / 1000) | 0;
    const accessEXP = (getAccessTokenMaxAge() / 1000) | 0;
    await setToRedis(refreshToken, "Blacklisted", refreshEXP);
    await setToRedis(accessToken, "BlackListed", accessEXP);
  }
}
