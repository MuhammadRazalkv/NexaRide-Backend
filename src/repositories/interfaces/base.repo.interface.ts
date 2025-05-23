import { Document, FilterQuery, UpdateQuery } from "mongoose";

export interface IBaseRepository<T extends Document> {
  findOne(filter: FilterQuery<T>): Promise<T | null>;
  findById(id: string): Promise<T | null>;
  create(data: Partial<T>): Promise<T>;
  update(filter: FilterQuery<T>, update: UpdateQuery<T>): Promise<T | null>;
  updateById(id: string, update: UpdateQuery<T>): Promise<T | null>;
  updateOne(filter: FilterQuery<T>, update: UpdateQuery<T>): Promise<any>; 
  findAll(filter?: FilterQuery<T>): Promise<T[]>;
  countDocuments(filter?: FilterQuery<T>): Promise<number>;
}
