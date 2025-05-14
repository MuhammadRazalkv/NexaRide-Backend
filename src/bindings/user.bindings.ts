import { UserController } from "../controllers/user.controller";
import { UserService } from "../services/user.service";
import { UserRepository } from "../repositories/user.repo";
import { bindMethods } from "../utils/bindController";

export const userRepo = new UserRepository()
export const userService = new UserService(userRepo)
const userController = bindMethods( new UserController(userService))

export default userController