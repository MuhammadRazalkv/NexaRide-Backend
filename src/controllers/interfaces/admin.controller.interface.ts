import { Request,Response,NextFunction } from "express";
export interface IAdminController {
    login(req: Request, res: Response, next: NextFunction): Promise<void>
    getUsers(req: Request, res: Response, next: NextFunction): Promise<void>
    getPendingDriverCount(req: Request, res: Response, next: NextFunction): Promise<void>
    changeUserStatus(req: Request, res: Response, next: NextFunction): Promise<void>
    getDrivers(req: Request, res: Response, next: NextFunction): Promise<void>
    changeDriverStatus(req: Request, res: Response, next: NextFunction): Promise<void>
    getPendingDriversWithVehicle(req: Request, res: Response, next: NextFunction): Promise<void>
    rejectDriver(req: Request, res: Response, next: NextFunction): Promise<void>
    approveDriver(req: Request, res: Response, next: NextFunction): Promise<void>
    getVehicleInfo(req: Request, res: Response, next: NextFunction): Promise<void>
    approveVehicle(req: Request, res: Response, next: NextFunction): Promise<void>
    rejectVehicle(req: Request, res: Response, next: NextFunction): Promise<void>
    updateFare(req: Request, res: Response, next: NextFunction): Promise<void>
    getFares(req: Request, res: Response, next: NextFunction): Promise<void>
    refreshToken(req: Request, res: Response, next: NextFunction): Promise<void>
    getAllComplaints(req: Request, res: Response, next: NextFunction): Promise<void>
    getComplaintInDetail(req: Request, res: Response, next: NextFunction): Promise<void>
    changeComplaintStatus(req: Request, res: Response, next: NextFunction): Promise<void>
    sendWarningMail(req: Request, res: Response, next: NextFunction): Promise<void>
    dashboard(req: Request, res: Response, next: NextFunction): Promise<void>
    rideEarnings(req: Request, res: Response, next: NextFunction): Promise<void>
    premiumUsers(req: Request, res: Response, next: NextFunction): Promise<void>
    driverInfo(req: Request, res: Response, next: NextFunction): Promise<void>
    userInfo(req: Request, res: Response, next: NextFunction): Promise<void>
    driverRideAndRating(req: Request, res: Response, next: NextFunction): Promise<void>
    vehicleInfoByDriverId(req: Request, res: Response, next: NextFunction): Promise<void>
    userRideAndRating(req: Request, res: Response, next: NextFunction): Promise<void>
    rideHistory(req: Request, res: Response, next: NextFunction): Promise<void>
    rideInfo(req: Request, res: Response, next: NextFunction): Promise<void>
    logout(req: Request, res: Response, next: NextFunction): Promise<void>
}
