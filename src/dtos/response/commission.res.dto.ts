export interface CommissionResDTO {
  _id:string,
  rideId: string;
  driverId: string;
  originalFare: number;
  totalFare: number;
  offerDiscount: number;
  premiumDiscount: number;
  originalCommission: number;
  commission: number;
  driverEarnings: number;
  paymentMethod: string;
}
