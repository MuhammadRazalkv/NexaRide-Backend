import { BaseAccountDTO } from './base.res.dto';
import { DriverResDTO } from './driver.res.dto';
import { UserResDTO } from './user.dto';

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

export interface RideListView {}

export interface FullRideListView {
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
