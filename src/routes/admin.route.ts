import { Router } from 'express';
import { adminController } from '../bindings/admin.bindings';
import { authenticateWithRoles } from '../middlewares/auth.middleware';
import offerController from '../bindings/offer.bindings';
import { validateBody } from '../middlewares/validate.middleware';
import { loginDTO } from '../dtos/request/auth.req.dto';
import { querySchema } from '../dtos/request/query.req.dto';
import { validateQuery } from '../middlewares/validate.query.middleware';
import { fareSchema } from '../dtos/request/fare.req.dto';
import { idSchema } from '../dtos/request/common.req.dto';
import { OfferSchemaWithRefinements } from '../dtos/request/offer.req.dto';

const adminRoute = Router();
const adminAuthMiddleware = authenticateWithRoles('admin');

adminRoute
  .post('/login', validateBody(loginDTO), adminController.login)
  .post('/refreshToken', adminController.refreshToken)
  .get('/getUsers', adminAuthMiddleware, validateQuery(querySchema), adminController.getUsers)
  .get('/getFares', adminAuthMiddleware, adminController.getFares)
  .put('/updateFare', adminAuthMiddleware, validateBody(fareSchema), adminController.updateFare)
  .get('/dashboard', adminAuthMiddleware, adminController.dashboard)
  .patch(
    '/user/changeStatus',
    adminAuthMiddleware,
    validateBody(idSchema),
    adminController.changeUserStatus,
  )
  .get('/getDrivers', adminAuthMiddleware, validateQuery(querySchema), adminController.getDrivers)
  .get('/getPendingCount', adminAuthMiddleware, adminController.getPendingDriverCount)
  .get('/pending-drivers', adminAuthMiddleware, adminController.getPendingDriversWithVehicle)
  .patch(
    '/driver/toggleBlockUnblock',
    adminAuthMiddleware,
    validateBody(idSchema),
    adminController.changeDriverStatus,
  )
  .patch(
    '/reject-driver',
    adminAuthMiddleware,
    validateBody(idSchema),
    adminController.rejectDriver,
  )
  .patch(
    '/approve-driver',
    adminAuthMiddleware,
    validateBody(idSchema),
    adminController.approveDriver,
  )
  .get('/getVehicleInfo/:id', adminAuthMiddleware, adminController.getVehicleInfo)
  .patch(
    '/approve-vehicle',
    adminAuthMiddleware,
    validateBody(idSchema),
    adminController.approveVehicle,
  )
  .patch(
    '/reject-vehicle',
    adminAuthMiddleware,
    validateBody(idSchema),
    adminController.rejectVehicle,
  )
  .get(
    '/getComplaints',
    adminAuthMiddleware,
    validateQuery(querySchema),
    adminController.getAllComplaints,
  )
  .get(
    '/getComplaintInDetail',
    adminAuthMiddleware,
    validateQuery(idSchema),
    adminController.getComplaintInDetail,
  )
  .patch(
    '/changeComplaintStatus',
    adminAuthMiddleware,
    validateBody(idSchema),
    adminController.changeComplaintStatus,
  )
  .post(
    '/sendWarningMail',
    adminAuthMiddleware,
    validateBody(idSchema),
    adminController.sendWarningMail,
  )
  .get('/rides', adminAuthMiddleware, validateQuery(querySchema), adminController.rideHistory)
  .get('/ride', adminAuthMiddleware, validateQuery(idSchema), adminController.rideInfo)
  .get(
    '/rideEarnings',
    adminAuthMiddleware,
    validateQuery(querySchema),
    adminController.rideEarnings,
  )
  .get(
    '/premiumUsers',
    adminAuthMiddleware,
    validateQuery(querySchema),
    adminController.premiumUsers,
  )
  .get('/driver-info', adminAuthMiddleware, validateQuery(idSchema), adminController.driverInfo)
  .get(
    '/driver-ride-rating',
    adminAuthMiddleware,
    validateQuery(idSchema),
    adminController.driverRideAndRating,
  )
  .get(
    '/vehicle-info',
    adminAuthMiddleware,
    validateQuery(idSchema),
    adminController.vehicleInfoByDriverId,
  )
  .get('/user-info', adminAuthMiddleware, validateQuery(idSchema), adminController.userInfo)
  .get(
    '/user-ride-rating',
    adminAuthMiddleware,
    validateQuery(idSchema),
    adminController.userRideAndRating,
  )
  // Offer routes
  .post(
    '/addOffer',
    adminAuthMiddleware,
    validateBody(OfferSchemaWithRefinements),
    offerController.addOffer,
  )
  .get('/getOffers', adminAuthMiddleware, offerController.getOffers)
  .patch(
    '/changeOfferStatus',
    adminAuthMiddleware,
    validateBody(idSchema),
    offerController.changeOfferStatus,
  )
  .get('/logout', adminAuthMiddleware, adminController.logout);
export default adminRoute;
