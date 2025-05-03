import { ExtendedRequest } from "../middlewares/auth.middleware";
import { Response, NextFunction } from "express";
import { IRideController } from "./interfaces/ride.controller.interface";
import { IRideService } from "../services/interfaces/ride.service.interface";
import { AppError } from "../utils/appError";
import { HttpStatus } from "../constants/httpStatusCodes";
import { messages } from "../constants/httpMessages";

export class RideController implements IRideController {
  constructor(private rideService: IRideService) {}
  async checkCabs(
    req: ExtendedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.id;
      if (!userId) {
        throw new AppError(HttpStatus.BAD_REQUEST, messages.TOKEN_NOT_PROVIDED);
      }
      const data = req.body.data;

      const response = await this.rideService.checkCabs(userId, data);
      res.status(HttpStatus.OK).json({ success: true, drivers: response });
    } catch (error) {
      next(error);
    }
  }

  async assignRandomLocation(
    req: ExtendedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.id) {
        throw new AppError(HttpStatus.BAD_REQUEST, messages.TOKEN_NOT_PROVIDED);
      }
      const response = await this.rideService.assignRandomLocation(req.id);
      res.status(HttpStatus.OK).json({ success: true, coordinates: response });
    } catch (error) {
      next(error);
    }
  }

  async verifyRideOTP(
    req: ExtendedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const driverId = req.id;
      if (!driverId) {
        throw new AppError(HttpStatus.BAD_REQUEST, messages.TOKEN_NOT_PROVIDED);
      }
      const OTP = req.body.otp;

      const response = await this.rideService.verifyRideOTP(driverId, OTP);
      res.status(200).json({ success: true, startedAt: response.date , rideId:response.rideId });
    } catch (error) {
      next(error);
    }
  }

  async getRideHistory(
    req: ExtendedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = req.id;
      if (!id) {
        throw new AppError(HttpStatus.BAD_REQUEST, messages.TOKEN_NOT_PROVIDED);
      }
      const page = parseInt(req.query.page as string);
      const response = await this.rideService.getRideHistory(id, page);
      res.status(HttpStatus.OK).json({
        success: true,
        history: response.history,
        total: response.total,
      });
    } catch (error) {
      next(error);
    }
  }

  async getRideHistoryDriver(
    req: ExtendedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = req.id;
      if (!id) {
        throw new AppError(HttpStatus.BAD_REQUEST, messages.TOKEN_NOT_PROVIDED);
      }
      const page = parseInt(req.query.page as string);
      const response = await this.rideService.getRideHistoryDriver(id, page);
      res.status(HttpStatus.OK).json({
        success: true,
        history: response.history,
        total: response.total,
      });
    } catch (error) {
      next(error);
    }
  }

  async checkPaymentStatus(
    req: ExtendedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = req.id;
      if (!id) {
        throw new AppError(HttpStatus.BAD_REQUEST, messages.TOKEN_NOT_PROVIDED);
      }
      const rideId = req.params.rideId;
      const paymentStatus = await this.rideService.checkPaymentStatus(rideId);
      res.status(200).json({ success: true, paymentStatus });
    } catch (error) {
      next(error);
    }
  }

  async getRIdeInfoForUser(
    req: ExtendedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = req.id;
      const rideId = req.query.rideId;
      if (!id) {
        throw new AppError(HttpStatus.BAD_REQUEST, messages.TOKEN_NOT_PROVIDED);
      }
      if (!rideId || rideId === "null" || String(rideId).trim() === "") {
        throw new AppError(HttpStatus.BAD_REQUEST, messages.ID_NOT_PROVIDED);
      }

      const { ride, complaintInfo } = await this.rideService.findUserRideInfo(
        rideId as string,
        id
      );
      res.status(HttpStatus.OK).json({ ride, complaintInfo });
    } catch (error) {
      next(error);
    }
  }

  async fileComplaint(
    req: ExtendedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = req.id;
      const { rideId, reason, by, description } = req.body;
      if (!id) {
        throw new AppError(HttpStatus.BAD_REQUEST, messages.TOKEN_NOT_PROVIDED);
      }
      if (!rideId || rideId === "null" || String(rideId).trim() === "") {
        throw new AppError(HttpStatus.BAD_REQUEST, messages.ID_NOT_PROVIDED);
      }
      if (!reason) {
        throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
      }
      const complaint = await this.rideService.fileComplaint(
        id,
        rideId,
        reason,
        by,
        description
      );
      res.status(HttpStatus.CREATED).json({ success: true, complaint });
    } catch (error) {
      next(error);
    }
  }

  async getRIdeInfoForDriver(
    req: ExtendedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = req.id;
      const rideId = req.query.rideId;
      if (!id) {
        throw new AppError(HttpStatus.BAD_REQUEST, messages.TOKEN_NOT_PROVIDED);
      }
      if (!rideId || rideId === "null" || String(rideId).trim() === "") {
        throw new AppError(HttpStatus.BAD_REQUEST, messages.ID_NOT_PROVIDED);
      }

      const { ride, complaintInfo } = await this.rideService.findDriverRideInfo(
        rideId as string,
        id
      );
      console.log("complaint info  ", complaintInfo);

      res.status(HttpStatus.OK).json({ success: true, ride, complaintInfo });
    } catch (error) {
      next(error);
    }
  }

  async giveFeedBack(
    req: ExtendedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { rideId, submittedBy, rating, feedback } = req.body;
      if (!rideId || !submittedBy || !rating) {
        throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
      }
      await this.rideService.giveFeedBack(
        rideId,
        submittedBy,
        Number(rating),
        feedback
      );

      res.status(HttpStatus.CREATED).json({ success: true });
    } catch (error) {
      next(error);
    }
  }
}
