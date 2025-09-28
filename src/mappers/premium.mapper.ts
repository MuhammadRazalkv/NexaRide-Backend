import { PremiumUsersResDTO } from '../dtos/response/premium.user.res.dto';
import { IPremiumUsers } from '../services/interfaces/admin.service.interface';

export class PremiumUser {
  static toPremiumUser(user: IPremiumUsers): PremiumUsersResDTO {
    return {
      user: user.userId,
      amount: user.amount,
      expiresAt: user.expiresAt,
      takenAt: user.takenAt,
      type: user.type,
    };
  }
  static toPremiumUserList(data: IPremiumUsers[]): PremiumUsersResDTO[] {
    return data.map((d) => this.toPremiumUser(d));
  }
}
