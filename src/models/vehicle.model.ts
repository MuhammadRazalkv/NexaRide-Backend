import mongoose, { Schema, Document, ObjectId } from 'mongoose';

export interface IVehicle extends Document {
  driverId: mongoose.Types.ObjectId;
  nameOfOwner: string;
  addressOfOwner: string;
  brand: string;
  vehicleModel: string;
  color: string;
  numberPlate: string;
  regDate: Date;
  expDate: Date;
  insuranceProvider: string;
  policyNumber: string;
  vehicleImages: {
    frontView: string;
    rearView: string;
    interiorView: string;
  };
  status?: string;
  rejectionReason?: string;
  verified: boolean;
  category?: string;
}

const VehicleSchema: Schema = new Schema(
  {
    // driverId: { type: Schema.Types.ObjectId, required: true, ref: 'Drivers', unique:true },
    nameOfOwner: { type: String, required: true, trim: true },
    addressOfOwner: { type: String, required: true, trim: true },
    brand: { type: String, required: true, trim: true },
    vehicleModel: { type: String, required: true, trim: true },
    color: { type: String, required: true, trim: true },
    numberPlate: { type: String, required: true, trim: true },
    regDate: { type: Date, required: true },
    expDate: { type: Date, required: true },
    insuranceProvider: { type: String, required: true, trim: true },
    policyNumber: { type: String, required: true, trim: true },
    vehicleImages: {
      frontView: { type: String, required: true, trim: true },
      rearView: { type: String, required: true, trim: true },
      interiorView: { type: String, required: true, trim: true },
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    rejectionReason: { type: String },
    verified: { type: Boolean, default: false },
    category: {
      type: String,
      enum: ['Basic', 'Premium', 'Luxury'],
      require: false,
    },
  },
  { timestamps: true },
);

const Vehicle = mongoose.model<IVehicle>('Vehicle', VehicleSchema);

export default Vehicle;
