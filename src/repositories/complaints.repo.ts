import { ComplaintsWithUserDriver } from '../dtos/response/complaint.res.dto';
import Complaints, { IComplaints } from '../models/complaints.modal';
import { BaseRepository } from './base.repo';
import { IComplaintsRepo } from './interfaces/complaints.repo.interface';

export class ComplaintsRepo extends BaseRepository<IComplaints> implements IComplaintsRepo {
  constructor() {
    super(Complaints);
  }
  async getAllComplaints(
    skip: number,
    limit: number,
    filterBy: string,
  ): Promise<ComplaintsWithUserDriver[] | null> {
    const matchStage = filterBy ? { $match: { status: filterBy } } : { $match: {} };
    return await Complaints.aggregate([
      matchStage,
      {
        $lookup: {
          from: 'ridehistories',
          localField: 'rideId',
          foreignField: '_id',
          as: 'rideInfo',
        },
      },
      { $unwind: '$rideInfo' },
      {
        $lookup: {
          from: 'users',
          localField: 'rideInfo.userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: { path: '$user' } },
      {
        $lookup: {
          from: 'drivers',
          localField: 'rideInfo.driverId',
          foreignField: '_id',
          as: 'driver',
        },
      },
      { $unwind: '$driver' },
      {
        $addFields: {
          user: '$user.name',
          driver: '$driver.name',
        },
      },
      {
        $project: {
          __v: 0,
          rideInfo: 0,
        },
      },
      { $skip: skip },
      { $limit: limit },
      { $sort: { createdAt: -1 } },
    ]);
  }
}
