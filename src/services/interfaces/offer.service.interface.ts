import { OfferSchemaDTO } from '../../dtos/request/offer.req.dto';
import { OfferResDTO } from '../../dtos/response/offer.res.dto';
import { IOffer } from '../../models/offer.modal';

export interface IOfferService {
  addOffer(data: OfferSchemaDTO): Promise<OfferResDTO>;
  getOffers(): Promise<OfferResDTO[]>;
  changeOfferStatus(offerId: string): Promise<OfferResDTO>;
  findValidOffers(now: number, rideFare: number): Promise<OfferResDTO[] | null>;
  // findOfferById(offerId: string): Promise<OfferResDTO | null>;
  findOfferUsage(userId: string, offerId: string): Promise<number>;
  increaseOfferUsage(userId: string, offerId: string): Promise<void>;
}
