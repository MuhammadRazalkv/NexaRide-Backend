import mongoose from 'mongoose';
import { ISubscription } from '../models/subscription.model';
import Subscription from '../models/subscription.model';
import { IPremiumUsers } from '../services/interfaces/admin.service.interface';
import { BaseRepository } from './base.repo';
import { ISubscriptionRepo } from './interfaces/subscription.repo.interface';
export class SubscriptionRepo extends BaseRepository<ISubscription> implements ISubscriptionRepo {
  constructor() {
    super(Subscription);
  }

  async subscriptionInfoWithUser(
    filterBy: string,
    search: string,
    sort: 'A-Z' | 'Z-A' | string,
    skip: number,
    limit: number,
  ): Promise<{ subscriptions: IPremiumUsers[]; total: number; totalEarnings: number }> {
    const now = Date.now();
    const match: Record<string, any> = {};
    if (filterBy === 'Active') match.expiresAt = { $gte: now };
    else if (filterBy === 'InActive') match.expiresAt = { $lt: now };

    const pipeline: mongoose.PipelineStage[] = [
      { $match: match },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
    ];

    if (search && search.trim()) {
      pipeline.push({
        $match: {
          'user.name': { $regex: search, $options: 'i' },
        },
      });
    }

    // Facet to get paginated results, total count, and total earnings
    pipeline.push({
      $facet: {
        results: [
          { $sort: { 'user.name': sort === 'Z-A' ? -1 : 1 } },
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              _id: 1,
              amount: 1,
              expiresAt: 1,
              takenAt: 1,
              type: 1,
              'user.name': 1,
            },
          },
        ],
        totalCount: [{ $count: 'count' }],
        totalEarnings: [
          {
            $group: {
              _id: null,
              totalEarnings: { $sum: '$amount' },
            },
          },
        ],
      },
    });

    const [data] = await this.model.aggregate(pipeline);

    const subscriptions = data.results;
    const total = data.totalCount[0]?.count ?? 0;
    const totalEarnings = data.totalEarnings[0]?.totalEarnings ?? 0;

    return { subscriptions, total, totalEarnings };
  }
}
