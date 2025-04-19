import { Request, Response, NextFunction } from "express";
import { HttpStatus } from "../constants/httpStatusCodes";
import { messages } from "../constants/httpMessages";
import { IAdminService } from "../services/interfaces/admin.service.interface";
import { IAdminController } from "./interfaces/admin.controller.interface";
const maxAge = parseInt(process.env.REFRESH_MAX_AGE as string)
const accessMaxAge = parseInt(process.env.ACCESS_MAX_AGE as string)
export class AdminController implements IAdminController {
  constructor(private adminService:IAdminService){}

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
   
    try {
      const data = await this.adminService.login(req.body.email, req.body.password);
      res.cookie("adminRefreshToken", data.refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: maxAge,
        path: "/",
      });

      // res.cookie("adminAccessToken", data.accessToken, {
      //   httpOnly: true,
      //   secure: false,
      //   sameSite: "lax",
      //   maxAge: accessMaxAge,
      //   path: "/",
      // });

      res.status(HttpStatus.OK).json({
        message: messages.LOGIN_SUCCESS,
        accessToken:data.accessToken
      });
    } catch (error) {
      next(error);
    }
  }

  async getUsers( 
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const page = parseInt(req.query.page as string)|| 1
      const search = req.query.search || ''
      const sort = req.query.sort || ''
      const data = await this.adminService.getUsers(page,search as string,sort as string);
     

      res.status(HttpStatus.OK).json({
        message: messages.DATA_FETCH_SUCCESS,
        users: data.users,
        total:data.total
      });
    } catch (error) {
      next(error);
    }
  }

  async getPendingDriverCount( 
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const data = await this.adminService.getPendingDriverCount();
     

      res.status(HttpStatus.OK).json({
        message: messages.DATA_FETCH_SUCCESS,
        count: data.count,
      });
    } catch (error) {
      next(error);
    }
  }

  async changeUserStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await this.adminService.changeUserStatus(req.body.id);

      res.status(HttpStatus.OK).json({
        success: true,
        message: result.message,
        user: result.user,
      });
    } catch (error) {
      next(error);
    }
  }

  async getDrivers(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const page = parseInt(req.query.page as string)|| 1
      const search = req.query.search || ''
      const sort = req.query.sort || ''
      const data = await this.adminService.getDrivers(page,search as string,sort as string);

      res.status(HttpStatus.OK).json({
        message: messages.DATA_FETCH_SUCCESS,
        drivers: data.drivers,
        total:data.total,
      });
    } catch (error) {
      next(error);
    }
  }

  async toggleBlockUnblockDriver(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await this.adminService.toggleBlockUnblockDriver(req.body.id);

      res.status(HttpStatus.OK).json({
        success: true,
        message: result.message,
        driver: result.driver,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPendingDriversWithVehicle(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const data = await this.adminService.getPendingDriversWithVehicle();
      console.log(data.drivers);

      res.status(HttpStatus.OK).json({
        success: true,
        message: messages.DATA_FETCH_SUCCESS,
        drivers: data.drivers,
      });
    } catch (error) {
      next(error);
    }
  }

  async rejectDriver(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await this.adminService.rejectDriver(
        req.body.driverId,
        req.body.reason
      );

      res.status(HttpStatus.OK).json({
        success: true,
        message: result.message,
        driver: result.driver,
      });
    } catch (error) {
     next(error)
    }
  }

  async approveDriver(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await this.adminService.approveDriver(req.body.driverId);

      res.status(HttpStatus.OK).json({
        success: true,
        message: result.message,
        driver: result.driver,
      });
    } catch (error) {
      next(error)
    }
  }

  async getVehicleInfo(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
    

      const vehicle = await this.adminService.getVehicleInfo(req.params.id);

      res.status(HttpStatus.OK).json({
        success: true,
        message:messages.DATA_FETCH_SUCCESS,
        vehicle,
      });
    } catch (error) {
     next(error)
    }
  }

  async approveVehicle(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { vehicleId, category } = req.body;
      const result = await this.adminService.approveVehicle(vehicleId, category);

      res.status(HttpStatus.OK).json({
        success: true,
        message: result.message,
        vehicle: result.vehicle,
      });
    } catch (error) {
     next(error)
    }
  }

  async rejectVehicle(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await this.adminService.rejectVehicle(
        req.body.vehicleId,
        req.body.reason
      );

      res.status(HttpStatus.OK).json({
        success: true,
        message: result.message,
        vehicle: result.vehicle,
      });
    } catch (error) {
     next(error)
    }
  }

  async updateFare(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await this.adminService.updateFare(req.body.fare);

      res.status(HttpStatus.OK).json({
        success: true,
        fares: result,
        message: messages.FARE_UPDATED,
      });
    } catch (error) {
     next(error)
    }
  }

  async getFares(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await this.adminService.getFares();

      res.status(HttpStatus.OK).json({
        fares: result,
        success: true,
      });
    } catch (error) {
      next(error)
    }
  }

   async refreshToken(
      req: Request,
      res: Response,
      next: NextFunction
    ): Promise<void> {
      try {
        const refreshToken = req.cookies?.adminRefreshToken;
  
        if (!refreshToken) {
          res
            .status(HttpStatus.UNAUTHORIZED)
            .json({ message: messages.TOKEN_NOT_PROVIDED });
          return;
        }
  
        const response = await this.adminService.refreshToken(refreshToken);
  
        res.cookie("adminRefreshToken", response.newRefreshToken, {
          httpOnly: true,
          secure: false,
          sameSite: "lax",
          maxAge: maxAge,
          path: "/",
        });
  
        // res.cookie("adminAccessToken", response.newAccessToken, {
        //   httpOnly: true,
        //   secure: false,
        //   sameSite: "lax",
        //   maxAge: accessMaxAge,
        //   path: "/",
        // });
  
        res.status(HttpStatus.CREATED).json({
          message: messages.TOKEN_CREATED,
          accessToken: response.newAccessToken,
        });
      } catch (error) {
        next(error);
      }
    }
}

