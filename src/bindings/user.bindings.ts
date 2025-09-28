import { UserController } from '../controllers/user.controller';
import { UserService } from '../services/user.service';
import { UserRepository } from '../repositories/user.repo';
import { bindMethods } from '../utils/bindController';
import { SubscriptionRepo } from '../repositories/subscription.repo';

export const userRepo = new UserRepository();
const subscriptionRepo = new SubscriptionRepo();
export const userService = new UserService(userRepo, subscriptionRepo);
const userController = bindMethods(new UserController(userService));

export default userController;
