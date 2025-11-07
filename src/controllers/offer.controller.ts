import { NextFunction, Request, Response } from 'express';
import { IOfferController } from './interfaces/offer.controller.interface';
import { IOfferService } from '../services/interfaces/offer.service.interface';
import { HttpStatus } from '../constants/httpStatusCodes';
import { OfferSchemaDTO } from '../dtos/request/offer.req.dto';
import { sendSuccess } from '../utils/response.util';
import { IdDTO } from '../dtos/request/common.req.dto';
import { ExtendedRequest } from '../middlewares/auth.middleware';

export class OfferController implements IOfferController {
  constructor(private _offerService: IOfferService) {}

  async addOffer(
    req: ExtendedRequest<OfferSchemaDTO>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const data = req.validatedBody!;
      const offer = await this._offerService.addOffer(data);
      sendSuccess(res, HttpStatus.CREATED, { offer });
    } catch (error) {
      next(error);
    }
  }

  async getOffers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const offers = await this._offerService.getOffers();
      sendSuccess(res, HttpStatus.OK, { offers });
    } catch (error) {
      next(error);
    }
  }

  async changeOfferStatus(
    req: ExtendedRequest<IdDTO>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const offerId = req.validatedBody?.id!;
      const updatedOffer = await this._offerService.changeOfferStatus(offerId);
      sendSuccess(res, HttpStatus.OK, { updatedOffer });
    } catch (error) {
      next(error);
    }
  }
}
