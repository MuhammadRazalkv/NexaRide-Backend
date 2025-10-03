import { ObjectId } from 'mongodb';

export interface IDriverWithVehicleInfo {
  _id: string | ObjectId;
  name: string;
  email: string;
  phone: string;
  license_number: string;
  address: {
    street: string;
    city: string;
    state: string;
    pin_code: string;
  };
  dob: Date;
  license_exp: Date;
  status: string;
  isBlocked: boolean;
  softBlock: boolean;
  vehicleDetails: {
    _id: ObjectId;
    nameOfOwner: string;
    addressOfOwner: string;
    brand: string;
    vehicleModel: string;
    color: string;
    numberPlate: string;
    regDate: Date;
    expDate: Date;
    insuranceProvider: string;
    policyNumber: string;
    vehicleImages: {
      frontView: string;
      rearView: string;
      interiorView: string;
    };
    status: string;
    category: string;
    verified: boolean;
  };
}
