import { ComplaintReqDTO } from '../../dtos/request/complaint.req.dto';
import { ComplaintResDTO } from '../../dtos/response/complaint.res.dto';

export interface IComplaintsService {
  fileComplaint(id: string, data: ComplaintReqDTO): Promise<ComplaintResDTO | null>;
}
