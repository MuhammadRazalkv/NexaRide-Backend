import { Request, Response, NextFunction } from "express";
import IDriverController from "./interfaces/driver.controller.interface";
import { ExtendedRequest } from "../middlewares/auth.middleware";
import cloudinary from "../utils/cloudinary";
import { IDriverService } from "../services/interfaces/driver.service.interface";
import { IVehicleService } from "../services/interfaces/vehicle.interface";
import { HttpStatus } from "../constants/httpStatusCodes";
import { messages } from "../constants/httpMessages";
import { AppError } from "../utils/appError";

export class DriverController implements IDriverController {
  constructor(
    private driverService: IDriverService,
    private vehicleService: IVehicleService
  ) {}
  async emailVerification(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const email = req.body.email;
      await this.driverService.emailVerification(email);
      res
        .status(HttpStatus.CREATED)
        .json({ message: messages.OTP_SENT_SUCCESS });
    } catch (error) {
      next(error);
    }
  }

  async verifyOTP(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { email, otp } = req.body;
      await this.driverService.verifyOTP(email, otp);
      res
        .status(HttpStatus.OK)
        .json({ message: messages.EMAIL_VERIFICATION_SUCCESS });
    } catch (error) {
      next(error);
    }
  }

  async reSendOTP(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { email } = req.body;
      await this.driverService.reSendOTP(email);
      res
        .status(HttpStatus.CREATED)
        .json({ message: messages.OTP_SENT_SUCCESS });
    } catch (error) {
      next(error);
    }
  }

  async addInfo(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response = await this.driverService.addInfo(req.body.data);

      res.status(HttpStatus.CREATED).json({
        message: messages.DRIVER_CREATION_SUCCESS,
        driverId: response.driverId,
      });
    } catch (error) {
      next(error);
    }
  }

  async addVehicle(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      console.log("addVehicle reached", req.body.data);

      const response = await this.vehicleService.addVehicle(req.body.data);
      console.log("response ", response);

      res.status(HttpStatus.CREATED).json({
        message: messages.VEHICLE_CREATION_SUCCESS,
        driver: response.driver,
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await this.driverService.login(req.body);
      res.cookie("driverRefreshToken", data.refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(HttpStatus.OK).json({
        message: messages.LOGIN_SUCCESS,
        accessToken: data.accessToken,
        driver: data.driver,
      });
    } catch (error) {
      next(error);
    }
  }

  async checkGoogleAuth(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const { id, email } = req.body;

    try {
      const response = await this.driverService.checkGoogleAuth(id, email);
      if (response) {
        res.status(HttpStatus.OK).json({
          message: response,
          success: true,
        });
        return;
      } else {
        res.status(HttpStatus.OK).json({ success: false });
      }
    } catch (error) {
      next(error);
    }
  }

  async getStatus(
    req: ExtendedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.id) {
        throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
      }
      const response = await this.driverService.getStatus(req.id);

      res.status(HttpStatus.OK).json({
        driverStatus: response.driverStatus,
        vehicleStatus: response.vehicleStatus,
        // available: response.isAvailable,
      });
    } catch (error) {
      next(error);
    }
  }

  async rejectReason(
    req: ExtendedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.id) {
        throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
      }
      const reason = await this.driverService.rejectReason(req.id);

      res.status(HttpStatus.OK).json({
        reason,
      });
    } catch (error) {
      next(error);
    }
  }

  async reApplyDriver(
    req: ExtendedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      console.log("addInfo reached", req.body);
      if (!req.id) {
        throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
      }
      const updatedData = await this.driverService.reApplyDriver(
        req.id,
        req.body
      );

      res.status(HttpStatus.OK).json({
        message: messages.SUBMITTED_FOR_REVERIFICATION,
        driver: updatedData,
      });
    } catch (error) {
      next(error);
    }
  }

  async vehicleRejectReason(
    req: ExtendedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.id) {
        throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
      }
      const response = await this.vehicleService.rejectReason(req.id);

      res.status(HttpStatus.OK).json({
        reason: response.reason,
      });
    } catch (error) {
      next(error);
    }
  }

  async reApplyVehicle(
    req: ExtendedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.id) {
        throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
      }
      const response = await this.vehicleService.reApplyVehicle(
        req.id,
        req.body.data
      );

      res.status(HttpStatus.OK).json({
        message: messages.SUBMITTED_FOR_REVERIFICATION,
        driver: response.driver,
      });
    } catch (error) {
      next(error);
    }
  }

  //!Not need
  async upload(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const img = req.body.imgUrl;
      const res = await cloudinary.uploader.upload(img, {
        folder: "/demo",
      });
      console.log(res);
    } catch (error) {
      console.log(error);
    }
  }

  async googleLogin(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { email, googleId, profilePic } = req.body;

      const data = await this.driverService.googleLogin(
        googleId,
        email,
        profilePic
      );

      res.cookie("driverRefreshToken", data.refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      res.status(HttpStatus.OK).json({
        message: messages.LOGIN_SUCCESS,
        accessToken: data.accessToken,
        driver: data.driver,
      });
    } catch (error) {
      next(error);
    }
  }

  async requestPasswordReset(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      await this.driverService.requestPasswordReset(req.body.email);
      res.status(HttpStatus.OK).json({
        message: messages.PASSWORD_RESET_LINK_SENT,
      });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id, token, password } = req.body;
      await this.driverService.resetPassword(id, token, password);
      res
        .status(HttpStatus.OK)
        .json({ message: messages.PASSWORD_RESET_SUCCESS });
    } catch (error) {
      next(error);
    }
  }

  async getDriverInfo(
    req: ExtendedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.id) {
        throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
      }
      const response = await this.driverService.getDriverInfo(req.id);

      res.status(HttpStatus.OK).json({ driver: response });
    } catch (error) {
      next(error);
    }
  }

  async updateDriverInfo(
    req: ExtendedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.id) {
        throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
      }

      const { field, value } = req.body;

      const response = await this.driverService.updateDriverInfo(
        req.id,
        field,
        value
      );

      res.status(HttpStatus.OK).json({ success: true, updatedFiled: response });
    } catch (error) {
      next(error);
    }
  }

  async updateAvailability(
    req: ExtendedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.id) {
        throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
      }

      const response = await this.driverService.toggleAvailability(req.id);

      res.status(HttpStatus.OK).json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  async getCurrentLocation(
    req: ExtendedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const driverId = req.id;
      if (!driverId) {
        throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
      }
      const location = await this.driverService.getCurrentLocation(driverId);
      res.status(HttpStatus.OK).json({ success: true, location });
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
      const refreshToken = req.cookies?.driverRefreshToken;

      if (!refreshToken) {
        console.log("Token not provided sending back");

        res
          .status(HttpStatus.UNAUTHORIZED)
          .json({ message: messages.TOKEN_NOT_PROVIDED });
        return;
      }

      const response = await this.driverService.refreshToken(refreshToken);

      res.cookie("driverRefreshToken", response.newRefreshToken, {
        httpOnly: true,
        secure: process.env.PRODUCTION === "production",
        sameSite: "strict",
        maxAge: parseInt(process.env.REFRESH_MAX_AGE as string),
      });

      res.status(HttpStatus.CREATED).json({
        message: messages.TOKEN_CREATED,
        accessToken: response.newAccessToken,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProfilePic(
    req: ExtendedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = req.id;
      const image = req.body.image;
      if (!id) {
        throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
      }
      const newImg = await this.driverService.updateProfilePic(id, image);

      res.status(HttpStatus.OK).json({ success: true, image: newImg });
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
      await this.driverService.logout(refreshToken, accessToken);
      res.clearCookie("driverRefreshToken", {
        httpOnly: true,
        secure: true,
        sameSite: "none",
      });

      res.status(HttpStatus.OK).json({ success: true });
    } catch (error) {
      next(error);
    }
  }
}
