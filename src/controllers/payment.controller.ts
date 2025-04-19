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
      if (!id) {
        throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
      }
      const wallet = await this.paymentService.getWalletInfo(id);
      res.status(HttpStatus.OK).json({ success: true, wallet });
    } catch (error) {
      next(error);
    }
  }

  async webhook(
    req: ExtendedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const sig = req.headers["stripe-signature"] as string;
    console.log('web hook ');
    
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
      if (!driverId) {
        throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
      }
      const wallet = await this.paymentService.getDriverWalletInfo(driverId);
      res.status(200).json({ success: true, wallet });
    } catch (error) {
      next(error);
    }
  }
}
