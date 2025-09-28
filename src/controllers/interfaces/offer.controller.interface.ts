import { Request, Response, NextFunction } from 'express';
export interface IOfferController {
  addOffer(req: Request, res: Response, next: NextFunction): Promise<void>;
  getOffers(req: Request, res: Response, next: NextFunction): Promise<void>;
  changeOfferStatus(req: Request, res: Response, next: NextFunction): Promise<void>;
}
