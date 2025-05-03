import { Router } from "express";
import { adminController } from "../bindings/admin.bindings";
import { authenticateWithRoles } from "../middlewares/auth.middleware";

const adminRoute = Router()
const adminAuthMiddleware = authenticateWithRoles('admin')

adminRoute.post('/login',adminController.login)
adminRoute.post('/refreshToken',adminController.refreshToken)

adminRoute.get('/getUsers',adminAuthMiddleware,adminController.getUsers)

adminRoute.get('/getFares',adminAuthMiddleware,adminController.getFares)
adminRoute.put('/updateFare',adminAuthMiddleware,adminController.updateFare)

adminRoute.patch('/user/changeStatus',adminAuthMiddleware,adminController.changeUserStatus)

adminRoute.get('/getDrivers',adminAuthMiddleware,adminController.getDrivers)
adminRoute.get('/getPendingCount',adminAuthMiddleware,adminController.getPendingDriverCount)
adminRoute.get('/pending-drivers',adminAuthMiddleware,adminController.getPendingDriversWithVehicle)
adminRoute.patch('/driver/toggleBlockUnblock',adminAuthMiddleware,adminController.changeDriverStatus)
adminRoute.patch('/reject-driver',adminAuthMiddleware,adminController.rejectDriver)
adminRoute.patch('/approve-driver',adminAuthMiddleware,adminController.approveDriver)
 
adminRoute.get('/getVehicleInfo/:id',adminAuthMiddleware,adminController.getVehicleInfo)
adminRoute.patch('/approve-vehicle',adminAuthMiddleware, adminController.approveVehicle);
adminRoute.patch('/reject-vehicle',adminAuthMiddleware, adminController.rejectVehicle);

adminRoute.get('/getComplaints',adminAuthMiddleware,adminController.getAllComplaints)
adminRoute.get('/getComplaintInDetail',adminAuthMiddleware,adminController.getComplaintInDetail)
adminRoute.patch('/changeComplaintStatus',adminAuthMiddleware,adminController.changeComplaintStatus)
adminRoute.post('/sendWarningMail',adminAuthMiddleware,adminController.sendWarningMail)
export default adminRoute 