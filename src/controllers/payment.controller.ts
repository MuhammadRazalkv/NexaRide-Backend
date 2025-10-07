import { Response, NextFunction } from 'express';
import { IPaymentController } from './interfaces/payment.controller.interface';
import { ExtendedRequest } from '../middlewares/auth.middleware';
import { IPaymentService } from '../services/interfaces/payment.service.interface';
import { AppError } from '../utils/appError';
import { HttpStatus } from '../constants/httpStatusCodes';
import { messages } from '../constants/httpMessages';
import { validate } from '../utils/validators/validateZod';
import { objectIdSchema } from '../dtos/request/common.req.dto';
import { amountDTO, subTypeDTO } from '../dtos/request/payment.req.dto';
import { sendSuccess } from '../utils/response.util';
export class PaymentController implements IPaymentController {
  constructor(private _paymentService: IPaymentService) {}
  async addMoneyToWallet(req: ExtendedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = validate(objectIdSchema, req.id);
      const amount = validate(amountDTO, req.body.amount);

      const url = await this._paymentService.addMoneyToWallet(id, amount);

      sendSuccess(res, HttpStatus.CREATED, { url });
    } catch (error) {
      next(error);
    }
  }

  async getWalletInfo(req: ExtendedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = validate(objectIdSchema, req.id);
      const page = parseInt(req.query.page as string) || 1;

      const { wallet, total } = await this._paymentService.getWalletInfo(id, page);
      sendSuccess(res, HttpStatus.OK, { wallet, total });
    } catch (error) {
      next(error);
    }
  }

  async webhook(req: ExtendedRequest, res: Response, next: NextFunction): Promise<void> {
    const sig = req.headers['stripe-signature'] as string;

    try {
      await this._paymentService.webHook(req.body, sig);
      sendSuccess(res, HttpStatus.OK, {});
    } catch (error) {
      next(error);
    }
  }

  async payUsingWallet(req: ExtendedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = validate(objectIdSchema, req.id);
      const rideId = validate(objectIdSchema, req.body.rideId);

      await this._paymentService.payUsingWallet(id, rideId);
      sendSuccess(res, HttpStatus.OK, {});
    } catch (error) {
      next(error);
    }
  }

  async payUsingStripe(req: ExtendedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = validate(objectIdSchema, req.id);
      const rideId = validate(objectIdSchema, req.body.rideId);
      const url = await this._paymentService.payUsingStripe(id, rideId);

      sendSuccess(res, HttpStatus.CREATED, { url });
    } catch (error) {
      next(error);
    }
  }

  async getDriverWalletInfo(
    req: ExtendedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const driverId = validate(objectIdSchema, req.id);
      const page = parseInt(req.query.page as string) || 1;

      const { wallet, total } = await this._paymentService.getDriverWalletInfo(driverId, page);
      sendSuccess(res, HttpStatus.OK, { wallet, total });
    } catch (error) {
      next(error);
    }
  }

  async upgradeToPlus(req: ExtendedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = validate(objectIdSchema, req.id);
      const type = validate(subTypeDTO, req.body.type);
      const url = await this._paymentService.upgradeToPlus(userId, type);
      sendSuccess(res, HttpStatus.CREATED, { url });
    } catch (error) {
      next(error);
    }
  }

  async transactionSummary(req: ExtendedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = validate(objectIdSchema, req.id);
      const requestedBy = req.query.requestedBy;
      if (requestedBy !== 'user' && requestedBy !== 'driver') {
        throw new AppError(HttpStatus.BAD_REQUEST, messages.INVALID_PARAMETERS);
      }
      const data = await this._paymentService.transactionSummary(id, requestedBy);
      sendSuccess(res, HttpStatus.OK, { data });
    } catch (error) {
      next(error);
    }
  }

  async earningsSummary(req: ExtendedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = validate(objectIdSchema, req.id);
      const data = await this._paymentService.earningsSummary(id);
      sendSuccess(res, HttpStatus.OK, { data });
    } catch (error) {
      next(error);
    }
  }

  async earningsBreakDown(req: ExtendedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = validate(objectIdSchema, req.id);
      const data = await this._paymentService.earningsBreakdown(id);
      console.log(data);
      sendSuccess(res, HttpStatus.OK, { data });
    } catch (error) {
      next(error);
    }
  }
}
