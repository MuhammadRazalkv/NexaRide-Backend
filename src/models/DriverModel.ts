import mongoose, { Schema, Document, ObjectId } from 'mongoose';

export interface IDrivers extends Document {
  googleId?:string;
  name: string;
  email: string;
  password: string;
  phone: string; 
  license_number: string;
  availability?: boolean;
  vehicle_id?: ObjectId;
  street: string;
  city: string;
  state: string;
  pin_code: string; 
  dob: Date;
  license_exp: Date;
  verified: boolean;
  isBlocked: boolean;
  rejectionReason?:string;
  status?:string;
  profilePic?:string;
}

const DriversSchema: Schema = new Schema({
  googleId:{type:String},
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: Number, required: true, unique: true },
  license_number: { type: String, required: true, unique: true },
  availability: { type: Boolean, },
  vehicle_id: { type: Schema.Types.ObjectId , ref:'Vehicle' },
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pin_code: { type: Number, required: true },
  dob: { type: Date, required: true },
  license_exp: { type: Date, required: true },
  verified: { type: Boolean, default: false },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  rejectionReason:{type:String },
  isBlocked:{type:Boolean , default : false},
  profilePic: { type: String},
}, { timestamps: true }
)

const Driver = mongoose.model<IDrivers>('Drivers', DriversSchema);

export default Driver;

