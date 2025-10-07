import { DriverWalletResDTO, WalletResDTO } from '../dtos/response/wallet.res.dto';
import { IDriverWallet } from '../models/driver.wallet.model';
import { IWallet } from '../models/user.wallet.model';

export class WalletMapper {
  static toUserWallet(data: IWallet): WalletResDTO {
    return {
      balance: data.balance,
      userId: data.userId as string,
      transactions: data.transactions,
    };
  }

  static toDriverWallet(data: IDriverWallet): DriverWalletResDTO {
    return {
      balance: data.balance,
      driverId: data.driverId as string,
      transactions: data.transactions,
    };
  }
}
