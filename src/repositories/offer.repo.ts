import { IOffer } from "../models/offer.modal";
import { BaseRepository } from "./base.repo";
import { IOfferRepo } from "./interfaces/offer.repo.interface";
import Offer from "../models/offer.modal";
import OfferLimit, { IOfferUsage } from "../models/offer.usage.modal";
export class OfferRepo extends BaseRepository<IOffer> implements IOfferRepo {
  constructor() {
    super(Offer);
  }
  async createNewOffer(data: IOffer): Promise<IOffer> {
    return await this.create(data);
  }
  async getOffers(): Promise<IOffer[] | null> {
    return await this.findAll();
  }
  async findOfferById(offerId: string): Promise<IOffer | null> {
    return this.findById(offerId);
  }

  async changeOfferStatus(
    offerId: string,
    status: boolean
  ): Promise<IOffer | null> {
    return await this.updateById(offerId, { isActive: status });
  }
  async findValidOffersForRide(
    now: number,
    rideFare: number
  ): Promise<IOffer[] | null> {
    return await this.findAll({
      isActive: true,
      validFrom: { $lte: now },
      validTill: { $gte: now },
      minFare: { $lte: rideFare },
    });
  }

  async findOfferUsage(
    userId: string,
    offerId: string
  ): Promise<IOfferUsage | null> {
    return await OfferLimit.findOne({ userId, offerId });
  }
}
