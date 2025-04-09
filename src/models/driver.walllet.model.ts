import mongoose from "mongoose";
import { Schema, model, Document } from "mongoose";
export interface IDriverWallet extends Document {
  driverId: mongoose.Types.ObjectId | string;
  balance: number;
  transactions?: [
    {
      type: string;
      date: number;
      amount: number;
      rideId?: string;
    }
  ];
}

const driverWalletSchema = new Schema<IDriverWallet>(
  {
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      required: true,
    },
    balance: { type: Number, required: true, default: 0 },
    transactions: [
      {
        type: {
          type: String,
          enum: ["credit", "debit"], // credit = earned, debit = deducted
          required: true,
        },
        rideId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Ride",
        },
        amount: { type: Number, required: true },
        date: { type: Number, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);
export default mongoose.model<IDriverWallet>(
  "DriverWallet",
  driverWalletSchema
);
