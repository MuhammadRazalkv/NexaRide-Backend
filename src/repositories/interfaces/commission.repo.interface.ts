import { FilterQuery } from 'mongoose';
import { ICommission } from '../../models/commission.model';
import { BaseRepository } from '../base.repo';

export interface ICommissionRepo extends BaseRepository<ICommission> {
  getMonthlyCommission(): Promise<{ month: string; totalCommission: number }[]>;
  totalEarnings(match?: FilterQuery<ICommission>): Promise<number>;
}
