import { BaseAccountDTO } from '../dtos/response/base.res.dto';
import { DriverResDTO, DriverWithVehicleResDTO } from '../dtos/response/driver.res.dto';
import { IDriverWithVehicleInfo } from '../interface/driver.vehicle.interface';
import { IDrivers } from '../models/driver.model';
import { IDriverWithVehicle } from '../services/interfaces/driver.service.interface';

export class DriverMapper {
  static toDriver(driver: IDrivers): DriverResDTO {
    return {
      _id: driver.id,
      name: driver.name,
      email: driver.email,
      phone: Number(driver.phone),
      isBlocked: driver.isBlocked,
      softBlock: driver.softBlock,
      address: driver.address,
      dob: driver.dob.toISOString(),
      license_exp: driver.license_exp.toISOString(),
      license_number: driver.license_number,
      verified: driver.verified,
      profilePic: driver.profilePic,
      rejectionReason: driver.rejectionReason,
      status: driver.status,
      vehicleId: String(driver?.vehicleId),
    };
  }

  static toDriverList(drivers: IDrivers[]): DriverResDTO[] {
    return drivers.map((driver) => this.toDriver(driver));
  }

  static toDriverPreview(driver: IDrivers): BaseAccountDTO {
    return {
      _id: driver.id,
      name: driver.name,
      email: driver.email,
      isBlocked: driver.isBlocked,
      softBlock: driver.isBlocked,
      phone:Number(driver.phone)
    };
  }

  static toDriverWithVehicleRes(data: IDriverWithVehicleInfo): DriverWithVehicleResDTO {
    return {
      _id: data._id.toString(),
      name: data.name,
      email: data.email,
      phone:Number(data.phone),
      license_number: data.license_number,
      address: data.address,
      dob: data.dob.toISOString(),
      license_exp: data.license_exp.toISOString(),
      status: data.status,
      isBlocked: data.isBlocked,
      softBlock: data.softBlock,
      vehicleDetails: {
        _id: data.vehicleDetails._id.toString(),
        nameOfOwner: data.vehicleDetails.nameOfOwner,
        addressOfOwner: data.vehicleDetails.addressOfOwner,
        brand: data.vehicleDetails.brand,
        vehicleModel: data.vehicleDetails.vehicleModel,
        color: data.vehicleDetails.color,
        numberPlate: data.vehicleDetails.numberPlate,
        regDate: data.vehicleDetails.regDate.toISOString(),
        expDate: data.vehicleDetails.expDate.toISOString(),
        insuranceProvider: data.vehicleDetails.insuranceProvider,
        policyNumber: data.vehicleDetails.policyNumber,
        vehicleImages: data.vehicleDetails.vehicleImages,
        status: data.vehicleDetails.status,
        category: data.vehicleDetails.category,
        verified: data.vehicleDetails.verified,
      },
    };
  }

  static toDriverWithVehicleList(data: IDriverWithVehicleInfo[]): DriverWithVehicleResDTO[] {
    return data.map((d) => this.toDriverWithVehicleRes(d));
  }
}
