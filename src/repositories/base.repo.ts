import { Model, Document, FilterQuery, UpdateQuery } from 'mongoose';
import { IBaseRepository } from './interfaces/base.repo.interface';

export class BaseRepository<T extends Document> implements IBaseRepository<T> {
  protected model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  async findOne(filter: FilterQuery<T>, projection?: Record<string, 1 | 0>): Promise<T | null> {
    return this.model.findOne(filter).select(projection || {});
  }

  async findById(id: string, projection?: Record<string, 1 | 0>): Promise<T | null> {
    return this.model.findById(id).select(projection || {});
  }

  async create(data: Partial<T>): Promise<T> {
    return this.model.create(data);
  }

  async update(filter: FilterQuery<T>, update: UpdateQuery<T>): Promise<T | null> {
    return this.model.findOneAndUpdate(filter, update, { new: true });
  }

  async updateById(id: string, update: UpdateQuery<T>): Promise<T | null> {
    return this.model.findByIdAndUpdate(id, update, { new: true });
  }

  async updateOne(
    filter: FilterQuery<T>,
    update: UpdateQuery<T>,
    options?: {
      upsert?: boolean;
      new?: boolean;
    },
  ): Promise<any> {
    return this.model.findOneAndUpdate(filter, update, {
      new: options?.new ?? false,
      upsert: options?.upsert ?? false,
    });
  }

  async findAll(
    filter: FilterQuery<T> = {},
    options?: {
      sort?: Record<string, 1 | -1>;
      skip?: number;
      limit?: number;
    },
    projection?: Record<string, 1 | 0>,
  ) {
    let query = this.model.find(filter).select(projection || {});

    if (options?.sort) {
      query = query.sort(options.sort);
    }

    if (options?.skip !== undefined) {
      query = query.skip(options.skip);
    }

    if (options?.limit !== undefined) {
      query = query.limit(options.limit);
    }

    return query;
  }

  async countDocuments(filter?: FilterQuery<T> | undefined): Promise<number> {
    return this.model.countDocuments(filter);
  }
}
