import mongoose, { Schema, Document } from "mongoose";

export interface IRideHistory extends Document {
  userId: mongoose.Types.ObjectId | string;
  driverId: mongoose.Types.ObjectId | string;
  pickupLocation: string;
  dropOffLocation: string;
  totalFare: number;
  distance: number; // In km
  estTime: number;
  timeTaken?: number; // In minutes
  status: string;
  startedAt?: Date;
  endedAt?: Date;
  canceledAt?: Date;
  paymentStatus: string;
  pickupCoords: [number, number];
  dropOffCoords: [number, number];
  OTP:string
}

const RideHistorySchema: Schema = new Schema<IRideHistory>({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Driver",
    required: true,
  },
  pickupCoords: { type: [Number], required: true },
  dropOffCoords: { type: [Number], required: true },
  pickupLocation: { type: String, required: true },
  dropOffLocation: { type: String, required: true },
  totalFare: { type: Number, required: true },
  distance: { type: Number, required: true },
  estTime: { type: Number, required: true },
  timeTaken: { type: Number, required: false },
  status: {
    type: String,
    enum: ["completed", "canceled", "ongoing"],
    required: true,
  },
  startedAt: { type: Date },
  endedAt: { type: Date },
  canceledAt: { type: Date },
  paymentStatus: {
    type: String,
    enum: ["pending", "completed", "failed"],
    default: "pending",
  },
  OTP:{type:String,required:true}
});

export default mongoose.model<IRideHistory>("RideHistory", RideHistorySchema);
