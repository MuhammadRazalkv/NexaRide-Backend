import mongoose, { Schema, Document } from "mongoose";

export interface ICommission extends Document {
  rideId: mongoose.Types.ObjectId | string;
  driverId: mongoose.Types.ObjectId | string;
  totalFare: number;
  commission?: number;
  driverEarnings?: number;
  paymentMethod: string;
}

const CommissionSchema: Schema = new Schema<ICommission>({
  rideId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "RideHistory",
    required: true,
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Driver",
    required: true,
  },
  totalFare: { type: Number, required: true },
  commission: { type: Number, required: true },
  driverEarnings: { type: Number, required: true },

  paymentMethod: {
    type: String,
    enum: ["wallet", "stripe"],
    required: true,
  },
});

export default mongoose.model<ICommission>("Commission", CommissionSchema);
