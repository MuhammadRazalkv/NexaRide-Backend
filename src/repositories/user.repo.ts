import User, { IUser } from '../models/user.model';
import { BaseRepository } from './base.repo';
import { IUserRepo } from './interfaces/user.repo.interface';

export class UserRepository extends BaseRepository<IUser> implements IUserRepo {
  constructor() {
    super(User);
  }
}
