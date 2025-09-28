import { ComplaintResDTO, ComplaintsWithUserDriver } from '../dtos/response/complaint.res.dto';
import { IComplaints } from '../models/complaints.modal';

export class ComplaintsMapper {
  static toComplaint(complaint: IComplaints): ComplaintResDTO {
    return {
      _id:complaint.id,
      rideId: complaint.rideId,
      filedById: complaint.filedById,
      filedByRole: complaint.filedByRole,
      complaintReason: complaint.complaintReason,
      description: complaint.description,
      status: complaint.status,
      warningMailSend: complaint.warningMailSend,
      createdAt: complaint.createdAt,
    };
  }
  static toComplaintWithUserAndDriver(complaint: ComplaintsWithUserDriver[]) {}
}
