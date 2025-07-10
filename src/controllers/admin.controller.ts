import { Request, Response, NextFunction } from "express";
import { HttpStatus } from "../constants/httpStatusCodes";
import { messages } from "../constants/httpMessages";
import { IAdminService } from "../services/interfaces/admin.service.interface";
import { IAdminController } from "./interfaces/admin.controller.interface";
import { AppError } from "../utils/appError";
const maxAge = parseInt(process.env.REFRESH_MAX_AGE as string);
export class AdminController implements IAdminController {
  constructor(private adminService: IAdminService) {}

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await this.adminService.login(
        req.body.email,
        req.body.password
      );
      res.cookie("adminRefreshToken", data.refreshToken, {
        httpOnly: true,
        secure: true,
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
        accessToken: data.accessToken,
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
      const page = parseInt(req.query.page as string) || 1;
      const search = req.query.search || "";
      const sort = req.query.sort || "";
      const data = await this.adminService.getUsers(
        page,
        search as string,
        sort as string
      );

      res.status(HttpStatus.OK).json({
        message: messages.DATA_FETCH_SUCCESS,
        users: data.users,
        total: data.total,
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
      console.log(result);
      
      res.status(HttpStatus.OK).json({
        success: true,
        message: result.message,
        user:result.user
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
      const page = parseInt(req.query.page as string) || 1;
      const search = req.query.search || "";
      const sort = req.query.sort || "";
      const data = await this.adminService.getDrivers(
        page,
        search as string,
        sort as string
      );

      res.status(HttpStatus.OK).json({
        message: messages.DATA_FETCH_SUCCESS,
        drivers: data.drivers,
        total: data.total,
      });
    } catch (error) {
      next(error);
    }
  }

  async changeDriverStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await this.adminService.changeDriverStatus(req.body.id);

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
      next(error);
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
      next(error);
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
        message: messages.DATA_FETCH_SUCCESS,
        vehicle,
      });
    } catch (error) {
      next(error);
    }
  }

  async approveVehicle(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { vehicleId, category } = req.body;
      const result = await this.adminService.approveVehicle(
        vehicleId,
        category
      );

      res.status(HttpStatus.OK).json({
        success: true,
        message: result.message,
        vehicle: result.vehicle,
      });
    } catch (error) {
      next(error);
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
      next(error);
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
      next(error);
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
      next(error);
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

      res.status(HttpStatus.CREATED).json({
        message: messages.TOKEN_CREATED,
        accessToken: response.newAccessToken,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllComplaints(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const filterBy = req.query.filter as string;
      const { complaints, total } = await this.adminService.getAllComplaints(
        page,
        filterBy
      );
      res.status(HttpStatus.OK).json({ success: true, complaints, total });
    } catch (error) {
      next(error);
    }
  }

  async getComplaintInDetail(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const complaintId = req.query.complaintId as string;
      if (!complaintId) {
        throw new AppError(HttpStatus.BAD_REQUEST, messages.ID_NOT_PROVIDED);
      }
      const { complaint, rideInfo } =
        await this.adminService.getComplaintInDetail(complaintId);
      res.status(HttpStatus.OK).json({ complaint, rideInfo });
    } catch (error) {
      next(error);
    }
  }

  async changeComplaintStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { complaintId, type } = req.body;
      if (!complaintId || !type) {
        throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
      }
      const complaint = await this.adminService.changeComplaintStatus(
        complaintId,
        type
      );
      res.status(HttpStatus.OK).json({ success: true, complaint });
    } catch (error) {
      next(error);
    }
  }

  async sendWarningMail(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { complaintId } = req.body;
      if (!complaintId) {
        throw new AppError(HttpStatus.BAD_REQUEST, messages.ID_NOT_PROVIDED);
      }
      await this.adminService.sendWarningMail(complaintId);
      res.status(HttpStatus.OK).json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  async dashboard(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const data = await this.adminService.dashBoard();
      res.status(HttpStatus.OK).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async rideEarnings(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;

      const { commissions, totalCount, totalEarnings } =
        await this.adminService.rideEarnings(page);
      res
        .status(HttpStatus.OK)
        .json({ success: true, commissions, totalCount, totalEarnings });
    } catch (error) {
      next(error);
    }
  }

  async premiumUsers(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const filter = String(req.query.filter);
      const { premiumUsers, total, totalEarnings } =
        await this.adminService.premiumUsers(page, filter);
      res
        .status(HttpStatus.OK)
        .json({ success: true, premiumUsers, total, totalEarnings });
    } catch (error) {
      next(error);
    }
  }

  async driverInfo(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const driverId = String(req.query.driverId);
      const driver = await this.adminService.diverInfo(driverId);
      res.status(HttpStatus.OK).json({ success: true, driver });
    } catch (error) {
      next(error);
    }
  }

  async driverRideAndRating(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const driverId = String(req.query.driverId);
      const { totalRides, ratings } =
        await this.adminService.driverRideAndRating(driverId);

      res.status(HttpStatus.OK).json({ success: true, totalRides, ratings });
    } catch (error) {
      next(error);
    }
  }

  async vehicleInfoByDriverId(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const driverId = String(req.query.driverId);
      const vehicle = await this.adminService.vehicleInfoByDriverId(driverId);
      res.status(HttpStatus.OK).json({ success: true, vehicle });
    } catch (error) {
      next(error);
    }
  }

  async userInfo(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = String(req.query.userId);
      const user = await this.adminService.userInfo(userId);
      res.status(HttpStatus.OK).json({ success: true, user });
    } catch (error) {
      next(error);
    }
  }

  async userRideAndRating(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = String(req.query.userId);
      const { totalRides, ratings } = await this.adminService.userRideAndRating(
        userId
      );

      res.status(HttpStatus.OK).json({ success: true, totalRides, ratings });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies.userRefreshToken as string;
      const authHeader = req.headers.authorization;
      const accessToken = authHeader && authHeader.split(" ")[1];
      if (!accessToken) {
        throw new AppError(HttpStatus.BAD_REQUEST, messages.TOKEN_NOT_PROVIDED);
      }
      await this.adminService.logout(refreshToken, accessToken);
      res.clearCookie("adminRefreshToken", {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
      });

      res.status(HttpStatus.OK).json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  async rideHistory(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const sort = (req.query.sort as string) || "";
      console.log(
        'filter query ',req.query.filter
      );
      
      const filterBy =
        (req.query.filter as "all" | "ongoing" | "canceled" | "completed") ||
        "all";
        console.log('Filter by query ',filterBy);
        
      const { history, total } = await this.adminService.rideHistory(
        page,
        sort,
        filterBy
      );

      res.status(HttpStatus.OK).json({ success: true, history, total });
    } catch (error) {
      next(error);
    }
  }

  async rideInfo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rideId = req.query.rideId as string
      if (!rideId) {
        throw new AppError(HttpStatus.BAD_REQUEST,messages.ID_NOT_PROVIDED)
      }
      const rideInfo = await this.adminService.rideInfo(rideId)
      res.status(HttpStatus.OK).json({success:true,rideInfo})
    } catch (error) {
      next(error)
    }
  }
}
