import { NextFunction, Request, Response } from 'express';
import { IOfferController } from './interfaces/offer.controller.interface';
import { IOfferService } from '../services/interfaces/offer.service.interface';
import { HttpStatus } from '../constants/httpStatusCodes';

export class OfferController implements IOfferController {
  constructor(private offerService: IOfferService) {}
  async addOffer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = req.body;
      console.log(data);

      const offer = await this.offerService.addOffer(data);
      res.status(HttpStatus.CREATED).json({ success: true, offer });
    } catch (error) {
      next(error);
    }
  }

  async getOffers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const offers = await this.offerService.getOffers();
      res.status(HttpStatus.OK).json({ success: true, offers });
    } catch (error) {
      next(error);
    }
  }

  async changeOfferStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { offerId } = req.body;
      const updatedOffer = await this.offerService.changeOfferStatus(offerId);
      res.status(HttpStatus.OK).json({ success: true, updatedOffer });
    } catch (error) {
      next(error);
    }
  }
}
