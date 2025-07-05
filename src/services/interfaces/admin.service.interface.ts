import { ICommission } from "../../models/commission.model";
import { IComplaints } from "../../models/complaints.modal";
import { IDrivers } from "../../models/driver.model";
import { ISubscription } from "../../models/subscription.model";
import { IUser } from "../../models/user.model";
import { IVehicle } from "../../models/vehicle.model";
import {
  IComplaintsWithUserDriver,
  PopulatedRideHistory,
} from "../../repositories/interfaces/ride.repo.interface";

interface IFare {
  basic: number;
  premium: number;
  luxury: number;
}


export interface IPremiumUsers extends Omit<ISubscription, "userId"> {
  userId: Partial<IUser>;
}

export interface IAdminService {
  login(
    email: string,
    password: string
  ): Promise<{
    accessToken: string;
    refreshToken: string;
  }>;
  getUsers(
    page: number,
    search: string,
    sort: string
  ): Promise<{
    users: IUser[] | null;
    total: number;
  }>;
  getPendingDriverCount(): Promise<{
    count: number;
  }>;
  changeUserStatus(id: string): Promise<{
    message: string;
    user: IUser;
  }>;
  getDrivers(
    page: number,
    search: string,
    sort: string
  ): Promise<{
    drivers: IDrivers[];
    total: number;
  }>;
  changeDriverStatus(id: string): Promise<{
    message: string;
    driver: IDrivers;
  }>;
  getPendingDriversWithVehicle(): Promise<{
    drivers: Partial<IDrivers>[];
  }>;
  rejectDriver(
    id: string,
    reason: string
  ): Promise<{
    message: string;
    driver: IDrivers;
  }>;
  approveDriver(id: string): Promise<{
    message: string;
    driver: IDrivers;
  }>;
  getVehicleInfo(id: string): Promise<IVehicle>;
  approveVehicle(
    id: string,
    category: string
  ): Promise<{
    message: string;
    vehicle: IVehicle;
  }>;
  rejectVehicle(
    id: string,
    reason: string
  ): Promise<{
    message: string;
    vehicle: IVehicle;
  }>;
  updateFare(fare: IFare): Promise<IFare>;
  getFares(): Promise<IFare>;
  refreshToken(token: string): Promise<{
    newAccessToken: string;
    newRefreshToken: string;
  }>;

  getAllComplaints(
    page: number,
    filter: string
  ): Promise<{ complaints: IComplaintsWithUserDriver[] | null; total: number }>;
  getComplaintInDetail(complaintId: string): Promise<{
    complaint: IComplaints | null;
    rideInfo: PopulatedRideHistory | null;
  }>;
  changeComplaintStatus(
    complaintId: string,
    type: string
  ): Promise<IComplaints | null>;
  sendWarningMail(id: string): Promise<void>;
  
  dashBoard(): Promise<{
    users: number;
    drivers: number;
    completedRides: number;
    premiumUsers: number;
    monthlyCommissions: { month: string; totalCommission: number }[];
  }>;

  rideEarnings(page:number):Promise<{commissions: ICommission[]; totalEarnings: number , totalCount:number}>
  premiumUsers(page:number,filterBy:string  ):Promise<{premiumUsers:IPremiumUsers[],total:number,totalEarnings:number}>

  diverInfo(driverId:string):Promise<IDrivers>
  driverRideAndRating(driverId:string):Promise<{totalRides:number,ratings:{avgRating:number,totalRatings:number}}>
  vehicleInfoByDriverId(driverId:string):Promise<IVehicle>
  userInfo(userId:string):Promise<IUser>
  userRideAndRating(userId:string):Promise<{totalRides:number,ratings:{avgRating:number,totalRatings:number}}>
  logout(refreshToken:string,accessToken:string):Promise<void>
}
