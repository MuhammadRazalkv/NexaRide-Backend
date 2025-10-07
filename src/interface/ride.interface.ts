interface CheckCabs {
  pickUpPoint: { lat: number; lng: number };
  dropOffPoint: { lat: number; lng: number };
  distance: number;
  time: number;
}

export type { CheckCabs };

export interface RideCreateDTO {
  userId: string;
  driverId: string;
  pickupLocation: string;
  dropOffLocation: string;
  pickupCoords: [number, number];
  dropOffCoords: [number, number];
  distance: number;
  estTime: number;
  baseFare: number;
  premiumDiscount: number;
  offerDiscountAmount: number;
  totalFare: number;
  commission: number;
  driverEarnings: number;
  status: 'ongoing';
  OTP: string;
  startedAt: number;
  appliedOffer?: {
    offerId: string;
    discountAmount: number;
    offerType: string;
    originalCommission: number;
  };
}
