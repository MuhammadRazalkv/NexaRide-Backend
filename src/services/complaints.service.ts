import { messages } from '../constants/httpMessages';
import { HttpStatus } from '../constants/httpStatusCodes';
import { ComplaintReqDTO } from '../dtos/request/complaint.req.dto';
import { ComplaintResDTO } from '../dtos/response/complaint.res.dto';
import { ComplaintsMapper } from '../mappers/complaints.mapper';
import { IComplaintsRepo } from '../repositories/interfaces/complaints.repo.interface';
import { IRideRepo } from '../repositories/interfaces/ride.repo.interface';
import { AppError } from '../utils/appError';
import { IComplaintsService } from './interfaces/complaints.service.interface';

export class ComplaintsService implements IComplaintsService {
  constructor(
    private _complaintsRepo: IComplaintsRepo,
    private _rideRepo: IRideRepo,
  ) {}
  async fileComplaint(data: ComplaintReqDTO): Promise<ComplaintResDTO | null> {
    const ride = await this._rideRepo.findById(data.rideId);
    if (!ride) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.RIDE_NOT_FOUND);
    }

    const complaint = await this._complaintsRepo.create(data);
    return ComplaintsMapper.toComplaint(complaint);
  }
}
