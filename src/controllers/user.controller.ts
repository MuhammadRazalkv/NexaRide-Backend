import { Request, Response, NextFunction } from 'express';
import { IUserController } from './interfaces/user.controller.interface';
import { ExtendedRequest } from '../middlewares/auth.middleware';
import IUserService from '../services/interfaces/user.service.interface';
import { HttpStatus } from '../constants/httpStatusCodes';
import { messages } from '../constants/httpMessages';
import { AppError } from '../utils/appError';
import { validate } from '../utils/validators/validateZod';
import {
  emailDTO,
  emailOTPValidation,
  loginDTO,
  nameDTO,
  phoneDTO,
  userSchemaDTO,
} from '../dtos/request/auth.req.dto';
import { sendSuccess } from '../utils/response.util';
import { objectIdSchema } from '../dtos/request/common.req.dto';
export class UserController implements IUserController {
  constructor(private _userService: IUserService) {}

  async emailVerification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const email = validate(emailDTO, req.body.email);
      await this._userService.emailVerification(email);
      sendSuccess(res, HttpStatus.CREATED, {}, messages.OTP_SENT_SUCCESS);
    } catch (error) {
      next(error);
    }
  }

  async verifyOTP(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, OTP } = validate(emailOTPValidation, {
        email: req.body.email,
        OTP: req.body.otp,
      });
      await this._userService.verifyOTP(email, OTP);
      sendSuccess(res, HttpStatus.OK, {}, messages.EMAIL_VERIFICATION_SUCCESS);
    } catch (error) {
      next(error);
    }
  }

  async addInfo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userData = validate(userSchemaDTO, req.body);
      const { accessToken, refreshToken, user } = await this._userService.addInfo(userData);

      res.cookie('userRefreshToken', refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: parseInt(process.env.REFRESH_MAX_AGE as string),
      });

      sendSuccess(res, HttpStatus.CREATED, { user, accessToken });
    } catch (error) {
      next(error);
    }
  }

  async reSendOTP(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const email = validate(emailDTO, req.body.email);
      await this._userService.reSendOTP(email);
      sendSuccess(res, HttpStatus.CREATED, {}, messages.OTP_SENT_SUCCESS);
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = validate(loginDTO, req.body);
      const { accessToken, refreshToken, user } = await this._userService.login(email, password);
      res.cookie('userRefreshToken', refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: parseInt(process.env.REFRESH_MAX_AGE as string),
      });

      sendSuccess(res, HttpStatus.OK, { user, accessToken }, messages.LOGIN_SUCCESS);
    } catch (error) {
      next(error);
    }
  }

  async googleLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const email = validate(emailDTO, req.body.email);
      const { googleId, name } = req.body;
      const { accessToken, refreshToken, user } = await this._userService.googleLogin(
        email,
        googleId,
        name,
      );

      res.cookie('userRefreshToken', refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: parseInt(process.env.REFRESH_MAX_AGE as string),
      });

      sendSuccess(res, HttpStatus.OK, { accessToken, user }, messages.LOGIN_SUCCESS);
    } catch (error) {
      next(error);
    }
  }

  async requestPasswordReset(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const email = validate(emailDTO, req.body.email);
      await this._userService.requestPasswordReset(email);
      sendSuccess(res, HttpStatus.OK, {}, messages.PASSWORD_RESET_LINK_SENT);
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = validate(objectIdSchema, req.body.id);
      const { token, password } = req.body;

      await this._userService.resetPassword(id, token, password);
      sendSuccess(res, HttpStatus.OK, {}, messages.PASSWORD_RESET_SUCCESS);
    } catch (error) {
      next(error);
    }
  }

  async getUserInfo(req: ExtendedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = validate(objectIdSchema, req.id);
      const user = await this._userService.getUserInfo(id);

      sendSuccess(res, HttpStatus.OK, { user });
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies?.userRefreshToken;

      if (!refreshToken) {
        throw new AppError(HttpStatus.UNAUTHORIZED, messages.TOKEN_NOT_PROVIDED);
      }

      const { newAccessToken, newRefreshToken } =
        await this._userService.refreshToken(refreshToken);

      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.PRODUCTION === 'production',
        sameSite: 'strict',
        maxAge: parseInt(process.env.REFRESH_MAX_AGE as string),
      });

      sendSuccess(res, HttpStatus.CREATED, { accessToken: newAccessToken }, messages.TOKEN_CREATED);
    } catch (error) {
      next(error);
    }
  }

  async updateUserName(req: ExtendedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = validate(objectIdSchema, req.id);
      const name = validate(nameDTO, req.body.name);

      const data = await this._userService.updateUserName(id, name);

      sendSuccess(res, HttpStatus.OK, { name: data });
    } catch (error) {
      next(error);
    }
  }

  async updateUserPhone(req: ExtendedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = validate(objectIdSchema, req.id);
      const phone = validate(phoneDTO, String(req.body.phone));
      const newPhone = await this._userService.updateUserPhone(id, parseInt(phone));

      sendSuccess(res, HttpStatus.OK, { phone: newPhone });
    } catch (error) {
      next(error);
    }
  }

  async updateUserPfp(req: ExtendedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = validate(objectIdSchema, req.id);
      const image = req.body.image;

      const newImg = await this._userService.updateUserPfp(id, image);

      sendSuccess(res, HttpStatus.OK, { image: newImg });
    } catch (error) {
      next(error);
    }
  }

  async subscriptionStatus(req: ExtendedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = validate(objectIdSchema, req.id);
      const result = await this._userService.subscriptionStatus(userId);
      sendSuccess(res, HttpStatus.OK, { result });
    } catch (error) {
      next(error);
    }
  }

  async subscriptionHistory(
    req: ExtendedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const id = validate(objectIdSchema, req.id);
      const page = parseInt(req.query.page as string);

      const { history, total } = await this._userService.subscriptionHistory(id, page);
      sendSuccess(res, HttpStatus.OK, { history, total });
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
      await this._userService.logout(refreshToken, accessToken);
      res.clearCookie('userRefreshToken', {
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
