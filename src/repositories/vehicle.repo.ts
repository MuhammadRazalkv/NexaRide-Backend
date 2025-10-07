import { IVehicle } from '../models/vehicle.model';
import Vehicle from '../models/vehicle.model';
import { IVehicleRepo } from './interfaces/vehicle.repo.interface';
import { BaseRepository } from './base.repo';
export class VehicleRepo extends BaseRepository<IVehicle> implements IVehicleRepo {
  constructor() {
    super(Vehicle);
  }
}
