import { VehicleSchemaDTO } from '../../dtos/request/auth.req.dto';
import { IVehicle } from '../../models/vehicle.model';
export interface IVehicleService {
  addVehicle(data: VehicleSchemaDTO): Promise<{
    driver: {
      name: any;
      email: any;
      status: string;
    };
  }>;
  reApplyVehicle(
    id: string,
    data: VehicleSchemaDTO,
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
