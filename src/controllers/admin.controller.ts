import { Request, Response, NextFunction } from 'express';
import { HttpStatus } from '../constants/httpStatusCodes';
import { messages } from '../constants/httpMessages';
import { IAdminService } from '../services/interfaces/admin.service.interface';
import { IAdminController } from './interfaces/admin.controller.interface';
import { AppError } from '../utils/appError';
// import { loginDTO } from '../dtos/request/auth.req.dto';
import { sendSuccess } from '../utils/response.util';
import { validate } from '../utils/validators/validateZod';
import { IdDTO, objectIdSchema } from '../dtos/request/common.req.dto';
import { FareSchemaDTO } from '../dtos/request/fare.req.dto';
import { ExtendedRequest } from '../middlewares/auth.middleware';
import { LoginDTO } from '../dtos/request/auth.req.dto';
import { QuerySchemaDTO } from '../dtos/request/query.req.dto';
const maxAge = parseInt(process.env.REFRESH_MAX_AGE as string);
export class AdminController implements IAdminController {
  constructor(private _adminService: IAdminService) {}

  async login(req: ExtendedRequest<LoginDTO>, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.validatedBody!;

      const data = await this._adminService.login(email, password);
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

  async getUsers(
    req: ExtendedRequest<any, QuerySchemaDTO>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { page, search, sort } = req.validatedQuery!;
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

  async changeUserStatus(
    req: ExtendedRequest<IdDTO>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await this._adminService.changeUserStatus(req.validatedBody?.id!);

      sendSuccess(res, HttpStatus.OK, { user: result.user }, result.message);
    } catch (error) {
      next(error);
    }
  }

  async getDrivers(
    req: ExtendedRequest<any, QuerySchemaDTO>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { page, search, sort } = req.validatedQuery!;
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

  async changeDriverStatus(
    req: ExtendedRequest<IdDTO>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await this._adminService.changeDriverStatus(req.validatedBody?.id!);

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
      sendSuccess(res, HttpStatus.OK, { drivers }, messages.DATA_FETCH_SUCCESS);
    } catch (error) {
      next(error);
    }
  }

  async rejectDriver(
    req: ExtendedRequest<IdDTO>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const driverId = req.validatedBody?.id!;
      const result = await this._adminService.rejectDriver(driverId, req.body.reason);

      sendSuccess(res, HttpStatus.OK, { driver: result.driver }, result.message);
    } catch (error) {
      next(error);
    }
  }

  async approveDriver(
    req: ExtendedRequest<IdDTO>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const driverId = req.validatedBody?.id!;
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

  async approveVehicle(
    req: ExtendedRequest<IdDTO>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { category } = req.body;
      const vehicleId = req.validatedBody?.id!;
      const result = await this._adminService.approveVehicle(vehicleId, category);

      sendSuccess(res, HttpStatus.OK, { vehicle: result.vehicle }, result.message);
    } catch (error) {
      next(error);
    }
  }

  async rejectVehicle(
    req: ExtendedRequest<IdDTO>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const vehicleId = req.validatedBody?.id!;
      const result = await this._adminService.rejectVehicle(vehicleId, req.body.reason);

      sendSuccess(res, HttpStatus.OK, { vehicle: result.vehicle }, result.message);
    } catch (error) {
      next(error);
    }
  }

  async updateFare(
    req: ExtendedRequest<FareSchemaDTO>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const data = req.validatedBody!;
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

  async getAllComplaints(
    req: ExtendedRequest<any, QuerySchemaDTO>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { page, filter, search } = req.validatedQuery!;
      const { complaints, total } = await this._adminService.getAllComplaints(page, filter, search);

      sendSuccess(res, HttpStatus.OK, { complaints, total });
    } catch (error) {
      next(error);
    }
  }

  async getComplaintInDetail(
    req: ExtendedRequest<any, IdDTO>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const complaintId = req.validatedQuery?.id!;
      console.log('complaintID', complaintId);
      const { complaint, rideInfo } = await this._adminService.getComplaintInDetail(complaintId);
      sendSuccess(res, HttpStatus.OK, { complaint, rideInfo });
    } catch (error) {
      next(error);
    }
  }

  async changeComplaintStatus(
    req: ExtendedRequest<IdDTO>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const complaintId = req.validatedBody?.id!;
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

  async sendWarningMail(
    req: ExtendedRequest<IdDTO>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const complaintId = req.validatedBody?.id!;

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

  async rideEarnings(
    req: ExtendedRequest<any, QuerySchemaDTO>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { page, search } = req.validatedQuery!;
      const data = await this._adminService.rideEarnings(page, search);
      sendSuccess(res, HttpStatus.OK, data);
    } catch (error) {
      next(error);
    }
  }

  async premiumUsers(
    req: ExtendedRequest<any, QuerySchemaDTO>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { filter, page, search, sort } = req.validatedQuery!;
      const data = await this._adminService.premiumUsers(page, filter, search, sort);
      sendSuccess(res, HttpStatus.OK, data);
    } catch (error) {
      next(error);
    }
  }

  async driverInfo(
    req: ExtendedRequest<any, IdDTO>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const driverId = req.validatedQuery?.id!;
      const driver = await this._adminService.diverInfo(driverId);
      sendSuccess(res, HttpStatus.OK, { driver });
    } catch (error) {
      next(error);
    }
  }

  async driverRideAndRating(
    req: ExtendedRequest<any, IdDTO>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const driverId = req.validatedQuery?.id!;

      const data = await this._adminService.driverRideAndRating(driverId);

      sendSuccess(res, HttpStatus.OK, data);
    } catch (error) {
      next(error);
    }
  }

  async vehicleInfoByDriverId(
    req: ExtendedRequest<any, IdDTO>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const driverId = req.validatedQuery?.id!;

      const vehicle = await this._adminService.vehicleInfoByDriverId(driverId);
      sendSuccess(res, HttpStatus.OK, { vehicle });
    } catch (error) {
      next(error);
    }
  }

  async userInfo(
    req: ExtendedRequest<any, IdDTO>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.validatedQuery?.id!;

      const user = await this._adminService.userInfo(userId);
      sendSuccess(res, HttpStatus.OK, { user });
    } catch (error) {
      next(error);
    }
  }

  async userRideAndRating(
    req: ExtendedRequest<any, IdDTO>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.validatedQuery?.id!;

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

  async rideHistory(
    req: ExtendedRequest<any, QuerySchemaDTO>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { filter, page, search, sort } = req.validatedQuery!;
      const data = await this._adminService.rideHistory(
        page,
        sort,
        (filter as 'all' | 'ongoing' | 'canceled' | 'completed') || 'all',
        search,
      );
      sendSuccess(res, HttpStatus.OK, data);
    } catch (error) {
      next(error);
    }
  }

  async rideInfo(
    req: ExtendedRequest<any, IdDTO>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const rideId = req.validatedQuery?.id!;
      const rideInfo = await this._adminService.rideInfo(rideId);
      sendSuccess(res, HttpStatus.OK, { rideInfo });
    } catch (error) {
      next(error);
    }
  }
}
