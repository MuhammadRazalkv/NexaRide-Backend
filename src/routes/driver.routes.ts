import { Router } from "express";
import driverController from "../controllers/driver.controller";
import authMiddleware from "../middlewares/driver.auth.middleware";
import rideController from "../controllers/ride.controller";

const driverRoutes = Router()

driverRoutes.post('/verify-email',driverController.emailVerification)
driverRoutes.post('/verify-otp',driverController.verifyOTP)
driverRoutes.post('/resend-otp',driverController.reSendOTP)
driverRoutes.post('/addInfo',driverController.addInfo)
driverRoutes.post('/addVehicle',driverController.addVehicle)
driverRoutes.post('/login',driverController.login)
driverRoutes.post('/google-login',driverController.googleLogin)
driverRoutes.post('/requestPasswordReset',driverController.requestPasswordReset)

driverRoutes.post('/checkGoogleAuth',driverController.checkGoogleAuth)
driverRoutes.post('/resetPassword',driverController.resetPassword)

driverRoutes.get('/status',authMiddleware,driverController.getStatus)
driverRoutes.get('/rejectReason',authMiddleware,driverController.rejectReason)
driverRoutes.patch('/reApplyDriver',authMiddleware,driverController.reApplyDriver)
driverRoutes.get('/vehicleRejectReason',authMiddleware,driverController.vehicleRejectReason)
driverRoutes.patch('/reApplyVehicle',authMiddleware,driverController.reApplyVehicle)

driverRoutes.get('/getDriverInfo',authMiddleware,driverController.getDriverInfo)
driverRoutes.patch('/updateDriverInfo',authMiddleware,driverController.updateDriverInfo)
driverRoutes.patch('/updateAvailability',authMiddleware,driverController.updateAvailability)

driverRoutes.post('/upload',driverController.upload)

driverRoutes.post('/useRandomLocation',authMiddleware,rideController.assignRandomLocation)
driverRoutes.post('/verifyRideOTP',authMiddleware,rideController.verifyRideOTP)

driverRoutes.get('/getWalletInfo',authMiddleware,driverController.getWalletInfo)
driverRoutes.get('/getRideHistory',authMiddleware,rideController.getRideHistoryDriver)

//! This only need in dev stage
driverRoutes.get('/getCurrentLoc',authMiddleware,driverController.getCurrentLocation)

export default driverRoutes