import { Router } from "express";
import userController from "../controllers/userController";

const userRoute = Router()

userRoute.post("/verify-email",userController.emailVerification)
userRoute.post('/verify-otp',userController.verifyOTP)
userRoute.post('/addInfo',userController.addInfo)
userRoute.post('/resend-otp',userController.reSendOTP)
userRoute.post('/login',userController.login)
userRoute.post('/google-login',userController.googleLogin)
userRoute.post('/requestPasswordReset',userController.requestPasswordReset)
userRoute.post('/resetPassword',userController.resetPassword)

export default userRoute