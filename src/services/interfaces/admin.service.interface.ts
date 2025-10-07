import { FareSchemaDTO } from '../../dtos/request/fare.req.dto';
import { LoginResponseAdminDTO } from '../../dtos/response/auth.res.dto';
import { BaseAccountDTO } from '../../dtos/response/base.res.dto';
import { CommissionResDTO } from '../../dtos/response/commission.res.dto';
import { ComplaintResDTO, ComplaintsWithUserDriver } from '../../dtos/response/complaint.res.dto';
import {
  DriverResDTO,
  DriverWithVehicleResDTO,
  VehicleResDTO,
} from '../../dtos/response/driver.res.dto';
import { FareResDTO } from '../../dtos/response/fare.res.dto';
import { PremiumUsersResDTO } from '../../dtos/response/premium.user.res.dto';
import {
  FullRideListView,
  PopulatedRideResDTO,
  RideInfoWithUserAndDriverNameDTO,
} from '../../dtos/response/ride.res.dto';
import { UserResDTO } from '../../dtos/response/user.dto';
import { ISubscription } from '../../models/subscription.model';

export interface IPremiumUsers extends Omit<ISubscription, 'userId'> {
  user: { name: string };
}

export interface IAdminService {
  login(email: string, password: string): Promise<LoginResponseAdminDTO>;
  getUsers(
    page: number,
    search: string,
    sort: string,
  ): Promise<{
    users: BaseAccountDTO[];
    total: number;
  }>;
  getPendingDriverCount(): Promise<{
    count: number;
  }>;
  changeUserStatus(id: string): Promise<{
    message: string;
    user: BaseAccountDTO;
  }>;
  getDrivers(
    page: number,
    search: string,
    sort: string,
  ): Promise<{
    drivers: BaseAccountDTO[];
    total: number;
  }>;
  changeDriverStatus(id: string): Promise<{
    message: string;
    driver: DriverResDTO;
  }>;
  getPendingDriversWithVehicle(): Promise<DriverWithVehicleResDTO[]>;
  rejectDriver(
    id: string,
    reason: string,
  ): Promise<{
    message: string;
    driver: DriverResDTO;
  }>;
  approveDriver(id: string): Promise<{
    message: string;
    driver: DriverResDTO;
  }>;
  getVehicleInfo(id: string): Promise<VehicleResDTO>;
  approveVehicle(
    id: string,
    category: string,
  ): Promise<{
    message: string;
    vehicle: VehicleResDTO;
  }>;
  rejectVehicle(
    id: string,
    reason: string,
  ): Promise<{
    message: string;
    vehicle: VehicleResDTO;
  }>;
  updateFare(fare: FareSchemaDTO): Promise<FareResDTO>;
  getFares(): Promise<FareResDTO>;
  refreshToken(token: string): Promise<{
    newAccessToken: string;
    newRefreshToken: string;
  }>;

  getAllComplaints(
    page: number,
    filter: string,
    search: string,
  ): Promise<{ complaints: ComplaintsWithUserDriver[] | null; total: number }>;
  getComplaintInDetail(complaintId: string): Promise<{
    complaint: ComplaintResDTO | null;
    rideInfo: PopulatedRideResDTO | null;
  }>;
  changeComplaintStatus(complaintId: string, type: string): Promise<ComplaintResDTO>;
  sendWarningMail(id: string): Promise<void>;

  dashBoard(): Promise<{
    users: number;
    drivers: number;
    completedRides: number;
    premiumUsers: number;
    monthlyCommissions: { month: string; totalCommission: number }[];
  }>;

  rideEarnings(
    page: number,
    search: string,
  ): Promise<{
    commissions: CommissionResDTO[];
    totalEarnings: number;
    totalCount: number;
  }>;
  premiumUsers(
    page: number,
    filterBy: string,
    search: string,
    sort: string,
  ): Promise<{
    premiumUsers: PremiumUsersResDTO[];
    total: number;
    totalEarnings: number;
  }>;

  diverInfo(driverId: string): Promise<DriverResDTO>;
  driverRideAndRating(driverId: string): Promise<{
    totalRides: number;
    ratings: { avgRating: number; totalRatings: number };
  }>;
  vehicleInfoByDriverId(driverId: string): Promise<VehicleResDTO>;
  userInfo(userId: string): Promise<UserResDTO>;
  userRideAndRating(userId: string): Promise<{
    totalRides: number;
    ratings: { avgRating: number; totalRatings: number };
  }>;
  rideHistory(
    page: number,
    sort: string,
    filter: 'all' | 'ongoing' | 'canceled' | 'completed',
    search: string,
  ): Promise<{ history: FullRideListView[] | null; total: number }>;
  rideInfo(rideId: string): Promise<RideInfoWithUserAndDriverNameDTO>;
  logout(refreshToken: string, accessToken: string): Promise<void>;
}
