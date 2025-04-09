import { Router } from "express";
import userController from "../controllers/user.controller";
import userAuthMiddleware from "../middlewares/user.auth.middleware";
import rideController from "../controllers/ride.controller";
import express from 'express'
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

userRoute.get('/getWalletInfo',userAuthMiddleware,userController.getWalletInfo)
userRoute.post('/addMoneyToWallet',userAuthMiddleware,userController.addMoneyToWallet)
userRoute.post('/payUsingWallet',userAuthMiddleware,userController.payUsingWallet)
userRoute.post('/payUsingStripe',userAuthMiddleware,userController.payUsingStripe)
userRoute.get("/checkPaymentStatus/:rideId",userAuthMiddleware,userController.checkPaymentStatus)
userRoute.get('/getRideHistory',userAuthMiddleware,rideController.getRideHistory)
//! Ride routes 

userRoute.post('/checkCabs',userAuthMiddleware,rideController.checkCabs)


//* Web hook 

// userRoute.post('/webhook',express.raw({ type: 'application/json' }),userController.webhook)

export default userRoute