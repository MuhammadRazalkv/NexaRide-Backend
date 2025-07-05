import mongoose, { Schema, Document } from "mongoose";

export interface ISubscription extends Document {
  userId: mongoose.Types.ObjectId | string;
  amount: number;
  expiresAt: number;
  takenAt: number;
  type: string;
}

const SubscriptionSchema: Schema = new Schema<ISubscription>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: { type: Number, required: true },
    expiresAt: { type: Number, required: true },
    takenAt: { type: Number, required: true },
    type: {
      type: String,
      enum: ["yearly", "monthly"],
      required: true,
    },
  },
  { timestamps: true }
);

const Subscription = mongoose.model<ISubscription>(
  "Subscription",
  SubscriptionSchema
);
export default Subscription;
