import { Request, Response, NextFunction } from 'express';
import IDriverController from './interfaces/driver.controller.interface';
import { ExtendedRequest } from '../middlewares/auth.middleware';
import { IDriverService } from '../services/interfaces/driver.service.interface';
import { IVehicleService } from '../services/interfaces/vehicle.interface';
import { HttpStatus } from '../constants/httpStatusCodes';
import { messages } from '../constants/httpMessages';
import { AppError } from '../utils/appError';
import { validate } from '../utils/validators/validateZod';
import {
  DriverReApplyDTO,
  DriverSchemaDTO,
  EmailDTO,
  emailOTPValidation,
  GoogleAuthDTO,
  LoginDTO,
  PasswordResetDTO,
  UpdateDriverInfoDTO,
  updateDriverInfoDTO,
  VehicleSchemaDTO,
} from '../dtos/request/auth.req.dto';
import { sendSuccess } from '../utils/response.util';
import { IdDTO, objectIdSchema } from '../dtos/request/common.req.dto';

export class DriverController implements IDriverController {
  constructor(
    private _driverService: IDriverService,
    private _vehicleService: IVehicleService,
  ) {}
  async emailVerification(
    req: ExtendedRequest<EmailDTO>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const email = req.validatedBody?.email!;
      await this._driverService.emailVerification(email);
      sendSuccess(res, HttpStatus.CREATED, {}, messages.OTP_SENT_SUCCESS);
    } catch (error) {
      next(error);
    }
  }

  async verifyOTP(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = validate(emailOTPValidation, {
        email: req.body.email,
        otp: req.body.otp,
      });
      await this._driverService.verifyOTP(data.email, data.otp);
      sendSuccess(res, HttpStatus.OK, {}, messages.EMAIL_VERIFICATION_SUCCESS);
    } catch (error) {
      next(error);
    }
  }

  async reSendOTP(
    req: ExtendedRequest<EmailDTO>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const email = req.validatedBody?.email!;
      await this._driverService.reSendOTP(email);
      sendSuccess(res, HttpStatus.OK, {}, messages.OTP_SENT_SUCCESS);
    } catch (error) {
      next(error);
    }
  }

  async addInfo(
    req: ExtendedRequest<DriverSchemaDTO>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const data = req.validatedBody!;
      const response = await this._driverService.addInfo(data);

      sendSuccess(
        res,
        HttpStatus.CREATED,
        { driverId: response.driverId },
        messages.DRIVER_CREATION_SUCCESS,
      );
    } catch (error) {
      next(error);
    }
  }

  async addVehicle(
    req: ExtendedRequest<VehicleSchemaDTO>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const data = req.validatedBody!;
      const response = await this._vehicleService.addVehicle(data);

      sendSuccess(res, HttpStatus.CREATED, { response }, messages.VEHICLE_CREATION_SUCCESS);
    } catch (error) {
      next(error);
    }
  }

  async login(req: ExtendedRequest<LoginDTO>, res: Response, next: NextFunction): Promise<void> {
    try {
      const loginData = req.validatedBody!;
      const data = await this._driverService.login(loginData);
      res.cookie('driverRefreshToken', data.refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      sendSuccess(
        res,
        HttpStatus.CREATED,
        { accessToken: data.accessToken, driver: data.user },
        messages.LOGIN_SUCCESS,
      );
    } catch (error) {
      next(error);
    }
  }

  async checkGoogleAuth(
    req: ExtendedRequest<GoogleAuthDTO>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { email, id } = req.validatedBody!;
      const response = await this._driverService.checkGoogleAuth(id, email);
      sendSuccess(res, HttpStatus.OK, {}, response);
    } catch (error) {
      next(error);
    }
  }

  async getStatus(req: ExtendedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.id!;
      const response = await this._driverService.getStatus(id);
      sendSuccess(res, HttpStatus.OK, {
        driverStatus: response.driverStatus,
        vehicleStatus: response.vehicleStatus,
      });
    } catch (error) {
      next(error);
    }
  }

  async rejectReason(req: ExtendedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.id!;
      const reason = await this._driverService.rejectReason(id);
      sendSuccess(res, HttpStatus.OK, { reason });
    } catch (error) {
      next(error);
    }
  }

  async reApplyDriver(
    req: ExtendedRequest<DriverReApplyDTO>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const id = req.id!;
      const data = req.validatedBody!;

      const updatedData = await this._driverService.reApplyDriver(id, data);
      sendSuccess(
        res,
        HttpStatus.OK,
        { driver: updatedData },
        messages.SUBMITTED_FOR_REVERIFICATION,
      );
    } catch (error) {
      next(error);
    }
  }

  async vehicleRejectReason(
    req: ExtendedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const id = req.id!;
      const response = await this._vehicleService.rejectReason(id);

      sendSuccess(res, HttpStatus.OK, { response });
    } catch (error) {
      next(error);
    }
  }

  async reApplyVehicle(
    req: ExtendedRequest<VehicleSchemaDTO>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const id = req.id!;
      const validatedData = req.validatedBody!;
      const response = await this._vehicleService.reApplyVehicle(id, validatedData);
      sendSuccess(
        res,
        HttpStatus.OK,
        { driver: response.driver },
        messages.SUBMITTED_FOR_REVERIFICATION,
      );
    } catch (error) {
      next(error);
    }
  }

  async googleLogin(
    req: ExtendedRequest<EmailDTO>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { googleId, profilePic } = req.body;
      const email = req.validatedBody?.email!;
      const data = await this._driverService.googleLogin(googleId, email, profilePic);

      res.cookie('driverRefreshToken', data.refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      sendSuccess(
        res,
        HttpStatus.OK,
        { accessToken: data.accessToken, driver: data.user },
        messages.LOGIN_SUCCESS,
      );
    } catch (error) {
      next(error);
    }
  }

  async requestPasswordReset(
    req: ExtendedRequest<EmailDTO>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const email = req.validatedBody?.email!;
      await this._driverService.requestPasswordReset(email);
      sendSuccess(res, HttpStatus.OK, {}, messages.PASSWORD_RESET_LINK_SENT);
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(
    req: ExtendedRequest<PasswordResetDTO>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id, token, password } = req.validatedBody!;
      await this._driverService.resetPassword(id, token, password);
      sendSuccess(res, HttpStatus.OK, {}, messages.PASSWORD_RESET_SUCCESS);
    } catch (error) {
      next(error);
    }
  }

  async getDriverInfo(req: ExtendedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.id!;
      const driver = await this._driverService.getDriverInfo(id);

      sendSuccess(res, HttpStatus.OK, { driver });
    } catch (error) {
      next(error);
    }
  }

  async updateDriverInfo(
    req: ExtendedRequest<UpdateDriverInfoDTO>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const id = req.id!;

      const { field, value } = req.validatedBody!;
      const updatedFiled = await this._driverService.updateDriverInfo(
        id,
        field as keyof DriverSchemaDTO,
        value,
      );

      sendSuccess(res, HttpStatus.OK, { updatedFiled }, messages.SUBMITTED_FOR_REVERIFICATION);
    } catch (error) {
      next(error);
    }
  }

  async updateAvailability(req: ExtendedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.id!;
      await this._driverService.toggleAvailability(id);

      sendSuccess(res, HttpStatus.OK, {});
    } catch (error) {
      next(error);
    }
  }

  async getCurrentLocation(req: ExtendedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.id!;
      const location = await this._driverService.getCurrentLocation(id);
      sendSuccess(res, HttpStatus.OK, { location });
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies?.driverRefreshToken;

      if (!refreshToken) {
        throw new AppError(HttpStatus.UNAUTHORIZED, messages.TOKEN_NOT_PROVIDED);
      }

      const response = await this._driverService.refreshToken(refreshToken);

      res.cookie('driverRefreshToken', response.newRefreshToken, {
        httpOnly: true,
        secure: process.env.PRODUCTION === 'production',
        sameSite: 'strict',
        maxAge: parseInt(process.env.REFRESH_MAX_AGE as string),
      });

      sendSuccess(
        res,
        HttpStatus.CREATED,
        { accessToken: response.newAccessToken },
        messages.TOKEN_CREATED,
      );
    } catch (error) {
      next(error);
    }
  }

  async updateProfilePic(req: ExtendedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const image = req.body.image;
      const id = req.id!;
      const newImg = await this._driverService.updateProfilePic(id, image);

      sendSuccess(res, HttpStatus.OK, { image: newImg });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: ExtendedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.id!;
      const refreshToken = req.cookies.userRefreshToken as string;
      const authHeader = req.headers.authorization;
      const accessToken = authHeader && authHeader.split(' ')[1];
      if (!accessToken) {
        throw new AppError(HttpStatus.BAD_REQUEST, messages.TOKEN_NOT_PROVIDED);
      }
      await this._driverService.logout(id, refreshToken, accessToken);
      res.clearCookie('driverRefreshToken', {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
      });

      sendSuccess(res, HttpStatus.OK, {});
    } catch (error) {
      next(error);
    }
  }
}
