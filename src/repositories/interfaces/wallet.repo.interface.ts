import { IWallet } from '../../models/user.wallet.model';
import { IDriverWallet } from '../../models/driver.wallet.model';
import { ICommission } from '../../models/commission.model';
import { BaseRepository } from '../base.repo';
export interface IWalletRepo extends BaseRepository<IWallet> {
  //! Driver
  getDriverWalletInfo(driverId: string): Promise<IDriverWallet | null>;
  addMoneyToDriver(driverId: string, rideId: string, amount: number): Promise<IDriverWallet>;
  getEarningsSummary(
    driverId: string,
    today: number,
    week: number,
    month: number,
  ): Promise<{
    totalEarnings: number;
    Today: number;
    Week: number;
    Month: number;
  }>;
  //! commission
  addToCommission(data: Partial<ICommission>): Promise<ICommission>;
  getMonthlyCommission(): Promise<{ month: string; totalCommission: number }[]>;
}
