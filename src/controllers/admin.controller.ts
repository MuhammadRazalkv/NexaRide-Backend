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
import { fareSchema } from '../dtos/request/fare.req.dto';
const maxAge = parseInt(process.env.REFRESH_MAX_AGE as string);
export class AdminController implements IAdminController {
  constructor(private _adminService: IAdminService) {}

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const loginData = validate(loginDTO, req.body);

      const data = await this._adminService.login(loginData.email, loginData.password);
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
      const data = await this._adminService.getUsers(page, search as string, sort as string);

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
      const data = await this._adminService.getPendingDriverCount();

      sendSuccess(res, HttpStatus.OK, { count: data.count }, messages.DATA_FETCH_SUCCESS);
    } catch (error) {
      next(error);
    }
  }

  async changeUserStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this._adminService.changeUserStatus(req.body.id);

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
      const data = await this._adminService.getDrivers(page, search as string, sort as string);

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
      const result = await this._adminService.changeDriverStatus(req.body.id);

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
      const drivers = await this._adminService.getPendingDriversWithVehicle();
      console.log(drivers);

      sendSuccess(res, HttpStatus.OK, { drivers }, messages.DATA_FETCH_SUCCESS);
    } catch (error) {
      next(error);
    }
  }

  async rejectDriver(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const driverId = validate(objectIdSchema, req.body.driverId);
      const result = await this._adminService.rejectDriver(driverId, req.body.reason);

      sendSuccess(res, HttpStatus.OK, { driver: result.driver }, result.message);
    } catch (error) {
      next(error);
    }
  }

  async approveDriver(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const driverId = validate(objectIdSchema, req.body.driverId);
      const result = await this._adminService.approveDriver(driverId);

      sendSuccess(res, HttpStatus.OK, { driver: result.driver }, result.message);
    } catch (error) {
      next(error);
    }
  }

  async getVehicleInfo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vehicleId = validate(objectIdSchema, req.body.driverId);
      const vehicle = await this._adminService.getVehicleInfo(vehicleId);

      sendSuccess(res, HttpStatus.OK, vehicle, messages.DATA_FETCH_SUCCESS);
    } catch (error) {
      next(error);
    }
  }

  async approveVehicle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { category } = req.body;
      const vehicleId = validate(objectIdSchema, req.body.vehicleId);
      const result = await this._adminService.approveVehicle(vehicleId, category);

      sendSuccess(res, HttpStatus.OK, { vehicle: result.vehicle }, result.message);
    } catch (error) {
      next(error);
    }
  }

  async rejectVehicle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vehicleId = validate(objectIdSchema, req.body.vehicleId);
      const result = await this._adminService.rejectVehicle(vehicleId, req.body.reason);

      sendSuccess(res, HttpStatus.OK, { vehicle: result.vehicle }, result.message);
    } catch (error) {
      next(error);
    }
  }

  async updateFare(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = validate(fareSchema, req.body.fare);
      const result = await this._adminService.updateFare(data);

      sendSuccess(res, HttpStatus.OK, { fares: result }, messages.FARE_UPDATED);
    } catch (error) {
      next(error);
    }
  }

  async getFares(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this._adminService.getFares();

      sendSuccess(res, HttpStatus.OK, { fares: result });
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies?.adminRefreshToken;

      if (!refreshToken) {
        throw new AppError(HttpStatus.UNAUTHORIZED, messages.TOKEN_NOT_PROVIDED);
      }

      const response = await this._adminService.refreshToken(refreshToken);

      res.cookie('adminRefreshToken', response.newRefreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: maxAge,
        path: '/',
      });

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
      const filterBy = (req.query.filter as string) || '';
      const search = String(req.query.search);
      const { complaints, total } = await this._adminService.getAllComplaints(
        page,
        filterBy,
        search,
      );

      sendSuccess(res, HttpStatus.OK, { complaints, total });
    } catch (error) {
      next(error);
    }
  }

  async getComplaintInDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const complaintId = validate(objectIdSchema, req.query.complaintId);

      const { complaint, rideInfo } = await this._adminService.getComplaintInDetail(complaintId);
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
      const complaint = await this._adminService.changeComplaintStatus(complaintId, type);
      sendSuccess(res, HttpStatus.OK, { complaint });
    } catch (error) {
      next(error);
    }
  }

  async sendWarningMail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const complaintId = validate(objectIdSchema, req.body.complaintId);
      console.log('Warning Mail', complaintId);

      await this._adminService.sendWarningMail(complaintId);
      sendSuccess(res, HttpStatus.OK, {});
    } catch (error) {
      next(error);
    }
  }

  async dashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await this._adminService.dashBoard();
      sendSuccess(res, HttpStatus.OK, { data });
    } catch (error) {
      next(error);
    }
  }

  async rideEarnings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;

      const data = await this._adminService.rideEarnings(page);
      sendSuccess(res, HttpStatus.OK, data);
    } catch (error) {
      next(error);
    }
  }

  async premiumUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const filter = String(req.query.filter);
      const search = String(req.query.search);
      const sort = String(req.query.sort);
      const data = await this._adminService.premiumUsers(page, filter, search, sort);
      sendSuccess(res, HttpStatus.OK, data);
    } catch (error) {
      next(error);
    }
  }

  async driverInfo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const driverId = validate(objectIdSchema, req.query.driverId);
      const driver = await this._adminService.diverInfo(driverId);
      sendSuccess(res, HttpStatus.OK, { driver });
    } catch (error) {
      next(error);
    }
  }

  async driverRideAndRating(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const driverId = validate(objectIdSchema, req.query.driverId);

      const data = await this._adminService.driverRideAndRating(driverId);

      sendSuccess(res, HttpStatus.OK, data);
    } catch (error) {
      next(error);
    }
  }

  async vehicleInfoByDriverId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const driverId = validate(objectIdSchema, req.query.driverId);

      const vehicle = await this._adminService.vehicleInfoByDriverId(driverId);
      sendSuccess(res, HttpStatus.OK, { vehicle });
    } catch (error) {
      next(error);
    }
  }

  async userInfo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = validate(objectIdSchema, req.query.userId);

      const user = await this._adminService.userInfo(userId);
      sendSuccess(res, HttpStatus.OK, { user });
    } catch (error) {
      next(error);
    }
  }

  async userRideAndRating(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = validate(objectIdSchema, req.query.userId);

      const data = await this._adminService.userRideAndRating(userId);
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
      await this._adminService.logout(refreshToken, accessToken);
      res.clearCookie('adminRefreshToken', {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
      });
      sendSuccess(res, HttpStatus.OK, {});
    } catch (error) {
      next(error);
    }
  }

  async rideHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const sort = (req.query.sort as string) || '';
      const filterBy = (req.query.filter as 'all' | 'ongoing' | 'canceled' | 'completed') || 'all';
      const search = String(req.query.search) || '';
      const data = await this._adminService.rideHistory(page, sort, filterBy, search);
      sendSuccess(res, HttpStatus.OK, data);
    } catch (error) {
      next(error);
    }
  }

  async rideInfo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rideId = validate(objectIdSchema, req.query.rideId);
      const rideInfo = await this._adminService.rideInfo(rideId);
      sendSuccess(res, HttpStatus.OK, { rideInfo });
    } catch (error) {
      next(error);
    }
  }
}
