import { IDrivers } from '../../models/driver.model';

import { IPricing } from '../../models/pricing.model';
import { BaseRepository } from '../base.repo';
import { IDriverWithVehicleInfo } from '../../interface/driver.vehicle.interface';
import { RideAcceptedDriverDTO } from '../../dtos/response/driver.res.dto';

export interface IDriverRepo extends BaseRepository<IDrivers> {
  getPendingDriverCount(): Promise<number>;
  getPendingDriversWithVehicle(): Promise<IDriverWithVehicleInfo[]>;
  getDriverWithVehicleInfo(id: string): Promise<RideAcceptedDriverDTO>;
  findPrices(): Promise<IPricing[]>;
  getPriceByCategory(category: string): Promise<IPricing>;
}
