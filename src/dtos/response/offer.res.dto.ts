export interface OfferResDTO {
  _id: string;
  title: string;
  type: string;
  value: number;
  maxDiscount: number;
  minFare: number;
  isActive: boolean;
  validFrom: number;
  validTill: number;
  usageLimitPerUser: number;
}
