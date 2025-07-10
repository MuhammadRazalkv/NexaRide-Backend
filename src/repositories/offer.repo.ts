import { IOffer } from "../models/offer.modal";
import { BaseRepository } from "./base.repo";
import { IOfferRepo } from "./interfaces/offer.repo.interface";
import Offer from "../models/offer.modal";
import OfferLimit, { IOfferUsage } from "../models/offer.usage.modal";
export class OfferRepo extends BaseRepository<IOffer> implements IOfferRepo {
  constructor() {
    super(Offer);
  }
  async findOfferUsage(
    userId: string,
    offerId: string
  ): Promise<IOfferUsage | null> {
    return await OfferLimit.findOne({ userId, offerId });
  }
  async increaseOfferUsage(
    userId: string,
    offerId: string
  ): Promise<IOfferUsage | null> {
    return await OfferLimit.findOneAndUpdate(
      { userId, offerId },
      { $inc: { usageCount: 1 } },
      { upsert: true }
    );
  }
}
