import { OfferResDTO } from '../dtos/response/offer.res.dto';
import { IOffer } from '../models/offer.modal';

export class OfferMapper {
  static toOffer(offer: IOffer): OfferResDTO {
    return {
      _id: offer.id,
      title: offer.title,
      value: offer.value,
      isActive: offer.isActive,
      maxDiscount: offer.maxDiscount,
      minFare: offer.minFare,
      type: offer.type,
      usageLimitPerUser: offer.usageLimitPerUser,
      validFrom: offer.validFrom,
      validTill: offer.validTill,
    };
  }

  static toOfferList(offer: IOffer[]): OfferResDTO[] {
    return offer.map((d) => this.toOffer(d));
  }
}
