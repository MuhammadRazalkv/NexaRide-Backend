import { Response, NextFunction } from 'express';
import { IPaymentController } from './interfaces/payment.controller.interface';
import { ExtendedRequest } from '../middlewares/auth.middleware';
import { IPaymentService } from '../services/interfaces/payment.service.interface';
import { HttpStatus } from '../constants/httpStatusCodes';
import { IdDTO } from '../dtos/request/common.req.dto';
import { AmountDTO, SubTypeDTO } from '../dtos/request/payment.req.dto';
import { sendSuccess } from '../utils/response.util';
import { QuerySchemaDTO } from '../dtos/request/query.req.dto';
import { RequestedByDTO } from '../dtos/request/ride.req.dto';
export class PaymentController implements IPaymentController {
  constructor(private _paymentService: IPaymentService) {}
  async addMoneyToWallet(
    req: ExtendedRequest<AmountDTO>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const id = req.id!;
      const amount = req.validatedBody?.amount!;

      const url = await this._paymentService.addMoneyToWallet(id, amount);

      sendSuccess(res, HttpStatus.CREATED, { url });
    } catch (error) {
      next(error);
    }
  }

  async getWalletInfo(
    req: ExtendedRequest<any, QuerySchemaDTO>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const id = req.id!;
      const page = req.validatedQuery?.page!;

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

  async payUsingWallet(
    req: ExtendedRequest<IdDTO>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const id = req.id!;
      const rideId = req.validatedBody?.id!;

      await this._paymentService.payUsingWallet(id, rideId);
      sendSuccess(res, HttpStatus.OK, {});
    } catch (error) {
      next(error);
    }
  }

  async payUsingStripe(
    req: ExtendedRequest<IdDTO>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const id = req.id!;
      const rideId = req.validatedBody?.id!;
      const url = await this._paymentService.payUsingStripe(id, rideId);

      sendSuccess(res, HttpStatus.CREATED, { url });
    } catch (error) {
      next(error);
    }
  }

  async getDriverWalletInfo(
    req: ExtendedRequest<any, QuerySchemaDTO>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const driverId = req.id!;
      const page = req.validatedQuery?.page!;

      const { wallet, total } = await this._paymentService.getDriverWalletInfo(driverId, page);
      sendSuccess(res, HttpStatus.OK, { wallet, total });
    } catch (error) {
      next(error);
    }
  }

  async upgradeToPlus(
    req: ExtendedRequest<SubTypeDTO>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.id!;
      const type = req.validatedBody?.type!;
      const url = await this._paymentService.upgradeToPlus(userId, type);
      sendSuccess(res, HttpStatus.CREATED, { url });
    } catch (error) {
      next(error);
    }
  }

  async transactionSummary(
    req: ExtendedRequest<any, RequestedByDTO>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const id = req.id!;
      const requestedBy = req.validatedQuery?.requestedBy!;
      const data = await this._paymentService.transactionSummary(id, requestedBy);
      sendSuccess(res, HttpStatus.OK, { data });
    } catch (error) {
      next(error);
    }
  }

  async earningsSummary(req: ExtendedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.id!;
      const data = await this._paymentService.earningsSummary(id);
      sendSuccess(res, HttpStatus.OK, { data });
    } catch (error) {
      next(error);
    }
  }

  async earningsBreakDown(req: ExtendedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.id!;
      const data = await this._paymentService.earningsBreakdown(id);
      sendSuccess(res, HttpStatus.OK, { data });
    } catch (error) {
      next(error);
    }
  }
}
