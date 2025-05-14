import mongoose, { Schema, Document } from "mongoose";

export interface IOfferUsage extends Document {
  userId: mongoose.Types.ObjectId | string;
  offerId: mongoose.Types.ObjectId | string;
  usageCount: number;
}

const OfferUsageSchema = new Schema<IOfferUsage>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    offerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Offers",
      required: true,
    },
    usageCount: { type: Number, required: true },
  },
  { timestamps: true }
);

const OfferLimit = mongoose.model<IOfferUsage>("OfferLimit", OfferUsageSchema);

export default OfferLimit;
