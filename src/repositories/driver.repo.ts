import Driver from '../models/driver.model';
import { IDrivers } from '../models/driver.model';
import Pricing, { IPricing } from '../models/pricing.model';
import { ObjectId } from 'mongodb';
import { IDriverRepo } from './interfaces/driver.repo.interface';
import { BaseRepository } from './base.repo';
import { AppError } from '../utils/appError';
import { IDriverWithVehicle } from '../services/interfaces/driver.service.interface';
import { IDriverWithVehicleInfo } from '../interface/driver.vehicle.interface';
import { RideAcceptedDriverDTO } from '../dtos/response/driver.res.dto';

export class DriverRepo extends BaseRepository<IDrivers> implements IDriverRepo {
  constructor() {
    super(Driver);
  }

  async getPendingDriverCount() {
    const result = await this.model.aggregate([
      {
        $lookup: {
          from: 'vehicles',
          localField: 'vehicleId',
          foreignField: '_id',
          as: 'vehicleDetails',
        },
      },
      { $unwind: '$vehicleDetails' },
      {
        $match: {
          $or: [{ status: 'pending' }, { 'vehicleDetails.status': 'pending' }],
        },
      },
      { $count: 'count' },
    ]);

    return result[0]?.count || 0;
  }

  async getPendingDriversWithVehicle(): Promise<IDriverWithVehicleInfo[]> {
    return this.model.aggregate([
      {
        $lookup: {
          from: 'vehicles',
          localField: 'vehicleId',
          foreignField: '_id',
          as: 'vehicleDetails',
        },
      },
      { $unwind: '$vehicleDetails' },
      {
        $match: {
          $or: [{ status: 'pending' }, { 'vehicleDetails.status': 'pending' }],
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          phone: 1,
          license_number: 1,
          address: 1,
          dob: 1,
          license_exp: 1,
          status: 1,
          vehicleDetails: {
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
            category: 1,
          },
        },
      },
    ]);
  }

  async getDriverWithVehicleInfo(id: string): Promise<RideAcceptedDriverDTO> {
    const result = await this.model.aggregate([
      { $match: { _id: new ObjectId(id) } },
      {
        $lookup: {
          from: 'vehicles',
          localField: 'vehicleId',
          foreignField: '_id',
          as: 'vehicleDetails',
        },
      },
      { $unwind: '$vehicleDetails' },
      {
        $project: {
          name: 1,
          location: 1,
          vehicleDetails: {
            brand: 1,
            vehicleModel: 1,
            color: 1,
            category: 1,
          },
        },
      },
    ]);
    if (!result.length) {
      throw new AppError(404, 'Driver not found');
    }
    return result[0] as RideAcceptedDriverDTO;
  }

  async findPrices() {
    return await Pricing.find().select('vehicleClass farePerKm');
  }

  async getPriceByCategory(category: string): Promise<IPricing> {
    return await Pricing.findOne({ vehicleClass: category }).select('vehicleClass farePerKm');
  }
}
