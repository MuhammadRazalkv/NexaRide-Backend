import mongoose, { Schema, Document } from "mongoose";

export interface IRideHistory extends Document {
  userId: mongoose.Types.ObjectId | string;
  driverId: mongoose.Types.ObjectId | string;
  pickupLocation: string;
  dropOffLocation: string;
  totalFare: number;
  commission?: number, // Platform fee 
  driverEarnings?: number,
  distance: number; // In km
  estTime: number;
  timeTaken?: number; // In minutes
  status: string;
  startedAt?: Number;
  endedAt?: number;
  cancelledAt?:number;
  paymentStatus: string;
  pickupCoords: [number, number];
  dropOffCoords: [number, number];
  OTP:string
  cancelledBy?:string
}

const RideHistorySchema: Schema = new Schema<IRideHistory>({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Drivers",
    required: true,
  },
  pickupCoords: { type: [Number], required: true },
  dropOffCoords: { type: [Number], required: true },
  pickupLocation: { type: String, required: true },
  dropOffLocation: { type: String, required: true },
  totalFare: { type: Number, required: true },
  commission: { type: Number },
  driverEarnings: { type: Number },
  distance: { type: Number, required: true },
  estTime: { type: Number, required: true },
  timeTaken: { type: Number, required: false },
  status: {
    type: String,
    enum: ["completed", "canceled", "ongoing"],
    required: true,
  },
  startedAt: { type: Number },
  endedAt: { type: Number },
  cancelledAt: { type: Number },
  paymentStatus: {
    type: String,
    enum: ["pending", "completed", "failed" , 'Not required'],
    default: "pending",
  },
  OTP:{type:String,required:true},
  cancelledBy:{type:String,enum:['driver',"user"]}
});

RideHistorySchema.index({userId:1})
RideHistorySchema.index({driverId:1})
export default mongoose.model<IRideHistory>("RideHistory", RideHistorySchema);
