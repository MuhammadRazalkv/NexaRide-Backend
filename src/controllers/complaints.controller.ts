import { Response, NextFunction } from 'express';
import { ExtendedRequest } from '../middlewares/auth.middleware';
import { IComplaintsService } from '../services/interfaces/complaints.service.interface';
import { IComplaintsController } from './interfaces/complaints.controller.interface';
import { validate } from '../utils/validators/validateZod';
import { objectIdSchema } from '../dtos/request/common.req.dto';
import { complaintReqDTO } from '../dtos/request/complaint.req.dto';
import { sendSuccess } from '../utils/response.util';
import { HttpStatus } from '../constants/httpStatusCodes';

export class ComplaintsController implements IComplaintsController {
  constructor(private _complaintsService: IComplaintsService) {}

  async fileComplaint(req: ExtendedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = validate(objectIdSchema, req.id);
      const rawData = req.body;
      const data = validate(complaintReqDTO, {
        ...rawData,
        filedById: id,
        filedByRole: rawData.by,
        complaintReason: rawData.reason,
      });
      const complaint = await this._complaintsService.fileComplaint(data);
      sendSuccess(res, HttpStatus.CREATED, { complaint });
    } catch (error) {
      next(error);
    }
  }
}
