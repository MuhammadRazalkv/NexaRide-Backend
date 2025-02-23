import User, { IUser } from "../models/UserModel";

class UserRepository {
    // async emailVerification(userData: IUser): Promise<IUser> {
    //     return await User.create(userData);
    // }

    async findUserByEmail(email: string): Promise<IUser | null> {
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
                throw new Error(`${field.charAt(0).toUpperCase() + field.slice(1)} ${info} already exists`);
            }
    
            throw new Error("Database operation failed. Please try again.");
        }
    }
    
    async changePassword(_id:string,password:string){
        return User.updateOne({_id},{password:password})
    }   
    

    // async getAllUsers(): Promise<IUser[]> {
    //     return await User.find();
    // }
}

export default new UserRepository();
