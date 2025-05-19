import { PaymentController } from "../controllers/payment.controller";
import { DriverRepo } from "../repositories/driver.repo";
import { UserRepository } from "../repositories/user.repo";
import {WalletRepo} from "../repositories/wallet.repo";
import { PaymentService } from "../services/payment.service";
import { RideRepo } from "../repositories/ride.repo";
import { bindMethods } from "../utils/bindController";
import { SubscriptionRepo } from "../repositories/subscription.repo";

const driverRepo = new DriverRepo()
const userRepo = new UserRepository()
const walletRepo = new WalletRepo()
const rideRepo = new RideRepo()
const subscriptionRepo = new SubscriptionRepo()
const paymentService = new PaymentService(driverRepo,userRepo,walletRepo,rideRepo,subscriptionRepo)
const paymentController = bindMethods(new PaymentController(paymentService))
export default paymentController