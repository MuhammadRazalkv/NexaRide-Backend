import commissionModel, { ICommission } from "../models/commission.model";
import { BaseRepository } from "./base.repo";
import { ICommissionRepo } from "./interfaces/commission.repo.interface";

export class CommissionRepo
  extends BaseRepository<ICommission>
  implements ICommissionRepo
{
  constructor() {
    super(commissionModel);
  }

  async getMonthlyCommission(): Promise<
    { month: string; totalCommission: number }[]
  > {
    const monthlyCommissions = await commissionModel.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          totalCommission: { $sum: "$commission" },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
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
                    "",
                    "Jan",
                    "Feb",
                    "Mar",
                    "Apr",
                    "May",
                    "Jun",
                    "Jul",
                    "Aug",
                    "Sep",
                    "Oct",
                    "Nov",
                    "Dec",
                  ],
                  "$_id.month",
                ],
              },
              " ",
              { $toString: "$_id.year" },
            ],
          },
          totalCommission: 1,
        },
      },
    ]);
    return monthlyCommissions;
  }

  async totalEarnings(): Promise<number> {
    const result = await commissionModel.aggregate([
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: "$commission" },
        },
      },
    ]);
    return result[0].totalEarnings || 0;
  }
}
