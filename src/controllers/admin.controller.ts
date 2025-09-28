import { Request, Response, NextFunction } from 'express';
import { HttpStatus } from '../constants/httpStatusCodes';
import { messages } from '../constants/httpMessages';
import { IAdminService } from '../services/interfaces/admin.service.interface';
import { IAdminController } from './interfaces/admin.controller.interface';
import { AppError } from '../utils/appError';
import { loginDTO } from '../dtos/request/auth.req.dto';
import { sendSuccess } from '../utils/response.util';
import { validate } from '../utils/validators/validateZod';
import { objectIdSchema } from '../dtos/request/common.req.dto';
const maxAge = parseInt(process.env.REFRESH_MAX_AGE as string);
export class AdminController implements IAdminController {
  constructor(private adminService: IAdminService) {}

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const loginData = validate(loginDTO, req.body);

      const data = await this.adminService.login(loginData.email, loginData.password);
      res.cookie('adminRefreshToken', data.refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: maxAge,
        path: '/',
      });
      sendSuccess(res, HttpStatus.OK, { accessToken: data.accessToken }, messages.LOGIN_SUCCESS);
    } catch (error) {
      next(error);
    }
  }

  async getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const search = req.query.search || '';
      const sort = req.query.sort || '';
      const data = await this.adminService.getUsers(page, search as string, sort as string);

      // res.status(HttpStatus.OK).json({
      //   message: messages.DATA_FETCH_SUCCESS,
      //   users: data.users,
      //   total: data.total,
      // });
      sendSuccess(
        res,
        HttpStatus.OK,
        { users: data.users, total: data.total },
        messages.DATA_FETCH_SUCCESS,
      );
    } catch (error) {
      next(error);
    }
  }

  async getPendingDriverCount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await this.adminService.getPendingDriverCount();

      // res.status(HttpStatus.OK).json({
      //   message: messages.DATA_FETCH_SUCCESS,
      //   count: data.count,
      // });
      sendSuccess(res, HttpStatus.OK, { count: data.count }, messages.DATA_FETCH_SUCCESS);
    } catch (error) {
      next(error);
    }
  }

  async changeUserStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.adminService.changeUserStatus(req.body.id);

      // res.status(HttpStatus.OK).json({
      //   success: true,
      //   message: result.message,
      //   user: result.user,
      // });
      sendSuccess(res, HttpStatus.OK, { user: result.user }, result.message);
    } catch (error) {
      next(error);
    }
  }

  async getDrivers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const search = req.query.search || '';
      const sort = req.query.sort || '';
      const data = await this.adminService.getDrivers(page, search as string, sort as string);

      // res.status(HttpStatus.OK).json({
      //   message: messages.DATA_FETCH_SUCCESS,
      //   drivers: data.drivers,
      //   total: data.total,
      // });
      sendSuccess(
        res,
        HttpStatus.OK,
        { drivers: data.drivers, total: data.total },
        messages.DATA_FETCH_SUCCESS,
      );
    } catch (error) {
      next(error);
    }
  }

  async changeDriverStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.adminService.changeDriverStatus(req.body.id);

      // res.status(HttpStatus.OK).json({
      //   success: true,
      //   message: result.message,
      //   driver: result.driver,
      // });
      sendSuccess(res, HttpStatus.OK, { driver: result.driver }, result.message);
    } catch (error) {
      next(error);
    }
  }

  async getPendingDriversWithVehicle(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const drivers = await this.adminService.getPendingDriversWithVehicle();
      console.log(drivers);

      // res.status(HttpStatus.OK).json({
      //   success: true,
      //   message: messages.DATA_FETCH_SUCCESS,
      //   drivers: data.drivers,
      // });
      sendSuccess(res, HttpStatus.OK, { drivers }, messages.DATA_FETCH_SUCCESS);
    } catch (error) {
      next(error);
    }
  }

  async rejectDriver(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const driverId = validate(objectIdSchema, req.body.driverId);
      const result = await this.adminService.rejectDriver(driverId, req.body.reason);

      // res.status(HttpStatus.OK).json({
      //   success: true,
      //   message: result.message,
      //   driver: result.driver,
      // });
      sendSuccess(res, HttpStatus.OK, { driver: result.driver }, result.message);
    } catch (error) {
      next(error);
    }
  }

  async approveDriver(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const driverId = validate(objectIdSchema, req.body.driverId);
      const result = await this.adminService.approveDriver(driverId);

      // res.status(HttpStatus.OK).json({
      //   success: true,
      //   message: result.message,
      //   driver: result.driver,
      // });
      sendSuccess(res, HttpStatus.OK, { driver: result.driver }, result.message);
    } catch (error) {
      next(error);
    }
  }

  async getVehicleInfo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vehicleId = validate(objectIdSchema, req.body.driverId);
      const vehicle = await this.adminService.getVehicleInfo(vehicleId);

      // res.status(HttpStatus.OK).json({
      //   success: true,
      //   message: messages.DATA_FETCH_SUCCESS,
      //   vehicle,
      // });
      sendSuccess(res, HttpStatus.OK, vehicle, messages.DATA_FETCH_SUCCESS);
    } catch (error) {
      next(error);
    }
  }

  async approveVehicle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { category } = req.body;
      const vehicleId = validate(objectIdSchema, req.body.vehicleId);
      const result = await this.adminService.approveVehicle(vehicleId, category);

      // res.status(HttpStatus.OK).json({
      //   success: true,
      //   message: result.message,
      //   vehicle: result.vehicle,
      // });
      sendSuccess(res, HttpStatus.OK, { vehicle: result.vehicle }, result.message);
    } catch (error) {
      next(error);
    }
  }

  async rejectVehicle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vehicleId = validate(objectIdSchema, req.body.vehicleId);
      const result = await this.adminService.rejectVehicle(vehicleId, req.body.reason);

      // res.status(HttpStatus.OK).json({
      //   success: true,
      //   message: result.message,
      //   vehicle: result.vehicle,
      // });
      sendSuccess(res, HttpStatus.OK, { vehicle: result.vehicle }, result.message);
    } catch (error) {
      next(error);
    }
  }

  async updateFare(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.adminService.updateFare(req.body.fare);

      // res.status(HttpStatus.OK).json({
      //   success: true,
      //   fares: result,
      //   message: messages.FARE_UPDATED,
      // });
      sendSuccess(res, HttpStatus.OK, { fares: result }, messages.FARE_UPDATED);
    } catch (error) {
      next(error);
    }
  }

  async getFares(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.adminService.getFares();

      // res.status(HttpStatus.OK).json({
      //   fares: result,
      //   success: true,
      // });
      sendSuccess(res, HttpStatus.OK, { fares: result });
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies?.adminRefreshToken;

      if (!refreshToken) {
        // // res.status(HttpStatus.UNAUTHORIZED).json({ message: messages.TOKEN_NOT_PROVIDED });
        // sendError(res, HttpStatus.UNAUTHORIZED, messages.TOKEN_NOT_PROVIDED);
        // return;
        throw new AppError(HttpStatus.UNAUTHORIZED, messages.TOKEN_NOT_PROVIDED);
      }

      const response = await this.adminService.refreshToken(refreshToken);

      res.cookie('adminRefreshToken', response.newRefreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: maxAge,
        path: '/',
      });

      // res.status(HttpStatus.CREATED).json({
      //   message: messages.TOKEN_CREATED,
      //   accessToken: response.newAccessToken,
      // });
      sendSuccess(
        res,
        HttpStatus.OK,
        { accessToken: response.newAccessToken },
        messages.TOKEN_CREATED,
      );
    } catch (error) {
      next(error);
    }
  }

  async getAllComplaints(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const filterBy = req.query.filter as string;
      const { complaints, total } = await this.adminService.getAllComplaints(page, filterBy);
      // res.status(HttpStatus.OK).json({ success: true, complaints, total });
      sendSuccess(res, HttpStatus.OK, { complaints, total });
    } catch (error) {
      next(error);
    }
  }

  async getComplaintInDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const complaintId = validate(objectIdSchema, req.query.complaintId);

      const { complaint, rideInfo } = await this.adminService.getComplaintInDetail(complaintId);
      // res.status(HttpStatus.OK).json({ complaint, rideInfo });
      sendSuccess(res, HttpStatus.OK, { complaint, rideInfo });
    } catch (error) {
      next(error);
    }
  }

  async changeComplaintStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const complaintId = validate(objectIdSchema, req.body.complaintId);
      const { type } = req.body;
      if (!complaintId || !type) {
        throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
      }
      const complaint = await this.adminService.changeComplaintStatus(complaintId, type);
      // res.status(HttpStatus.OK).json({ success: true, complaint });
      sendSuccess(res, HttpStatus.OK, { complaint });
    } catch (error) {
      next(error);
    }
  }

  async sendWarningMail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const complaintId = validate(objectIdSchema, req.body.complaintId);

      await this.adminService.sendWarningMail(complaintId);
      // res.status(HttpStatus.OK).json({ success: true });
      sendSuccess(res, HttpStatus.OK, {});
    } catch (error) {
      next(error);
    }
  }

  async dashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await this.adminService.dashBoard();
      // res.status(HttpStatus.OK).json({ success: true, data });

      sendSuccess(res, HttpStatus.OK, { data });
    } catch (error) {
      next(error);
    }
  }

  async rideEarnings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;

      const data = await this.adminService.rideEarnings(page);
      sendSuccess(res, HttpStatus.OK, data);

      // res.status(HttpStatus.OK).json({ success: true, commissions, totalCount, totalEarnings });
    } catch (error) {
      next(error);
    }
  }

  async premiumUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const filter = String(req.query.filter);
      const data = await this.adminService.premiumUsers(page, filter);
      sendSuccess(res, HttpStatus.OK, data);

      // res.status(HttpStatus.OK).json({ success: true, premiumUsers, total, totalEarnings });
    } catch (error) {
      next(error);
    }
  }

  async driverInfo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const driverId = validate(objectIdSchema, req.query.driverId);
      const driver = await this.adminService.diverInfo(driverId);
      sendSuccess(res, HttpStatus.OK, { driver });
    } catch (error) {
      next(error);
    }
  }

  async driverRideAndRating(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const driverId = validate(objectIdSchema, req.query.driverId);

      const data = await this.adminService.driverRideAndRating(driverId);

      // res.status(HttpStatus.OK).json({ success: true, totalRides, ratings });
      sendSuccess(res, HttpStatus.OK, data);
    } catch (error) {
      next(error);
    }
  }

  async vehicleInfoByDriverId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const driverId = validate(objectIdSchema, req.query.driverId);

      const vehicle = await this.adminService.vehicleInfoByDriverId(driverId);
      // res.status(HttpStatus.OK).json({ success: true, vehicle });
      sendSuccess(res, HttpStatus.OK, { vehicle });
    } catch (error) {
      next(error);
    }
  }

  async userInfo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // const userId = String(req.query.userId);
      const userId = validate(objectIdSchema, req.query.userId);

      const user = await this.adminService.userInfo(userId);
      // res.status(HttpStatus.OK).json({ success: true, user });
      sendSuccess(res, HttpStatus.OK, { user });
    } catch (error) {
      next(error);
    }
  }

  async userRideAndRating(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = validate(objectIdSchema, req.query.userId);

      const data = await this.adminService.userRideAndRating(userId);

      // res.status(HttpStatus.OK).json({ success: true, totalRides, ratings });
      sendSuccess(res, HttpStatus.OK, data);
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies.userRefreshToken as string;
      const authHeader = req.headers.authorization;
      const accessToken = authHeader && authHeader.split(' ')[1];
      if (!accessToken) {
        throw new AppError(HttpStatus.BAD_REQUEST, messages.TOKEN_NOT_PROVIDED);
      }
      await this.adminService.logout(refreshToken, accessToken);
      res.clearCookie('adminRefreshToken', {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
      });

      // res.status(HttpStatus.OK).json({ success: true });
      sendSuccess(res, HttpStatus.OK, {});
    } catch (error) {
      next(error);
    }
  }

  async rideHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const sort = (req.query.sort as string) || '';
      console.log('filter query ', req.query.filter);

      const filterBy = (req.query.filter as 'all' | 'ongoing' | 'canceled' | 'completed') || 'all';
      console.log('Filter by query ', filterBy);

      const data = await this.adminService.rideHistory(page, sort, filterBy);
      sendSuccess(res, HttpStatus.OK, data);

      // res.status(HttpStatus.OK).json({ success: true, history, total });
    } catch (error) {
      next(error);
    }
  }

  async rideInfo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rideId = validate(objectIdSchema, req.query.rideId);
      const rideInfo = await this.adminService.rideInfo(rideId);
      // res.status(HttpStatus.OK).json({ success: true, rideInfo });
      sendSuccess(res, HttpStatus.OK, { rideInfo });
    } catch (error) {
      next(error);
    }
  }
}
