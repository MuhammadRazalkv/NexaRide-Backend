import UserWallet, { IWallet } from '../models/user.wallet.model';
import DriverWallet from '../models/driver.wallet.model';
import CommissionModel, { ICommission } from '../models/commission.model';
import { IWalletRepo } from './interfaces/wallet.repo.interface';
import { BaseRepository } from './base.repo';
import mongoose from 'mongoose';
export class WalletRepo extends BaseRepository<IWallet> implements IWalletRepo {
  constructor() {
    super(UserWallet);
  }

  //! For user
  async getWalletInfo(userId: string) {
    return this.findOne({ userId });
  }

  // async addMoneyToUserWallet(userId: string, amount: number) {
  //   await this.model.findOneAndUpdate(
  //     { userId },
  //     {
  //       $inc: { balance: amount },
  //       $push: {
  //         transactions: {
  //           type: "credit",
  //           date: Date.now(),
  //           amount: amount,
  //         },
  //       },
  //     },
  //     { new: true, upsert: true }
  //   );
  // }

  // async getUserWalletBalanceById(userId: string) {
  //   return this.findOne({ userId });
  // }

  // async deductMoneyFromUser(userId: string, totalFare: number) {
  //   return this.model.findOneAndUpdate(
  //     { userId },
  //     {
  //       $inc: { balance: -totalFare },
  //       $push: {
  //         transactions: {
  //           type: "debit",
  //           date: Date.now(),
  //           amount: totalFare,
  //         },
  //       },
  //     }
  //   );
  // }

  // async getWalletWithPaginatedTransactions(
  //   userId: string,
  //   skip: number,
  //   limit: number
  // ) {
  //   const wallet = await this.model.findOne(
  //     { userId },
  //     {
  //       transactions: { $slice: [skip, limit] },
  //     }
  //   );

  //   const total = await this.model.aggregate([
  //     { $match: { userId: new mongoose.Types.ObjectId(userId) } },
  //     { $project: { count: { $size: "$transactions" } } },
  //   ]);

  //   return {
  //     transactions: wallet?.transactions || [],
  //     total: total[0]?.count || 0,
  //   };
  // }

  //! For driver
  async getDriverWalletInfo(driverId: string) {
    return DriverWallet.findOne({ driverId });
  }

  async addMoneyToDriver(driverId: string, rideId: string, amount: number) {
    return DriverWallet.findOneAndUpdate(
      { driverId },
      {
        $inc: { balance: amount },
        $push: {
          transactions: {
            type: 'credit',
            rideId,
            amount,
            date: Date.now(),
          },
        },
      },
      { new: true, upsert: true },
    );
  }

  async getEarningsSummary(
    driverId: string,
    today: number,
    week: number,
    month: number,
  ): Promise<{
    totalEarnings: number;
    Today: number;
    Week: number;
    Month: number;
  }> {
    const result = await DriverWallet.aggregate([
      {
        $match: { driverId: new mongoose.Types.ObjectId(driverId) },
      },
      {
        $unwind: '$transactions',
      },
      {
        $group: {
          _id: null,
          totalEarnings: {
            $sum: {
              $cond: [{ $eq: ['$transactions.type', 'credit'] }, '$transactions.amount', 0],
            },
          },
          Today: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gte: ['$transactions.date', today] },
                    { $eq: ['$transactions.type', 'credit'] },
                  ],
                },
                '$transactions.amount',
                0,
              ],
            },
          },
          Week: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gte: ['$transactions.date', week] },
                    { $eq: ['$transactions.type', 'credit'] },
                  ],
                },
                '$transactions.amount',
                0,
              ],
            },
          },
          Month: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gte: ['$transactions.date', month] },
                    { $eq: ['$transactions.type', 'credit'] },
                  ],
                },
                '$transactions.amount',
                0,
              ],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalEarnings: 1,
          Today: 1,
          Week: 1,
          Month: 1,
        },
      },
    ]);

    return (
      result[0] || {
        totalEarnings: 0,
        Today: 0,
        Week: 0,
        Month: 0,
      }
    );
  }

  //! Admin Commission
  async addToCommission(data: Partial<ICommission>) {
    return await CommissionModel.insertOne(data);
  }

  async getMonthlyCommission(): Promise<{ month: string; totalCommission: number }[]> {
    const monthlyCommissions = await CommissionModel.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          totalCommission: { $sum: '$commission' },
        },
      },
      {
        $sort: {
          '_id.year': 1,
          '_id.month': 1,
        },
      },
      {
        $project: {
          _id: 0,
          month: {
            $concat: [
              {
                $arrayElemAt: [
                  [
                    '',
                    'Jan',
                    'Feb',
                    'Mar',
                    'Apr',
                    'May',
                    'Jun',
                    'Jul',
                    'Aug',
                    'Sep',
                    'Oct',
                    'Nov',
                    'Dec',
                  ],
                  '$_id.month',
                ],
              },
              ' ',
              { $toString: '$_id.year' },
            ],
          },
          totalCommission: 1,
        },
      },
    ]);
    return monthlyCommissions;
  }
}
