import mongoose from "mongoose";
import { ObjectId } from "mongoose";
import UserWallet from "../models/user.wallet.model";
import { IWallet } from "../models/user.wallet.model";
import DriverWallet from "../models/driver.walllet.model";
import CommissionModel, { ICommission } from "../models/commission.model";
import { date } from "zod";
class WalletRepo {
  //! For user
  async getWalletInfo(userId: string) {
    return await UserWallet.findOne({ userId });
  }
  async addMoneyToUserWallet(userId: string, amount: number) {
    await UserWallet.findOneAndUpdate(
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
    return await UserWallet.findOne({ userId });
  }

  async deductMoneyFromUser(userId: string, totalFare: number) {
    return await UserWallet.findOneAndUpdate(
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
    return await DriverWallet.findOne({ driverId });
  }

  async addMoneyToDriver(driverId: string, rideId: string, amount: number) {
    return await DriverWallet.findOneAndUpdate(
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
      },{new:true,upsert:true}
    );
  }

  //! Admin Commission
  async addToCommission(data: Partial<ICommission>) {
    return await CommissionModel.insertOne(data);
  }
}

export default new WalletRepo();
