import { VehicleResDTO } from '../dtos/response/driver.res.dto';

import { IVehicle } from '../models/vehicle.model';

export class VehicleMapper {
  static toVehicle(vehicle: IVehicle): VehicleResDTO {
    return {
      _id: vehicle._id as string,
      nameOfOwner: vehicle.nameOfOwner,
      addressOfOwner: vehicle.addressOfOwner,
      brand: vehicle.brand,
      vehicleModel: vehicle.vehicleModel,
      color: vehicle.color,
      numberPlate: vehicle.numberPlate,
      regDate: vehicle.regDate.toISOString(),
      expDate: vehicle.expDate.toISOString(),
      insuranceProvider: vehicle.insuranceProvider,
      policyNumber: vehicle.policyNumber,
      vehicleImages: vehicle.vehicleImages,
      status: vehicle.status || 'pending',
      category: vehicle.category,
      verified: vehicle.verified,
    };
  }
}
