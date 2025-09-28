import { CommissionResDTO } from '../dtos/response/commission.res.dto';
import { ICommission } from '../models/commission.model';

export class CommissionMapper {
  static toCommission(data: ICommission): CommissionResDTO {
    return {
      driverId: data.driverId.toString(),
      rideId: data.rideId.toString(),
      commission: data.commission,
      driverEarnings: data.driverEarnings,
      offerDiscount: data.offerDiscount,
      originalCommission: data.originalCommission,
      originalFare: data.originalFare,
      paymentMethod: data.paymentMethod,
      premiumDiscount: data.premiumDiscount,
      totalFare: data.totalFare,
    };
  }

  static toCommissionList(data: ICommission[]): CommissionResDTO[] {
    return data.map((d) => this.toCommission(d));
  }
}
