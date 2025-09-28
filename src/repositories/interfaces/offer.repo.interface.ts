import { IOffer } from '../../models/offer.modal';
import { IOfferUsage } from '../../models/offer.usage.modal';
import { IBaseRepository } from './base.repo.interface';

export interface IOfferRepo extends IBaseRepository<IOffer> {
  findOfferUsage(userId: string, offerId: string): Promise<IOfferUsage | null>;
  increaseOfferUsage(userId: string, offerId: string): Promise<IOfferUsage | null>;
}
