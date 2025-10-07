import { NextFunction, Request, Response } from 'express';
import { IOfferController } from './interfaces/offer.controller.interface';
import { IOfferService } from '../services/interfaces/offer.service.interface';
import { HttpStatus } from '../constants/httpStatusCodes';
import { validate } from '../utils/validators/validateZod';
import { OfferSchemaWithRefinements } from '../dtos/request/offer.req.dto';
import { sendSuccess } from '../utils/response.util';
import { objectIdSchema } from '../dtos/request/common.req.dto';

export class OfferController implements IOfferController {
  constructor(private _offerService: IOfferService) {}

  async addOffer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      console.log(req.body);

      const data = validate(OfferSchemaWithRefinements, req.body);
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

  async changeOfferStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const offerId = validate(objectIdSchema, req.body.offerId);
      const updatedOffer = await this._offerService.changeOfferStatus(offerId);
      sendSuccess(res, HttpStatus.OK, { updatedOffer });
    } catch (error) {
      next(error);
    }
  }
}
