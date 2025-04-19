import { Request,Response,NextFunction } from "express";
export interface IAdminController {
    login(req: Request, res: Response, next: NextFunction): Promise<void>
    getUsers(req: Request, res: Response, next: NextFunction): Promise<void>
    getPendingDriverCount(req: Request, res: Response, next: NextFunction): Promise<void>
    changeUserStatus(req: Request, res: Response, next: NextFunction): Promise<void>
    getDrivers(req: Request, res: Response, next: NextFunction): Promise<void>
    toggleBlockUnblockDriver(req: Request, res: Response, next: NextFunction): Promise<void>
    getPendingDriversWithVehicle(req: Request, res: Response, next: NextFunction): Promise<void>
    rejectDriver(req: Request, res: Response, next: NextFunction): Promise<void>
    approveDriver(req: Request, res: Response, next: NextFunction): Promise<void>
    getVehicleInfo(req: Request, res: Response, next: NextFunction): Promise<void>
    approveVehicle(req: Request, res: Response, next: NextFunction): Promise<void>
    rejectVehicle(req: Request, res: Response, next: NextFunction): Promise<void>
    updateFare(req: Request, res: Response, next: NextFunction): Promise<void>
    getFares(req: Request, res: Response, next: NextFunction): Promise<void>
    refreshToken(req: Request, res: Response, next: NextFunction): Promise<void>
    
}
