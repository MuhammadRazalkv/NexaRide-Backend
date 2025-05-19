import { Request, Response, NextFunction } from "express";
import { IUserController } from "./interfaces/user.controller.interface";

import { ExtendedRequest } from "../middlewares/auth.middleware";
import IUserService from "../services/interfaces/user.service.interface";
import { HttpStatus } from "../constants/httpStatusCodes";
import { messages } from "../constants/httpMessages";
import { AppError } from "../utils/appError";
export class UserController implements IUserController {
  constructor(private userService: IUserService) {}

  async emailVerification(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const email = req.body.email;
      await this.userService.emailVerification(email);
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
      await this.userService.verifyOTP(email, otp);
      res
        .status(HttpStatus.OK)
        .json({ message: messages.EMAIL_VERIFICATION_SUCCESS });
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
      const data = await this.userService.addInfo(req.body);

      // Securely store the refresh token in an HTTP-only cookie

      res.cookie("userRefreshToken", data.refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge:parseInt(process.env.REFRESH_MAX_AGE as string),
      });

      res.status(HttpStatus.CREATED).json({
        message: messages.USER_CREATION_SUCCESS,
        accessToken: data.accessToken,
        user: data.user,
      });
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
      await this.userService.reSendOTP(email);
      res
        .status(HttpStatus.CREATED)
        .json({ message: messages.OTP_SENT_SUCCESS });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const data = await this.userService.login(email, password);
      res.cookie("userRefreshToken", data.refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: parseInt(process.env.REFRESH_MAX_AGE as string),
      });

      res.status(HttpStatus.OK).json({
        message: messages.LOGIN_SUCCESS,
        accessToken: data.accessToken,
        user: data.user,
      });
    } catch (error) {
      next(error);
    }
  }

  async googleLogin(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { email, googleId, name } = req.body;
      const data = await this.userService.googleLogin(email, googleId, name);

      res.cookie("userRefreshToken", data.refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: parseInt(process.env.REFRESH_MAX_AGE as string),
      });

      res.status(HttpStatus.OK).json({
        message: messages.LOGIN_SUCCESS,
        accessToken: data.accessToken,
        user: data.user,
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
      await this.userService.requestPasswordReset(req.body.email);
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
      await this.userService.resetPassword(id, token, password);
      res
        .status(HttpStatus.OK)
        .json({ message: messages.PASSWORD_RESET_SUCCESS });
    } catch (error) {
      next(error);
    }
  }

  async getUserInfo(
    req: ExtendedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = req.id;
      if (!id) {
        throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
      }
      const user = await this.userService.getUserInfo(id);

      res.status(HttpStatus.OK).json({ user: user });
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
      const refreshToken = req.cookies?.userRefreshToken;

      if (!refreshToken) {
        res
          .status(HttpStatus.UNAUTHORIZED)
          .json({ message: messages.TOKEN_NOT_PROVIDED });
        return;
      }

      const response = await this.userService.refreshToken(refreshToken);

      res.cookie("refreshToken", response.newRefreshToken, {
        httpOnly: true,
        secure: process.env.PRODUCTION === "production",
        sameSite: "strict",
        maxAge:parseInt(process.env.REFRESH_MAX_AGE as string),
      });

      res.status(HttpStatus.CREATED).json({
        message: messages.TOKEN_CREATED,
        accessToken: response.newAccessToken,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateUserName(
    req: ExtendedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = req.id;
      const name = req.body.name;
      if (!id) {
        throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
      }
      const user = await this.userService.updateUserName(id, name);

      res.status(HttpStatus.OK).json({ success: true, name: user });
    } catch (error) {
      next(error);
    }
  }

  async updateUserPhone(
    req: ExtendedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = req.id;
      const phone = req.body.phone;
      if (!id) {
        throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
      }
      const newPhone = await this.userService.updateUserPhone(id, phone);

      res.status(HttpStatus.OK).json({ success: true, phone: newPhone });
    } catch (error) {
      next(error);
    }
  }

  async updateUserPfp(
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
      const newImg = await this.userService.updateUserPfp(id, image);

      res.status(HttpStatus.OK).json({ success: true, image: newImg });
    } catch (error) {
      next(error);
    }
  }

  
  async subscriptionStatus(req: ExtendedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.id
      if (!userId) {
        throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
      }
      const result = await this.userService.subscriptionStatus(userId)
      res.status(200).json({success:true,result})
    } catch (error) {
      next(error)
    }
  }

} 
