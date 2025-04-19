import mongoose from "mongoose";
import { Schema, model, Document } from "mongoose";

export interface IWallet extends Document {
  userId: mongoose.Types.ObjectId | string;
  balance: number;
  transactions?: [
    {
      type: string;
      date: number;
      amount: number;
    }
  ];
}

const userWallet = new Schema<IWallet>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    balance: { type: Number, required: true, default: 0 },
    transactions: [
      {
        type: {
          type: String,
          enum: ["credit", "debit"],
          //   required: true,
        },
        date: { type: Number },
        amount: { type: Number },
      },
    ],
  },
  { timestamps: true }
);

export default model<IWallet>("UserWallet", userWallet);
