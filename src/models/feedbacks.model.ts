import mongoose, { Schema, Document } from 'mongoose';

export interface IFeedback extends Document {
  rideId: mongoose.Types.ObjectId;
  ratedById: mongoose.Types.ObjectId;
  ratedByRole: 'user' | 'driver';
  ratedAgainstId: mongoose.Types.ObjectId; // The person who is being rated
  ratedAgainstRole: 'user' | 'driver';
  rating: number;
  feedback?: string;
}

const FeedbackSchema = new Schema<IFeedback>(
  {
    rideId: { type: Schema.Types.ObjectId, ref: 'RideHistory', required: true },
    ratedById: { type: Schema.Types.ObjectId, required: true },
    ratedByRole: { type: String, enum: ['user', 'driver'], required: true },
    ratedAgainstId: { type: Schema.Types.ObjectId, required: true },
    ratedAgainstRole: { type: String, enum: ['user', 'driver'], required: true },
    rating: { type: Number, required: true, min: 0.5, max: 5 },
    feedback: { type: String },
  },
  { timestamps: true },
);

const Feedback = mongoose.model<IFeedback>('Feedback', FeedbackSchema);

export default Feedback;
