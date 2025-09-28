import mongoose, { Schema, Document, ObjectId } from 'mongoose';

export interface IDrivers extends Document {
  googleId?: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  license_number: string;
  // isAvailable: String;
  vehicleId?: ObjectId;
  address: {
    street: string;
    city: string;
    state: string;
    pin_code: string;
  };
  dob: Date;
  license_exp: Date;
  verified: boolean;
  isBlocked: boolean;
  softBlock: boolean;
  rejectionReason?: string;
  status?: string;
  profilePic?: string;
  location: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude]
  };
}

const DriversSchema: Schema = new Schema(
  {
    googleId: { type: String },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: Number, required: true, unique: true },
    license_number: { type: String, required: true, unique: true },
    // isAvailable: { type: String ,enum:['online','offline','onRide'] , default: "offline" },
    vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle' },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pin_code: { type: Number, required: true },
    },
    dob: { type: Date, required: true },
    license_exp: { type: Date, required: true },
    verified: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    rejectionReason: { type: String },
    isBlocked: { type: Boolean, default: false },
    softBlock: { type: Boolean, default: false },
    profilePic: { type: String },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
  },
  { timestamps: true },
);

const Driver = mongoose.model<IDrivers>('Drivers', DriversSchema);

export default Driver;
