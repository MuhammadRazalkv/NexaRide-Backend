import { IVehicle } from "../../models/vehicle.model";
export interface IVehicleService {
  addVehicle(data: IVehicle): Promise<{
    driver: {
      name: any;
      email: any;
      status: string;
    };
  }>;
  reApplyVehicle(
    id: string,
    data: IVehicle
  ): Promise<{
    driver: {
      name: any;
      email: any;
      status: string;
    };
  }>;
  rejectReason(driverId: string): Promise<{
    reason: string | undefined;
  }>;
}
