import { Router } from 'express';
import driverController, { driverRepo } from '../bindings/driver.bindings';
import { authenticateWithRoles } from '../middlewares/auth.middleware';
import rideController from '../bindings/ride.bindings';
import paymentController from '../bindings/payment.binding';
import { complaintsController } from '../bindings/complaints.bindings';

const driverRoutes = Router();
const authMiddleware = authenticateWithRoles('driver', driverRepo);
driverRoutes.post('/verify-email', driverController.emailVerification);
driverRoutes.post('/verify-otp', driverController.verifyOTP);
driverRoutes.post('/resend-otp', driverController.reSendOTP);
driverRoutes.post('/addInfo', driverController.addInfo);
driverRoutes.post('/addVehicle', driverController.addVehicle);
driverRoutes.post('/login', driverController.login);
driverRoutes.post('/google-login', driverController.googleLogin);
driverRoutes.post('/refreshToken', driverController.refreshToken);

driverRoutes.post('/requestPasswordReset', driverController.requestPasswordReset);

driverRoutes.post('/checkGoogleAuth', driverController.checkGoogleAuth);
driverRoutes.post('/resetPassword', driverController.resetPassword);

driverRoutes.get('/status', authMiddleware, driverController.getStatus);
driverRoutes.get('/rejectReason', authMiddleware, driverController.rejectReason);
driverRoutes.patch('/reApplyDriver', authMiddleware, driverController.reApplyDriver);
driverRoutes.get('/vehicleRejectReason', authMiddleware, driverController.vehicleRejectReason);
driverRoutes.patch('/reApplyVehicle', authMiddleware, driverController.reApplyVehicle);

driverRoutes.get('/getDriverInfo', authMiddleware, driverController.getDriverInfo);
driverRoutes.patch('/updateDriverInfo', authMiddleware, driverController.updateDriverInfo);
driverRoutes.patch('/updateProfilePic', authMiddleware, driverController.updateProfilePic);
driverRoutes.patch('/updateAvailability', authMiddleware, driverController.updateAvailability);

driverRoutes.post('/upload', driverController.upload);

driverRoutes.post('/useRandomLocation', authMiddleware, rideController.assignRandomLocation);
driverRoutes.post('/verifyRideOTP', authMiddleware, rideController.verifyRideOTP);

driverRoutes.get('/getWalletInfo', authMiddleware, paymentController.getDriverWalletInfo);
driverRoutes.get('/earnings-summary', authMiddleware, paymentController.earningsSummary);

driverRoutes.get('/ride-summary', authMiddleware, rideController.rideSummary);
driverRoutes.get('/feedback-summary', authMiddleware, rideController.feedBackSummary);

driverRoutes.get('/getRideHistory', authMiddleware, rideController.getRideHistoryDriver);

driverRoutes.get('/getRideInfo', authMiddleware, rideController.getRIdeInfoForDriver);

driverRoutes.post('/submitComplaint', authMiddleware, complaintsController.fileComplaint);

//! This only need in dev stage
driverRoutes.get('/getCurrentLoc', authMiddleware, driverController.getCurrentLocation);

driverRoutes.post('/giveFeedBack', authMiddleware, rideController.giveFeedBack);
driverRoutes.get('/logout', authMiddleware, driverController.logout);
export default driverRoutes;
