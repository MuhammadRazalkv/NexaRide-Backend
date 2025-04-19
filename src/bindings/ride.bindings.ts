import { RideController } from "../controllers/ride.controller";
import { RideService } from "../services/ride.service";
import { RideRepo } from "../repositories/ride.repo";
import { DriverRepo } from "../repositories/driver.repo";
import { bindMethods } from "../utils/bindController";
const driverRepo = new DriverRepo()
const rideRepo = new RideRepo()

const rideService = new RideService(driverRepo,rideRepo)
const rideController = bindMethods(new RideController(rideService))

export default rideController
