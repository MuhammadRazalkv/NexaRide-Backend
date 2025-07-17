import { Request, Response, NextFunction } from "express";
import { IPaymentController } from "./interfaces/payment.controller.interface";
import { ExtendedRequest } from "../middlewares/auth.middleware";
import { IPaymentService } from "../services/interfaces/payment.service.interface";
import { AppError } from "../utils/appError";
import { HttpStatus } from "../constants/httpStatusCodes";
import { messages } from "../constants/httpMessages";
export class PaymentController implements IPaymentController {
  constructor(private paymentService: IPaymentService) {}
  async addMoneyToWallet(
    req: ExtendedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = req.id;
      const amount = req.body.amount;
      if (!id) {
        throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
      }
      const url = await this.paymentService.addMoneyToWallet(id, amount);

      res.status(HttpStatus.OK).json({ success: true, url });
    } catch (error) {
      next(error);
    }
  }

  async getWalletInfo(
    req: ExtendedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = req.id;
      const page = parseInt(req.query.page as string) || 1;
      if (!id) {
        throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
      }
      const { wallet, total } = await this.paymentService.getWalletInfo(
        id,
        page
      );
      res.status(HttpStatus.OK).json({ success: true, wallet, total });
    } catch (error) {
      next(error);
    }
  }

  async webhook(
    req: ExtendedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    console.log("web hook controller layer 1  ");
    const sig = req.headers["stripe-signature"] as string;
    console.log('Web hook control layer 2');
    
    try {
      await this.paymentService.webHook(req.body, sig);
      res.status(HttpStatus.OK).json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  async payUsingWallet(
    req: ExtendedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = req.id;
      if (!id) {
        throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
      }
      const rideId = req.body.rideId;

      await this.paymentService.payUsingWallet(id, rideId);
      res.status(HttpStatus.OK).json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  async payUsingStripe(
    req: ExtendedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = req.id;
      const rideId = req.body.rideId;
      if (!id) {
        throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
      }
      const url = await this.paymentService.payUsingStripe(id, rideId);

      res.status(HttpStatus.OK).json({ success: true, url });
    } catch (error) {
      next(error);
    }
  }

  async getDriverWalletInfo(
    req: ExtendedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const driverId = req.id;
      const page = parseInt(req.query.page as string) || 1;
      if (!driverId) {
        throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
      }
      const { wallet, total } = await this.paymentService.getDriverWalletInfo(
        driverId,
        page
      );
      res.status(200).json({ success: true, wallet, total });
    } catch (error) {
      next(error);
    }
  }

  async upgradeToPlus(
    req: ExtendedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.id;
      const { type } = req.body;
      if (!userId) {
        throw new AppError(HttpStatus.BAD_REQUEST, messages.ID_NOT_PROVIDED);
      }
      if (!type) {
        throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
      }
      const url = await this.paymentService.upgradeToPlus(userId, type);
      res.status(HttpStatus.CREATED).json({ success: true, url });
    } catch (error) {
      next(error);
    }
  }

  async transactionSummary(
    req: ExtendedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.id) {
        throw new AppError(HttpStatus.BAD_REQUEST, messages.ID_NOT_PROVIDED);
      }
      const requestedBy = req.query.requestedBy;
      if (requestedBy !== "user" && requestedBy !== "driver") {
        throw new AppError(HttpStatus.BAD_REQUEST, messages.INVALID_PARAMETERS);
      }
      const data = await this.paymentService.transactionSummary(
        req.id,
        requestedBy
      );
      res.status(HttpStatus.OK).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async earningsSummary(
    req: ExtendedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.id) {
        throw new AppError(HttpStatus.BAD_REQUEST, messages.ID_NOT_PROVIDED);
      }
      const data = await this.paymentService.earningsSummary(req.id);
      res.status(HttpStatus.OK).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}
