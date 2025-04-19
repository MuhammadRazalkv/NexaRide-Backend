import { IWallet } from "../../models/user.wallet.model";
import { IDriverWallet } from "../../models/driver.wallet.model";
import { ICommission } from "../../models/commission.model";
export interface IWalletRepo {
  getWalletInfo(userId: string): Promise<IWallet | null>;
  addMoneyToUserWallet(userId: string, amount: number): Promise<void>;
  getUserWalletBalanceById(userId: string): Promise<IWallet | null>;
  deductMoneyFromUser(
    userId: string,
    totalFare: number
  ): Promise<IWallet | null>;
//! Driver 
  getDriverWalletInfo(driverId: string): Promise<IDriverWallet | null>;
  addMoneyToDriver(
    driverId: string,
    rideId: string,
    amount: number
  ): Promise<IDriverWallet>;
//! commission
  addToCommission(data: Partial<ICommission>): Promise<ICommission>;
}
