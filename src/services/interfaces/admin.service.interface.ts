import { IDrivers } from "../../models/driver.model";
import { IUser } from "../../models/user.model";
import { IVehicle } from "../../models/vehicle.model";
interface IFare {
  basic: number;
  premium: number;
  luxury: number;
}
export interface IAdminService {
  login(
    email: string,
    password: string
  ): Promise<{
    accessToken: string;
    refreshToken: string;
  }>;
  getUsers(page:number,search:string,sort:string): Promise<{
    users: IUser[] | null;
    total:number
  }>;
  getPendingDriverCount(): Promise<{
    count: number;
  }>;
  changeUserStatus(id: string): Promise<{
    message: string;
    user: IUser;
  }>;
  getDrivers(page:number,search:string,sort:string): Promise<{
    drivers: IDrivers[];
    total:number
  }>;
  toggleBlockUnblockDriver(id: string): Promise<{
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
}>

}
