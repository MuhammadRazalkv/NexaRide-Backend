import { UpdateResult } from "mongoose";
import User, { IUser } from "../models/user.model";
import { BaseRepository } from "./base.repo";
import { IUserRepo } from "./interfaces/user.repo.interface";
import { AppError } from "../utils/appError";
import { HttpStatus } from "../constants/httpStatusCodes";
import { messages } from "../constants/httpMessages";

export class UserRepository extends BaseRepository<IUser> implements IUserRepo {
  constructor() {
    super(User);
  }

  async findUserByEmail(email: string): Promise<IUser | null> {
    return this.findOne({ email });
  }

  async findUserById(id: string): Promise<IUser | null> {
    return this.findById(id);
  }

  async registerNewUser(userData: Partial<IUser>) {
    try {
      return await this.create(userData);
    } catch (error: any) {
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        const info = field === "phone" ? "number" : "address";
        throw new AppError(
          HttpStatus.CONFLICT,
          `${
            field.charAt(0).toUpperCase() + field.slice(1)
          } ${info} already exists`
        );
      }
      throw new AppError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        messages.DATABASE_OPERATION_FAILED
      );
    }
  }

  async changePassword(id: string, password: string): Promise<UpdateResult> {
    return this.updateOne({ _id: id }, { password });
  }

  async getAllUsers(
    skip: number,
    limit: number,
    search: string,
    sort: string
  ): Promise<IUser[]> {
    return await this.model
      .find({
        name: { $regex: search, $options: "i" },
      })
      .sort({ name: sort === "A-Z" ? 1 : -1 })
      .skip(skip)
      .limit(limit)
      .select("_id name email isBlocked")
      .lean();
  }
  async getAllUserCount(search: string): Promise<number> {
    return await User.find({
      name: { $regex: search, $options: "i" },
    }).countDocuments();
  }

  async blockUnblockUser(id: string, status: boolean) {
    return this.updateById(id, { $set: { isBlocked: !status } });
  }

  async updateName(id: string, name: string) {
    return this.updateById(id, { $set: { name } });
  }

  async updatePhone(id: string, phone: number) {
    try {
      return await this.updateById(id, { $set: { phone } });
    } catch (error: any) {
      console.error("Database error:", error);
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        throw new AppError(
          HttpStatus.CONFLICT,
          `${
            field.charAt(0).toUpperCase() + field.slice(1)
          } phone already exists`
        );
      }
      throw new AppError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        "Database operation failed. Please try again."
      );
    }
  }

  async updatePfp(id: string, url: string) {
    return this.updateById(id, { $set: { profilePic: url } });
  }
}
