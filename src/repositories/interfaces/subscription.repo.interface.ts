import { IBaseRepository } from './base.repo.interface';
import { ISubscription } from '../../models/subscription.model';
import { IPremiumUsers } from '../../services/interfaces/admin.service.interface';
export interface ISubscriptionRepo extends IBaseRepository<ISubscription> {
  subscriptionInfoWithUser(
    filterBy: string,
    search: string,
    sort: string,
    skip: number,
    limit: number,
  ): Promise<{ subscriptions: IPremiumUsers[]; total: number; totalEarnings: number }>;
}
