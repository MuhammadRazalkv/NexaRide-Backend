import mongoose, { Schema, Document } from "mongoose";

interface IPricing extends Document {
  vehicleClass: "Basic" | "Premium" | "Luxury";
  farePerKm: number;
}

const PricingSchema: Schema = new Schema(
  {
    vehicleClass: {
      type: String,
      enum: ["Basic", "Premium", "Luxury"],
      required: true,
    },
    farePerKm: { type: Number, required: true },
  },
  { timestamps: true }
);

const Pricing = mongoose.model<IPricing>("Pricing", PricingSchema);

export default Pricing;
