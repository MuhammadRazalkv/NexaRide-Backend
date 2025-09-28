import { IBaseRepository } from './base.repo.interface';
import { ISubscription } from '../../models/subscription.model';
import { IPremiumUsers } from '../../services/interfaces/admin.service.interface';
export interface ISubscriptionRepo extends IBaseRepository<ISubscription> {
  subscriptionInfoWithUser(filterBy: string, skip: number, limit: number): Promise<IPremiumUsers[]>;
  totalEarnings(): Promise<number>;
}
