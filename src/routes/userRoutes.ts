import { Router } from "express";
import userController from "../controllers/userController";
import userAuthMiddleware from "../middlewares/userAuth";
import rideController from "../controllers/rideController";

const userRoute = Router()

userRoute.post("/verify-email",userController.emailVerification)
userRoute.post('/verify-otp',userController.verifyOTP)
userRoute.post('/addInfo',userController.addInfo)
userRoute.post('/resend-otp',userController.reSendOTP)
userRoute.post('/login',userController.login)
userRoute.post('/google-login',userController.googleLogin)
userRoute.post('/requestPasswordReset',userController.requestPasswordReset)
userRoute.post('/resetPassword',userController.resetPassword)

userRoute.post('/refreshToken',userController.refreshToken  )
userRoute.get('/getUserInfo',userAuthMiddleware,userController.getUserInfo)

userRoute.patch('/updateUserName',userAuthMiddleware,userController.updateUserName)
userRoute.patch('/updateUserPhone',userAuthMiddleware,userController.updateUserPhone)
userRoute.patch('/updateUserPic',userAuthMiddleware,userController.updateUserPfp)


//! Ride routes 

userRoute.post('/checkCabs',userAuthMiddleware,rideController.checkCabs)

export default userRoute