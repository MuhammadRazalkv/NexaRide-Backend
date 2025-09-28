import mongoose, { Schema, Document } from 'mongoose';

export interface IOffer extends Document {
  title: string;
  type: string;
  value: number;
  maxDiscount: number;
  minFare: number;
  isActive: boolean;
  validFrom: number;
  validTill: number;
  usageLimitPerUser: number;
}

const OfferSchema = new Schema<IOffer>(
  {
    title: { type: String, required: true },
    type: { type: String, enum: ['percentage', 'flat'], required: true },
    value: { type: Number, required: true },
    maxDiscount: { type: Number, required: true },
    minFare: { type: Number, required: true },
    isActive: { type: Boolean, required: true, default: true },
    validFrom: { type: Number, required: true },
    validTill: { type: Number, required: true },
    usageLimitPerUser: { type: Number, required: true },
  },
  { timestamps: true },
);

const Offer = mongoose.model<IOffer>('Offers', OfferSchema);

export default Offer;
