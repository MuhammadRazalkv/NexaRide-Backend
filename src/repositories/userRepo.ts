import User, { IUser } from "../models/UserModel";

class UserRepository {
  // async emailVerification(userData: IUser): Promise<IUser> {
  //     return await User.create(userData);
  // }

  async findUserByEmail(email: string): Promise<IUser | null> {
    let user = await User.findOne({ email });
    console.log(user);

    return await User.findOne({ email });
  }

  async findUserById(id: string): Promise<IUser | null> {
    return await User.findById(id);
  }

  async registerNewUser(userData: Partial<IUser>) {
    try {
      return await User.create(userData);
    } catch (error: any) {
      console.error("Database error:", error);

      // Handle duplicate key errors (MongoDB error code 11000)
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        const info = field === "phone" ? "number" : "address";
        throw new Error(
          `${
            field.charAt(0).toUpperCase() + field.slice(1)
          } ${info} already exists`
        );
      }

      throw new Error("Database operation failed. Please try again.");
    }
  }

  async changePassword(_id: string, password: string) {
    return User.updateOne({ _id }, { password: password });
  }

  async getAllUsers(): Promise<IUser[]> {
    return await User.find().select("_id name email isBlocked").lean();
  }

  async blockUnblockUser(id: string, status: boolean) {
    return await User.findByIdAndUpdate(
      id,
      { $set: { isBlocked: !status } },
      { new: true }
    );
  }

  async updateName(id: string, name: string) {
    return await User.findByIdAndUpdate(id, { $set: { name } }, { new: true });
  }
  async updatePhone(id: string, phone: number) {
    try {
      return await User.findByIdAndUpdate(
        id,
        { $set: { phone } },
        { new: true }
      );
    } catch (error: any) {
      console.error("Database error:", error);

      // Handle duplicate key errors (MongoDB error code 11000)
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        throw new Error(
          `${
            field.charAt(0).toUpperCase() + field.slice(1)
          } phone already exists `
        );
      }

      throw new Error("Database operation failed. Please try again.");
    }
  }

  async updatePfp(id: string, url: string) {
    return await User.findByIdAndUpdate(
      id,
      { $set: { profilePic: url } },
      { new: true }
    );
  }
}

export default new UserRepository();
