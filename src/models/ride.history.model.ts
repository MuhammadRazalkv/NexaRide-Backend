import mongoose, { Schema, Document } from "mongoose";

export interface IRideHistory extends Document {
  userId: mongoose.Types.ObjectId | string;
  driverId: mongoose.Types.ObjectId | string;
  pickupLocation: string;
  dropOffLocation: string;
  totalFare: number;
  baseFare: number;
  discountAmount: number;
  commission: number; // Platform fee
  driverEarnings: number;
  distance: number; // In km
  estTime: number;
  timeTaken?: number; // In minutes
  status: string;
  startedAt?: Number;
  endedAt?: number;
  cancelledAt?: number;
  paymentStatus: string;
  pickupCoords: [number, number];
  dropOffCoords: [number, number];
  OTP: string;
  cancelledBy?: string;
  appliedOffer?: {
    offerId: string;
    discountAmount: number;
    offerType: string;
    originalCommission: number;
  };
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
  baseFare: { type: Number, required: true },
  discountAmount: { type: Number, required: true },
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
    enum: ["pending", "completed", "failed", "Not required"],
    default: "pending",
  },
  OTP: { type: String, required: true },
  cancelledBy: { type: String, enum: ["driver", "user"] },
  appliedOffer: {
    offerId: { type: mongoose.Schema.Types.ObjectId, ref: "Offers" },
    discountAmount: { type: Number, default: 0 },
    offerType: { type: String, enum: ["percentage", "flat"], required: false },
    originalCommission: { type: Number },
  },
});

RideHistorySchema.index({ userId: 1 });
RideHistorySchema.index({ driverId: 1 });
export default mongoose.model<IRideHistory>("RideHistory", RideHistorySchema);
