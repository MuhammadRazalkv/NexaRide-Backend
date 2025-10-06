import { IUser } from '../../models/user.model';
import { IBaseRepository } from './base.repo.interface';

export interface IUserRepo extends IBaseRepository<IUser> {}
