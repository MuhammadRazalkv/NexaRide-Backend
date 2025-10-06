import { PremiumUsersResDTO } from '../dtos/response/premium.user.res.dto';
import { SubscriptionResDTO } from '../dtos/response/subscription.res.dto';
import { ISubscription } from '../models/subscription.model';
import { IPremiumUsers } from '../services/interfaces/admin.service.interface';

export class PremiumUser {
  static toPremiumUser(data: IPremiumUsers): PremiumUsersResDTO {
    return {
      user: data.user.name,
      amount: data.amount,
      expiresAt: data.expiresAt,
      takenAt: data.takenAt,
      type: data.type,
    };
  }
  static toPremiumUserList(data: IPremiumUsers[]): PremiumUsersResDTO[] {
    return data.map((d) => this.toPremiumUser(d));
  }
  static toSubscription(data: ISubscription): SubscriptionResDTO {
    return {
      userId: data.userId as string,
      amount: data.amount,
      expiresAt: data.expiresAt,
      takenAt: data.takenAt,
      type: data.type,
    };
  }

  static toSubscriptionList(data: ISubscription[]): SubscriptionResDTO[] {
    return data.map((d) => this.toSubscription(d));
  }
}
