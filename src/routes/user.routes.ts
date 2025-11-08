import { Router } from 'express';
import userController, { userRepo } from '../bindings/user.bindings';
import { authenticateWithRoles } from '../middlewares/auth.middleware';
import rideController from '../bindings/ride.bindings';
import paymentController from '../bindings/payment.binding';
import { complaintsController } from '../bindings/complaints.bindings';
import { validateQuery } from '../middlewares/validate.query.middleware';
import { idSchema } from '../dtos/request/common.req.dto';
import { validateBody } from '../middlewares/validate.middleware';
import { feedBakReqDTO } from '../dtos/request/feedback.req.dto';
import {
  emailDTO,
  emailOTPValidation,
  loginDTO,
  nameDTO,
  passwordResetDTO,
  phoneDTO,
  userSchemaDTO,
} from '../dtos/request/auth.req.dto';
import { querySchema } from '../dtos/request/query.req.dto';
import { amountDTO, subTypeDTO } from '../dtos/request/payment.req.dto';
import { checkCabsDTO, requestedByDTO } from '../dtos/request/ride.req.dto';
import { complaintReqDTO } from '../dtos/request/complaint.req.dto';

const userRoute = Router();
const userAuthMiddleware = authenticateWithRoles('user', userRepo);
//  AUTHENTICATION
userRoute
  .post('/verify-email', validateBody(emailDTO), userController.emailVerification)
  .post('/verify-otp', validateBody(emailOTPValidation), userController.verifyOTP)
  .post('/resend-otp', validateBody(emailDTO), userController.reSendOTP)
  .post('/addInfo', validateBody(userSchemaDTO), userController.addInfo)
  .post('/login', validateBody(loginDTO), userController.login)
  .post('/google-login', validateBody(emailDTO), userController.googleLogin)
  .post('/requestPasswordReset', validateBody(emailDTO), userController.requestPasswordReset)
  .post('/resetPassword', validateBody(passwordResetDTO), userController.resetPassword)
  .post('/refreshToken', userController.refreshToken)

  //  USER PROFILE
  .get('/getUserInfo', userAuthMiddleware, userController.getUserInfo)
  .patch(
    '/updateUserName',
    userAuthMiddleware,
    validateBody(nameDTO),
    userController.updateUserName,
  )
  .patch(
    '/updateUserPhone',
    userAuthMiddleware,
    validateBody(phoneDTO),
    userController.updateUserPhone,
  )
  .patch('/updateUserPic', userAuthMiddleware, userController.updateUserPfp)

  //  WALLET & PAYMENTS
  .get(
    '/getWalletInfo',
    userAuthMiddleware,
    validateQuery(querySchema),
    paymentController.getWalletInfo,
  )
  .post(
    '/addMoneyToWallet',
    userAuthMiddleware,
    validateBody(amountDTO),
    paymentController.addMoneyToWallet,
  )
  .post(
    '/payUsingWallet',
    userAuthMiddleware,
    validateBody(idSchema),
    paymentController.payUsingWallet,
  )
  .post(
    '/payUsingStripe',
    userAuthMiddleware,
    validateBody(idSchema),
    paymentController.payUsingStripe,
  )

  .post(
    '/upgradePlan',
    userAuthMiddleware,
    validateBody(subTypeDTO),
    paymentController.upgradeToPlus,
  )
  .get(
    '/payment-summary',
    userAuthMiddleware,
    validateQuery(requestedByDTO),
    paymentController.transactionSummary,
  )

  .get('/subscription-status', userAuthMiddleware, userController.subscriptionStatus)
  .get(
    '/subscription-history',
    userAuthMiddleware,
    validateQuery(querySchema),
    userController.subscriptionHistory,
  )

  //  RIDE-RELATED
  .get(
    '/checkPaymentStatus',
    userAuthMiddleware,
    validateQuery(idSchema),
    rideController.checkPaymentStatus,
  )
  .get(
    '/getRideHistory',
    userAuthMiddleware,
    validateQuery(querySchema),
    rideController.getRideHistory,
  )

  //! Ride routes

  .post('/checkCabs', userAuthMiddleware, validateBody(checkCabsDTO), rideController.checkCabs)
  .get(
    '/getRideInfo',
    userAuthMiddleware,
    validateQuery(idSchema),
    rideController.getRIdeInfoForUser,
  )
  .post(
    '/giveFeedBack',
    userAuthMiddleware,
    validateBody(feedBakReqDTO),
    rideController.giveFeedBack,
  )
  .get(
    '/ride-summary',
    userAuthMiddleware,
    validateQuery(requestedByDTO),
    rideController.rideSummary,
  )
  .get(
    '/feedback-summary',
    userAuthMiddleware,
    validateQuery(requestedByDTO),
    rideController.feedBackSummary,
  )

  .post(
    '/submitComplaint',
    userAuthMiddleware,
    validateBody(complaintReqDTO),
    complaintsController.fileComplaint,
  )
  .get('/logout', userAuthMiddleware, userController.logout);

export default userRoute;
