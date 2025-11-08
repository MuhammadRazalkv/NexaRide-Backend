import { Response, NextFunction } from 'express';
import { ExtendedRequest } from '../middlewares/auth.middleware';
import { IComplaintsService } from '../services/interfaces/complaints.service.interface';
import { IComplaintsController } from './interfaces/complaints.controller.interface';
import { ComplaintReqDTO } from '../dtos/request/complaint.req.dto';
import { sendSuccess } from '../utils/response.util';
import { HttpStatus } from '../constants/httpStatusCodes';

export class ComplaintsController implements IComplaintsController {
  constructor(private _complaintsService: IComplaintsService) {}

  async fileComplaint(
    req: ExtendedRequest<ComplaintReqDTO>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const id = req.id!;
      const data = req.validatedBody!;
      const complaint = await this._complaintsService.fileComplaint(id, data);
      sendSuccess(res, HttpStatus.CREATED, { complaint });
    } catch (error) {
      next(error);
    }
  }
}
