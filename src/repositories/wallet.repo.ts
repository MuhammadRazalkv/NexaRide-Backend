import UserWallet, { IWallet } from "../models/user.wallet.model";
import DriverWallet from "../models/driver.wallet.model";
import CommissionModel, { ICommission } from "../models/commission.model";
import { IWalletRepo } from "./interfaces/wallet.repo.interface";
import { BaseRepository } from "./base.repo";
export class WalletRepo extends BaseRepository<IWallet> implements IWalletRepo {
  constructor() {
    super(UserWallet);
  }

  //! For user
  async getWalletInfo(userId: string) {
    return this.findOne({ userId });
  }

  async addMoneyToUserWallet(userId: string, amount: number) {
    await this.model.findOneAndUpdate(
      { userId },
      {
        $inc: { balance: amount },
        $push: {
          transactions: {
            type: "credit",
            date: Date.now(),
            amount: amount,
          },
        },
      },
      { new: true, upsert: true }
    );
  }

  async getUserWalletBalanceById(userId: string) {
    return this.findOne({ userId });
  }

  async deductMoneyFromUser(userId: string, totalFare: number) {
    return this.model.findOneAndUpdate(
      { userId },
      {
        $inc: { balance: -totalFare },
        $push: {
          transactions: {
            type: "debit",
            date: Date.now(),
            amount: totalFare,
          },
        },
      }
    );
  }

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
            type: "credit",
            rideId,
            amount,
            date: Date.now(),
          },
        },
      },
      { new: true, upsert: true }
    );
  }

  //! Admin Commission
  async addToCommission(data: Partial<ICommission>) {
    return CommissionModel.insertOne(data);
  }
}
