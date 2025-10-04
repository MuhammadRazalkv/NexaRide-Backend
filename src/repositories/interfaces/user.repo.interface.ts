import { IUser } from '../../models/user.model';
import { IBaseRepository } from './base.repo.interface';

export interface IUserRepo extends IBaseRepository<IUser> {
  // findUserByEmail(email: string): Promise<IUser | null>
  // findUserById(id: string): Promise<IUser | null>
  registerNewUser(userData: Partial<IUser>): Promise<IUser>;
  // changePassword(_id: string, password: string):Promise<UpdateResult>
  // getAllUsers(skip:number,limit:number,search:string,sort:string): Promise<IUser[]>
  // blockUnblockUser(id: string, status: boolean): Promise<IUser|null>
  // updateName(id: string, name: string): Promise<IUser|null>
  // updatePhone(id: string, phone: number): Promise<IUser|null>
  // updatePfp(id: string, url: string): Promise< IUser | null>
  // getAllUserCount(search:string): Promise<number>
}
