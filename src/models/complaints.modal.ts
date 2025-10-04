import mongoose, { Schema, Document } from 'mongoose';

export interface IComplaints extends Document {
  rideId: string;
  filedById: string;
  filedByRole: 'user' | 'driver';
  complaintReason: string;
  description?: string;
  status?: 'pending' | 'resolved' | 'rejected';
  warningMailSend?: boolean;
  createdAt: string;
}

const ComplaintSchema: Schema = new Schema(
  {
    rideId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'RideHistory',
    },
    filedById: { type: mongoose.Schema.Types.ObjectId, required: true },
    filedByRole: { type: String, required: true },
    complaintReason: { type: String, required: true },
    description: { type: String },
    status: {
      type: String,
      enum: ['pending', 'resolved', 'rejected'],
      default: 'pending',
    },
    warningMailSend: { type: Boolean, default: false },
  },
  { timestamps: true },
);
ComplaintSchema.index({ rideId: 1 });
const Complaints = mongoose.model<IComplaints>('Complaints', ComplaintSchema);

export default Complaints;
