import { Router } from 'express';
import driverController, { driverRepo } from '../bindings/driver.bindings';
import { authenticateWithRoles } from '../middlewares/auth.middleware';
import rideController from '../bindings/ride.bindings';
import paymentController from '../bindings/payment.binding';
import { complaintsController } from '../bindings/complaints.bindings';
import { validateBody } from '../middlewares/validate.middleware';
import {
  driverReApplyDTO,
  driverSchemaDTO,
  emailDTO,
  emailOTPValidation,
  googleAuthDTO,
  loginDTO,
  passwordResetDTO,
  updateDriverInfoDTO,
  vehicleReapplyDTO,
  vehicleSchemaDTO,
} from '../dtos/request/auth.req.dto';
import { otpDTO, requestedByDTO } from '../dtos/request/ride.req.dto';
import { validateQuery } from '../middlewares/validate.query.middleware';
import { querySchema } from '../dtos/request/query.req.dto';
import { idSchema } from '../dtos/request/common.req.dto';
import { complaintReqDTO } from '../dtos/request/complaint.req.dto';
import { feedBakReqDTO } from '../dtos/request/feedback.req.dto';

const driverRoutes = Router();
const authMiddleware = authenticateWithRoles('driver', driverRepo);
driverRoutes
  .post('/verify-email', validateBody(emailDTO), driverController.emailVerification)
  .post('/verify-otp', validateBody(emailOTPValidation), driverController.verifyOTP)
  .post('/resend-otp', validateBody(emailDTO), driverController.reSendOTP)
  .post('/addInfo', validateBody(driverSchemaDTO), driverController.addInfo)
  .post('/addVehicle', validateBody(vehicleSchemaDTO), driverController.addVehicle)
  .post('/login', validateBody(loginDTO), driverController.login)
  .post('/google-login', validateBody(emailDTO), driverController.googleLogin)
  .post('/refreshToken', driverController.refreshToken)

  .post('/requestPasswordReset', validateBody(emailDTO), driverController.requestPasswordReset)

  .post('/checkGoogleAuth', validateBody(googleAuthDTO), driverController.checkGoogleAuth)
  .post('/resetPassword', validateBody(passwordResetDTO), driverController.resetPassword)
  .get('/status', authMiddleware, driverController.getStatus)
  .get('/rejectReason', authMiddleware, driverController.rejectReason)
  .patch(
    '/reApplyDriver',
    authMiddleware,
    validateBody(driverReApplyDTO),
    driverController.reApplyDriver,
  )
  .get('/vehicleRejectReason', authMiddleware, driverController.vehicleRejectReason)
  .patch(
    '/reApplyVehicle',
    authMiddleware,
    validateBody(vehicleReapplyDTO),
    driverController.reApplyVehicle,
  )
  .get('/getDriverInfo', authMiddleware, driverController.getDriverInfo)
  .patch(
    '/updateDriverInfo',
    authMiddleware,
    validateBody(updateDriverInfoDTO),
    driverController.updateDriverInfo,
  )
  .patch('/updateProfilePic', authMiddleware, driverController.updateProfilePic)
  .patch('/updateAvailability', authMiddleware, driverController.updateAvailability)

  .post('/useRandomLocation', authMiddleware, rideController.assignRandomLocation)
  .post('/verifyRideOTP', authMiddleware, validateBody(otpDTO), rideController.verifyRideOTP)

  .get(
    '/getWalletInfo',
    authMiddleware,
    validateQuery(querySchema),
    paymentController.getDriverWalletInfo,
  )
  .get('/earnings-summary', authMiddleware, paymentController.earningsSummary)
  .get('/earnings-breakdown', authMiddleware, paymentController.earningsBreakDown)

  .get('/ride-summary', authMiddleware, validateQuery(requestedByDTO), rideController.rideSummary)
  .get(
    '/feedback-summary',
    authMiddleware,
    validateQuery(requestedByDTO),
    rideController.feedBackSummary,
  )

  .get(
    '/getRideHistory',
    authMiddleware,
    validateQuery(querySchema),
    rideController.getRideHistoryDriver,
  )

  .get('/getRideInfo', authMiddleware, validateQuery(idSchema), rideController.getRIdeInfoForDriver)
  .get('/paymentStatus', authMiddleware, validateQuery(idSchema), rideController.checkPaymentStatus)

  .post(
    '/submitComplaint',
    authMiddleware,
    validateBody(complaintReqDTO),
    complaintsController.fileComplaint,
  )

  //! This only need in dev stage
  .get('/getCurrentLoc', authMiddleware, driverController.getCurrentLocation)

  .post('/giveFeedBack', authMiddleware, validateBody(feedBakReqDTO), rideController.giveFeedBack)
  .get('/logout', authMiddleware, driverController.logout);
export default driverRoutes;
