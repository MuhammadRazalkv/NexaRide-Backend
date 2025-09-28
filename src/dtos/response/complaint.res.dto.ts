export interface ComplaintResDTO {
  rideId: string;
  filedById: string;
  filedByRole: 'user' | 'driver';
  complaintReason: string;
  description?: string;
  status?: 'pending' | 'resolved' | 'rejected';
  warningMailSend?: boolean;
  createdAt: string;
}

export interface ComplaintsWithUserDriver {
  _id: string;
  rideId: string;
  filedById: string;
  filedByRole: string;
  complaintReason: string;
  description?: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  user: string;
  driver: string;
}
