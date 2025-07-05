import { ICommission } from "../../models/commission.model";
import { BaseRepository } from "../base.repo";

export interface ICommissionRepo extends BaseRepository<ICommission> {
  getMonthlyCommission(): Promise<{ month: string; totalCommission: number }[]>;
  totalEarnings():Promise<number>
}
