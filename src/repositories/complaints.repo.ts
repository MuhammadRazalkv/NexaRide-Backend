import mongoose from 'mongoose';
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
    search: string,
  ): Promise<{ complaints: ComplaintsWithUserDriver[]; count: number }> {
    const match: Record<string, any> = {};
    if (filterBy) match.status = filterBy;

    const pipeline: mongoose.PipelineStage[] = [
      { $match: match },
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
      { $unwind: '$user' },
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
    ];

    if (search && search.trim()) {
      pipeline.push({
        $match: {
          $or: [
            { user: { $regex: search, $options: 'i' } },
            { driver: { $regex: search, $options: 'i' } },
          ],
        },
      });
    }

    pipeline.push({
      $facet: {
        complaints: [
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              __v: 0,
              rideInfo: 0,
            },
          },
        ],
        count: [{ $count: 'total' }],
      },
    });

    const [result] = await Complaints.aggregate(pipeline);
    console.log(result);

    return {
      complaints: result.complaints,
      count: result.count[0]?.total ?? 0,
    };
  }
}
