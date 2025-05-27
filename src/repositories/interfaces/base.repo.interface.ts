import { Document, FilterQuery, UpdateQuery } from "mongoose";

export interface IBaseRepository<T extends Document> {
  findOne(
    filter: FilterQuery<T>,
    projection?: Record<string, 1 | 0>
  ): Promise<T | null>;
  findById(id: string, projection?: Record<string, 1 | 0>): Promise<T | null>;
  create(data: Partial<T>): Promise<T>;
  update(filter: FilterQuery<T>, update: UpdateQuery<T>): Promise<T | null>;
  updateById(id: string, update: UpdateQuery<T>): Promise<T | null>;
  updateOne(
    filter: FilterQuery<T>,
    update: UpdateQuery<T>,
    options?: {
      upsert?: boolean;
      new?: boolean;
    }
  ): Promise<any>;
  findAll(
    filter?: FilterQuery<T>,
    options?: {
      sort?: Record<string, 1 | -1>;
      skip?: number;
      limit?: number;
    },
    projection?: Record<string, 1 | 0>
  ): Promise<T[]>;
  countDocuments(filter?: FilterQuery<T>): Promise<number>;
}
