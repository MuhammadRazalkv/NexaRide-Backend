import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
    googleId?:string;
    name: string;
    email: string;
    phone?: number;
    profilePic?: string;
    password?: string;
    isBlocked: boolean;

}

const userSchema = new Schema<IUser>(
    {
        googleId:{type:String} ,
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        phone: { type: Number, unique: true },
        password: { type: String },
        isBlocked: { type: Boolean, default: false },
        profilePic: { type: String},
    },
    { timestamps: true }
);



export default model<IUser>('User', userSchema);

// export interface UFilterOptions {

//     startDate?: string;
//     endDate?: string;
//     isBlocked?: boolean;
// }