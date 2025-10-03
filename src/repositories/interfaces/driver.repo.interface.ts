import { IDrivers } from '../../models/driver.model';

import { IPricing } from '../../models/pricing.model';
import { IDriverWithVehicle } from '../../services/interfaces/driver.service.interface';
import { BaseRepository } from '../base.repo';
import { IDriverWithVehicleInfo } from '../../interface/driver.vehicle.interface';
import { RideAcceptedDriverDTO } from '../../dtos/response/driver.res.dto';

export interface IDriverRepo extends BaseRepository<IDrivers> {
  // findDriverById(id: mongoose.Types.ObjectId| string):Promise<IDrivers | null>
  // findDriverByVehicleId(id: mongoose.Types.ObjectId | string): Promise<IDrivers | null>
  // findDriverByEmail(email: string):Promise<IDrivers | null>
  // createDriver(data: Partial<IDrivers>): Promise<IDrivers>
  // findByIdAndUpdate(id: string | mongoose.Types.ObjectId, data: Partial<IDrivers>): Promise<IDrivers | null>
  // getAllDrivers(skip:number,limit:number,search:string,sort:string): Promise<IDrivers[]>
  getPendingDriverCount(): Promise<number>;
  // blockUnblockDriver(id: string, status: boolean):Promise<IDrivers | null>
  getPendingDriversWithVehicle(): Promise<IDriverWithVehicleInfo[]>;
  // rejectDriver(id: string, reason: string):Promise<IDrivers | null>
  // approveDriver(id: string): Promise<IDrivers | null>
  // setPFP(id: string, profilePic: string):Promise<IDrivers | null>
  // changePassword(id: string, password: string):Promise<IDrivers | null>
  // findAndUpdate(id: string, field: string, value: string):Promise<IDrivers | null>
  // getAvailableDriversNearby(pickupCoords: [number, number]): Promise<any[]>
  getDriverWithVehicleInfo(id: string): Promise<RideAcceptedDriverDTO>;
  // toggleAvailability(id: string, availability: string):Promise<IDrivers | null>
  // assignRandomLocation(id: string, coordinates: number[]):Promise<IDrivers | null>
  // goOnRide(id: string): Promise<IDrivers | null>
  // goBackToOnline(id: string): Promise<IDrivers | null>
  // setGoogleId(id: string, email: string): Promise<IDrivers | null>
  // updateProfilePic(id: string, url: string): Promise<IDrivers | null>
  // getApprovedDriversCount(search:string): Promise<number>
  findPrices(): Promise<IPricing[]>;
  getPriceByCategory(category: string): Promise<IPricing>;
}
