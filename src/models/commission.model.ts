import mongoose, { Schema, Document } from 'mongoose';

export interface ICommission extends Document {
  rideId: mongoose.Types.ObjectId | string;
  driverId: mongoose.Types.ObjectId | string;
  originalFare: number;
  totalFare: number;
  offerDiscount: number;
  premiumDiscount: number;
  originalCommission: number;
  commission: number;
  driverEarnings: number;
  paymentMethod: string;
}

const CommissionSchema: Schema = new Schema<ICommission>(
  {
    rideId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RideHistory',
      required: true,
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      required: true,
    },
    originalFare: { type: Number, required: true },
    totalFare: { type: Number, required: true },
    originalCommission: { type: Number, required: true },
    commission: { type: Number, required: true },
    offerDiscount: { type: Number, required: true },
    premiumDiscount: { type: Number, required: true },
    driverEarnings: { type: Number, required: true },

    paymentMethod: {
      type: String,
      enum: ['wallet', 'stripe'],
      required: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model<ICommission>('Commission', CommissionSchema);
