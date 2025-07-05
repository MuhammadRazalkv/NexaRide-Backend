import { IDriverWallet } from "../../models/driver.wallet.model";
import { IWallet } from "../../models/user.wallet.model";
export interface IPaymentService {
  addMoneyToWallet(id: string, amount: number): Promise<string | null>;
  getWalletInfo(id: string,page:number): Promise<{wallet:IWallet|null,total:number}>;
  webHook(body: any, sig: string): Promise<void>;
  payUsingWallet(userId: string, rideId: string): Promise<void>;
  payUsingStripe(userId: string, rideId: string): Promise<string | null>;
  getDriverWalletInfo(driverId: string,page:number): Promise<{wallet:IDriverWallet | null, total:number} >;
  upgradeToPlus(id: string, type: string): Promise<string | null>;
  transactionSummary(
    id: string,
    requestedBy: "user" | "driver"
  ): Promise<{
    totalTransaction: number;
    usingWallet: number;
    usingStripe: number;
  }>;
  earningsSummary(
    id: string
  ): Promise<{
    totalEarnings: number;
    Today: number;
    Week: number;
    Month: number;
  }>;
}
