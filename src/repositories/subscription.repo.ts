import { ISubscription } from "../models/subscription.model";
import Subscription from "../models/subscription.model";
import { BaseRepository } from "./base.repo";
import { ISubscriptionRepo } from "./interfaces/subscription.repo.interface";
export class SubscriptionRepo
  extends BaseRepository<ISubscription>
  implements ISubscriptionRepo
{
  constructor() {
    super(Subscription);
  }
}
