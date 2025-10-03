import { ComplaintsWithUserDriver } from '../../dtos/response/complaint.res.dto';
import { IComplaints } from '../../models/complaints.modal';
import { IBaseRepository } from './base.repo.interface';

export interface IComplaintsRepo extends IBaseRepository<IComplaints> {
  getAllComplaints(
    skip: number,
    limit: number,
    filterBy: string,
  ): Promise<ComplaintsWithUserDriver[] | null>;
}
