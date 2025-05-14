import { RideController } from "../controllers/ride.controller";
import { RideService } from "../services/ride.service";
import { RideRepo } from "../repositories/ride.repo";
import { DriverRepo } from "../repositories/driver.repo";
import { bindMethods } from "../utils/bindController";
import { OfferRepo } from "../repositories/offer.repo";
const driverRepo = new DriverRepo()
const rideRepo = new RideRepo()
const offerRepo = new OfferRepo()
export const rideService = new RideService(driverRepo,rideRepo,offerRepo)
const rideController = bindMethods(new RideController(rideService))

export default rideController
