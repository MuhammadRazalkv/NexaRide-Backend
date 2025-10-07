import { BaseAccountDTO } from './base.res.dto';

export interface PopulatedRideResDTO {
  userId: Partial<BaseAccountDTO>;
  driverId: Partial<BaseAccountDTO>;
  pickupLocation: string;
  dropOffLocation: string;
  totalFare: number;
  baseFare: number;
  premiumDiscount: number;
  offerDiscountAmount: number;
  commission: number; // Platform fee
  driverEarnings: number;
  distance: number; // In km
  estTime: number;
  timeTaken?: number; // In minutes
  status: string;
  startedAt?: number;
  endedAt?: number;
  cancelledAt?: number;
  paymentStatus: string;
  paymentMethod?: string;
  pickupCoords: [number, number];
  dropOffCoords: [number, number];
  OTP: string;
  cancelledBy?: string;
  appliedOffer?: {
    offerId: string;
    discountAmount: number;
    offerType: string;
    originalCommission: number;
  };
}

export interface FullRideListView {
  _id: string;
  driverId: string;
  pickupLocation: string;
  dropOffLocation: string;
  totalFare: number;
  commission: number;
  driverEarnings: number;
  distance: number;
  estTime: number;
  timeTaken?: number;
  status: string;
  startedAt?: number;
  endedAt?: number;
  canceledAt?: number;
  paymentStatus: string;
}

export interface RideInfoWithUserAndDriverNameDTO {
  userId: {
    _id: string;
    name: string;
  };
  driverId: {
    _id: string;
    name: string;
  };
  pickupLocation: string;
  dropOffLocation: string;
  totalFare: number;
  baseFare: number;
  premiumDiscount: number;
  offerDiscountAmount: number;
  commission: number; // Platform fee
  driverEarnings: number;
  distance: number; // In km
  estTime: number;
  timeTaken?: number; // In minutes
  status: string;
  startedAt?: number;
  endedAt?: number;
  cancelledAt?: number;
  paymentStatus: string;
  paymentMethod?: string;
  //   pickupCoords: [number, number];
  //   dropOffCoords: [number, number];
  cancelledBy?: string;
  appliedOffer?: {
    offerId: string;
    discountAmount: number;
    offerType: string;
    originalCommission: number;
  };
}
export type VehicleCategory = 'luxury' | 'premium' | 'basic';

export interface AvailableCabs {
  category: VehicleCategory;
  count: number;
  baseFare: number;
  discountApplied: number;
  offerTitle: string | null;
  offerId: string | null;
  isPremiumUser: boolean;
  premiumDiscount: number;
  finalFare: number;
}

export interface RideHistoryDTO {
  id: string;
  userId: string;
  driverId: string;
  pickupLocation: string;
  dropOffLocation: string;
  totalFare: number;
  baseFare: number;
  premiumDiscount: number;
  offerDiscountAmount: number;
  commission: number;
  driverEarnings: number;
  distance: number;
  estTime: number;
  timeTaken?: number;
  status: string;
  startedAt?: number;
  endedAt?: number;
  cancelledAt?: number;
  paymentStatus: string;
  paymentMethod?: string;
  pickupCoords: [number, number];
  dropOffCoords: [number, number];
  OTP: string;
  cancelledBy?: string;
  appliedOffer?: {
    offerId: string;
    discountAmount: number;
    offerType: string;
    originalCommission: number;
  };
}

export interface UserRideHistoryDTO
  extends Omit<RideHistoryDTO, 'commission' | 'driverEarnings' | 'driverId' | 'OTP'> {
  driverId: {
    _id: string;
    name: string;
  };
}

export interface DriverRideHistoryDTO extends Omit<RideHistoryDTO, 'userId' | 'OTP'> {
  userId: {
    _id: string;
    name: string;
  };
}

export interface RideHistoryWithDriverAndUser
  extends Omit<RideHistoryDTO, 'OTP' | 'userId' | 'driverId'> {
  driverId: { _id: string; name: string };
  userId: { _id: string; name: string };
}

export interface UserRideListDTO extends Omit<FullRideListView, 'commission' | 'driverEarnings'> {}
