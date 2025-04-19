import { Router } from "express";
// import userController from "../controllers/user.controller";
import userController, { userRepo } from "../bindings/user.bindings";
import { authenticateWithRoles } from "../middlewares/auth.middleware";
import rideController from "../bindings/ride.bindings";
import paymentController from "../bindings/payment.binding";

const userRoute = Router();
const userAuthMiddleware = authenticateWithRoles('user',userRepo);
//  AUTHENTICATION
userRoute.post("/verify-email", userController.emailVerification);
userRoute.post("/verify-otp", userController.verifyOTP);
userRoute.post("/resend-otp", userController.reSendOTP);
userRoute.post("/addInfo", userController.addInfo);
userRoute.post("/login", userController.login);
userRoute.post("/google-login", userController.googleLogin);
userRoute.post("/requestPasswordReset", userController.requestPasswordReset);
userRoute.post("/resetPassword", userController.resetPassword);
userRoute.post("/refreshToken", userController.refreshToken);

//  USER PROFILE
userRoute.get("/getUserInfo", userAuthMiddleware, userController.getUserInfo);
userRoute.patch(
  "/updateUserName",
  userAuthMiddleware,
  userController.updateUserName
);
userRoute.patch(
  "/updateUserPhone",
  userAuthMiddleware,
  userController.updateUserPhone
);
userRoute.patch(
  "/updateUserPic",
  userAuthMiddleware,
  userController.updateUserPfp
);

//  WALLET & PAYMENTS
userRoute.get(
  "/getWalletInfo",
  userAuthMiddleware,
  paymentController.getWalletInfo
);
userRoute.post(
  "/addMoneyToWallet",
  userAuthMiddleware,
  paymentController.addMoneyToWallet
);
userRoute.post(
  "/payUsingWallet",
  userAuthMiddleware,
  paymentController.payUsingWallet
);
userRoute.post(
  "/payUsingStripe",
  userAuthMiddleware,
  paymentController.payUsingStripe
);

//  RIDE-RELATED
userRoute.get(
  "/checkPaymentStatus/:rideId",
  userAuthMiddleware,
  rideController.checkPaymentStatus
);
userRoute.get(
  "/getRideHistory",
  userAuthMiddleware,
  rideController.getRideHistory
);

//! Ride routes

userRoute.post("/checkCabs", userAuthMiddleware, rideController.checkCabs);
userRoute.get('/getRideInfo',userAuthMiddleware,rideController.getRIdeInfoForUser)

//* Web hook

// userRoute.post('/webhook',express.raw({ type: 'application/json' }),userController.webhook)

export default userRoute;
