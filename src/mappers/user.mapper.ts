import { BaseAccountDTO } from '../dtos/response/base.res.dto';
import { UserResDTO } from '../dtos/response/user.dto';
import { IUser } from '../models/user.model';

export class UserMapper {
  static toUser(user: IUser): UserResDTO {
    return {
      _id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || 0,
      isBlocked: user.isBlocked,
      softBlock: user.softBlock,
    };
  }

  static toUserList(users: IUser[]): UserResDTO[] {
    return users.map((user) => this.toUser(user));
  }

  static toUserPreview(user: IUser): BaseAccountDTO {
    return {
      _id: user.id,
      name: user.name,
      email: user.email,
      isBlocked: user.isBlocked,
      softBlock: user.isBlocked,
      phone: user.phone || 0,
    };
  }
}
