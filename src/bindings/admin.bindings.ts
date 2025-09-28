import { AdminController } from '../controllers/admin.controller';
import { AdminService } from '../services/admin.service';
import { AdminRepo } from '../repositories/admin.repo';
import { UserRepository } from '../repositories/user.repo';
import { DriverRepo } from '../repositories/driver.repo';
import { VehicleRepo } from '../repositories/vehicle.repo';
import { bindMethods } from '../utils/bindController';
import { RideRepo } from '../repositories/ride.repo';
import { SubscriptionRepo } from '../repositories/subscription.repo';
import { CommissionRepo } from '../repositories/commission.repo';

const adminRepo = new AdminRepo();
const userRepo = new UserRepository();
const driverRepo = new DriverRepo();
const vehicleRepo = new VehicleRepo();
const rideRepo = new RideRepo();
const subscriptionRepo = new SubscriptionRepo();
const commissionRepo = new CommissionRepo();
const adminService = new AdminService(
  userRepo,
  driverRepo,
  vehicleRepo,
  adminRepo,
  rideRepo,
  subscriptionRepo,
  commissionRepo,
);
export const adminController = bindMethods(new AdminController(adminService));
