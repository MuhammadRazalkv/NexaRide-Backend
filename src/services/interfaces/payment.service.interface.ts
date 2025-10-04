import { DriverWalletResDTO, WalletResDTO } from '../../dtos/response/wallet.res.dto';
export interface IPaymentService {
  addMoneyToWallet(id: string, amount: number): Promise<string | null>;
  getWalletInfo(id: string, page: number): Promise<{ wallet: WalletResDTO | null; total: number }>;
  webHook(body: any, sig: string): Promise<void>;
  payUsingWallet(userId: string, rideId: string): Promise<void>;
  payUsingStripe(userId: string, rideId: string): Promise<string | null>;
  getDriverWalletInfo(
    driverId: string,
    page: number,
  ): Promise<{ wallet: DriverWalletResDTO | null; total: number }>;
  upgradeToPlus(id: string, type: string): Promise<string | null>;
  transactionSummary(
    id: string,
    requestedBy: 'user' | 'driver',
  ): Promise<{
    totalTransaction: number;
    usingWallet: number;
    usingStripe: number;
  }>;
  earningsSummary(id: string): Promise<{
    totalEarnings: number;
    Today: number;
    Week: number;
    Month: number;
  }>;
}
