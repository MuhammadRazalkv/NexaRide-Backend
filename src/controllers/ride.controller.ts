import { ExtendedRequest } from '../middlewares/auth.middleware';
import { Response, NextFunction } from 'express';
import { IRideController } from './interfaces/ride.controller.interface';
import { IRideService } from '../services/interfaces/ride.service.interface';
import { AppError } from '../utils/appError';
import { HttpStatus } from '../constants/httpStatusCodes';
import { messages } from '../constants/httpMessages';
import { validate } from '../utils/validators/validateZod';
import { objectIdSchema } from '../dtos/request/common.req.dto';
import { checkCabsDTO, otpDTO, requestedByDTO } from '../dtos/request/ride.req.dto';
import { sendSuccess } from '../utils/response.util';

export class RideController implements IRideController {
  constructor(private _rideService: IRideService) {}
  async checkCabs(req: ExtendedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = validate(objectIdSchema, req.id);
      const data = validate(checkCabsDTO, req.body.data);
      const availableCabs = await this._rideService.checkCabs(userId, data);
      sendSuccess(res, HttpStatus.OK, { availableCabs });
    } catch (error) {
      next(error);
    }
  }

  async assignRandomLocation(
    req: ExtendedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const id = validate(objectIdSchema, req.id);
      const coordinates = await this._rideService.assignRandomLocation(id);
      sendSuccess(res, HttpStatus.OK, { coordinates });
    } catch (error) {
      next(error);
    }
  }

  async verifyRideOTP(req: ExtendedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const driverId = validate(objectIdSchema, req.id);
      const OTP = validate(otpDTO, req.body.otp);
      const response = await this._rideService.verifyRideOTP(driverId, OTP);

      sendSuccess(res, HttpStatus.OK, { startedAt: response.date, rideId: response.rideId });
    } catch (error) {
      next(error);
    }
  }

  async getRideHistory(req: ExtendedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = validate(objectIdSchema, req.id);
      const page = parseInt(req.query.page as string);
      const sort = req.query.sort;
      const { history, total } = await this._rideService.getRideHistory(id, page, sort as string);

      sendSuccess(res, HttpStatus.OK, { history, total });
    } catch (error) {
      next(error);
    }
  }

  async getRideHistoryDriver(
    req: ExtendedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const id = validate(objectIdSchema, req.id);
      const page = parseInt(req.query.page as string);
      const sort = req.query.sort;
      const { history, total } = await this._rideService.getRideHistoryDriver(
        id,
        page,
        sort as string,
      );
      sendSuccess(res, HttpStatus.OK, { history, total });
    } catch (error) {
      next(error);
    }
  }

  async checkPaymentStatus(req: ExtendedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const rideId = validate(objectIdSchema, req.params.rideId);
      const paymentStatus = await this._rideService.checkPaymentStatus(rideId);
      sendSuccess(res, HttpStatus.OK, { paymentStatus });
    } catch (error) {
      next(error);
    }
  }

  async getRIdeInfoForUser(req: ExtendedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = validate(objectIdSchema, req.id);
      const rideId = validate(objectIdSchema, req.query.rideId);

      const { ride, complaintInfo } = await this._rideService.findUserRideInfo(rideId, id);
      sendSuccess(res, HttpStatus.OK, { ride, complaintInfo });
    } catch (error) {
      next(error);
    }
  }

  async getRIdeInfoForDriver(
    req: ExtendedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const id = validate(objectIdSchema, req.id);
      const rideId = validate(objectIdSchema, req.query.rideId);
      const { ride, complaintInfo } = await this._rideService.findDriverRideInfo(rideId, id);

      sendSuccess(res, HttpStatus.OK, { ride, complaintInfo });
    } catch (error) {
      next(error);
    }
  }

  async giveFeedBack(req: ExtendedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { rideId, submittedBy, rating, feedback } = req.body;
      if (!rideId || !submittedBy || !rating) {
        throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
      }
      await this._rideService.giveFeedBack(rideId, submittedBy, Number(rating), feedback);

      sendSuccess(res, HttpStatus.CREATED, {});
    } catch (error) {
      next(error);
    }
  }

  async rideSummary(req: ExtendedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = validate(objectIdSchema, req.id);

      const requestedBy = validate(requestedByDTO, req.query.requestedBy);

      const data = await this._rideService.rideSummary(id, requestedBy);
      sendSuccess(res, HttpStatus.OK, { data });
    } catch (error) {
      next(error);
    }
  }

  async feedBackSummary(req: ExtendedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = validate(objectIdSchema, req.id);

      const requestedBy = validate(requestedByDTO, req.query.requestedBy);
      const data = await this._rideService.feedBackSummary(id, requestedBy);
      sendSuccess(res, HttpStatus.OK, { data });
    } catch (error) {
      next(error);
    }
  }
}
