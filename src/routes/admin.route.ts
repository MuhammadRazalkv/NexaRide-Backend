import { Router } from "express";
import adminController from "../controllers/admin.controller";
import { adminAuthMiddleware } from "../middlewares/admin.auth.middleware";

const adminRoute = Router()

adminRoute.post('/login',adminController.login)
adminRoute.get('/getUsers',adminAuthMiddleware,adminController.getUsers)

adminRoute.get('/getFares',adminAuthMiddleware,adminController.getFares)
adminRoute.put('/updateFare',adminAuthMiddleware,adminController.updateFare)

adminRoute.patch('/user/changeStatus',adminAuthMiddleware,adminController.changeUserStatus)

adminRoute.get('/getDrivers',adminAuthMiddleware,adminController.getDrivers)
adminRoute.get('/pending-drivers',adminAuthMiddleware,adminController.getPendingDriversWithVehicle)
adminRoute.patch('/driver/toggleBlockUnblock',adminAuthMiddleware,adminController.toggleBlockUnblockDriver)
adminRoute.patch('/reject-driver',adminAuthMiddleware,adminController.rejectDriver)
adminRoute.patch('/approve-driver',adminAuthMiddleware,adminController.approveDriver)
 
adminRoute.get('/getVehicleInfo/:id',adminAuthMiddleware,adminController.getVehicleInfo)
adminRoute.patch('/approve-vehicle',adminAuthMiddleware, adminController.approveVehicle);
adminRoute.patch('/reject-vehicle',adminAuthMiddleware, adminController.rejectVehicle);


export default adminRoute 