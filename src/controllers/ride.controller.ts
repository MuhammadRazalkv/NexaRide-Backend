import { ExtendedRequest } from '../middlewares/auth.middleware';
import { Response, NextFunction } from 'express';
import { IRideController } from './interfaces/ride.controller.interface';
import { IRideService } from '../services/interfaces/ride.service.interface';
import { HttpStatus } from '../constants/httpStatusCodes';
import { IdDTO } from '../dtos/request/common.req.dto';
import { CheckCabs, OTPDTO, RequestedByDTO } from '../dtos/request/ride.req.dto';
import { sendSuccess } from '../utils/response.util';
import { QuerySchemaDTO } from '../dtos/request/query.req.dto';
import { FeedBakReqDTO } from '../dtos/request/feedback.req.dto';

export class RideController implements IRideController {
  constructor(private _rideService: IRideService) {}
  async checkCabs(
    req: ExtendedRequest<CheckCabs>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.id!;
      const data = req.validatedBody!;
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
      const id = req.id!;
      const coordinates = await this._rideService.assignRandomLocation(id);
      sendSuccess(res, HttpStatus.OK, { coordinates });
    } catch (error) {
      next(error);
    }
  }

  async verifyRideOTP(
    req: ExtendedRequest<OTPDTO>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const driverId = req.id!;
      const OTP = req.validatedBody?.otp!;
      const response = await this._rideService.verifyRideOTP(driverId, OTP);

      sendSuccess(res, HttpStatus.OK, { startedAt: response.date, rideId: response.rideId });
    } catch (error) {
      next(error);
    }
  }

  async getRideHistory(
    req: ExtendedRequest<any, QuerySchemaDTO>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const id = req.id!;
      const { page, sort } = req.validatedQuery!;
      const { history, total } = await this._rideService.getRideHistory(id, page, sort);

      sendSuccess(res, HttpStatus.OK, { history, total });
    } catch (error) {
      next(error);
    }
  }

  async getRideHistoryDriver(
    req: ExtendedRequest<any, QuerySchemaDTO>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const id = req.id!;
      const { page, sort } = req.validatedQuery!;
      const { history, total } = await this._rideService.getRideHistoryDriver(id, page, sort);
      sendSuccess(res, HttpStatus.OK, { history, total });
    } catch (error) {
      next(error);
    }
  }

  async checkPaymentStatus(
    req: ExtendedRequest<any, IdDTO>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const rideId = req.validatedQuery?.id!;
      const paymentStatus = await this._rideService.checkPaymentStatus(rideId);
      sendSuccess(res, HttpStatus.OK, { paymentStatus });
    } catch (error) {
      next(error);
    }
  }

  async getRIdeInfoForUser(
    req: ExtendedRequest<any, IdDTO>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const id = req.id!;
      const rideId = req.validatedQuery?.id!;
      const { ride, complaintInfo } = await this._rideService.findUserRideInfo(rideId, id);
      sendSuccess(res, HttpStatus.OK, { ride, complaintInfo });
    } catch (error) {
      next(error);
    }
  }

  async getRIdeInfoForDriver(
    req: ExtendedRequest<any, IdDTO>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const id = req.id!;
      const rideId = req.validatedQuery?.id!;
      const { ride, complaintInfo } = await this._rideService.findDriverRideInfo(rideId, id);

      sendSuccess(res, HttpStatus.OK, { ride, complaintInfo });
    } catch (error) {
      next(error);
    }
  }

  async giveFeedBack(
    req: ExtendedRequest<FeedBakReqDTO>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { rating, rideId, submittedBy, feedback } = req.validatedBody!;
      await this._rideService.giveFeedBack(rideId, submittedBy, rating, feedback);

      sendSuccess(res, HttpStatus.CREATED, {});
    } catch (error) {
      next(error);
    }
  }

  async rideSummary(
    req: ExtendedRequest<any, RequestedByDTO>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const id = req.id!;

      const { requestedBy } = req.validatedQuery!;

      const data = await this._rideService.rideSummary(id, requestedBy);
      sendSuccess(res, HttpStatus.OK, { data });
    } catch (error) {
      next(error);
    }
  }

  async feedBackSummary(
    req: ExtendedRequest<any, RequestedByDTO>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const id = req.id!;

      const requestedBy = req.validatedQuery?.requestedBy!;
      const data = await this._rideService.feedBackSummary(id, requestedBy);

      sendSuccess(res, HttpStatus.OK, { data });
    } catch (error) {
      next(error);
    }
  }
}
