import { IDriverWallet } from "../../models/driver.wallet.model";
import { IWallet } from "../../models/user.wallet.model";
export interface IPaymentService {
  addMoneyToWallet(id: string, amount: number): Promise<string | null>;
  getWalletInfo(id: string): Promise<IWallet | null>;
  webHook(body: any, sig: string): Promise<void>;
  payUsingWallet(userId: string, rideId: string): Promise<void>;
  payUsingStripe(userId: string, rideId: string): Promise<string | null>;
  getDriverWalletInfo(driverId: string): Promise<IDriverWallet | null>;
}
