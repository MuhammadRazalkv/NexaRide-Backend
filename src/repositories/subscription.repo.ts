import { ISubscription } from "../models/subscription.model";
import Subscription from "../models/subscription.model";
import { IPremiumUsers } from "../services/interfaces/admin.service.interface";
import { BaseRepository } from "./base.repo";
import { ISubscriptionRepo } from "./interfaces/subscription.repo.interface";
export class SubscriptionRepo
  extends BaseRepository<ISubscription>
  implements ISubscriptionRepo
{
  constructor() {
    super(Subscription);
  }

  async subscriptionInfoWithUser(
    filterBy: string,
    skip: number,
    limit: number
  ): Promise<IPremiumUsers[]> {
    const now = Date.now();
    let match: Record<string, any> = {};

    if (filterBy === "Active") {
      match.expiresAt = { $gte: now };
    } else if (filterBy === "InActive") {
      match.expiresAt = { $lt: now };
    }

    const subscriptions = await Subscription.find(match).sort({createdAt:-1})
      .skip(skip)
      .limit(limit)
      .populate({
        path: "userId",
        select: "name",
      })
      .lean<IPremiumUsers[]>();

    return subscriptions;
  }

  async totalEarnings(): Promise<number> {
    const result = await Subscription.aggregate([
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: "$amount" },
        },
      },
    ]);
    return result[0].totalEarnings || 0;
  }
}
