import { ObjectId } from 'mongoose';
import { BaseAccountDTO } from './base.res.dto';

export interface DriverResDTO extends BaseAccountDTO {
  license_number: string;
  vehicleId?: string;
  address: {
    street: string;
    city: string;
    state: string;
    pin_code: string;
  };
  dob: string;
  license_exp: string;
  verified: boolean;
  rejectionReason?: string;
  status?: string;
}

export interface VehicleResDTO {
  _id: string;
  nameOfOwner: string;
  addressOfOwner: string;
  brand: string;
  vehicleModel: string;
  color: string;
  numberPlate: string;
  regDate: string;
  expDate: string;
  insuranceProvider: string;
  policyNumber: string;
  vehicleImages: {
    frontView: string;
    rearView: string;
    interiorView: string;
  };
  rejectionReason?: string;
  verified: boolean;
  category?: string;
  status: string;
}

export interface DriverWithVehicleResDTO extends Omit<DriverResDTO, 'vehicleId' | 'verified'> {
  vehicleDetails: VehicleResDTO;
}
