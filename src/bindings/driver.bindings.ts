import { DriverController } from '../controllers/driver.controller';
import { DriverService } from '../services/driver.service';
import { DriverRepo } from '../repositories/driver.repo';
import { VehicleService } from '../services/vehicle.service';
import { bindMethods } from '../utils/bindController';
import { VehicleRepo } from '../repositories/vehicle.repo';
export const driverRepo = new DriverRepo();
export const vehicleRepo = new VehicleRepo();
export const driverService = new DriverService(driverRepo, vehicleRepo);
const vehicleService = new VehicleService(vehicleRepo, driverRepo);
const driverController = bindMethods(new DriverController(driverService, vehicleService));

export default driverController;
