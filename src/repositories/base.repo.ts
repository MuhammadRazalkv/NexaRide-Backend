import { Model, Document, FilterQuery, UpdateQuery } from "mongoose";
import { IBaseRepository } from "./interfaces/base.repo.interface";

export class BaseRepository<T extends Document> implements IBaseRepository<T> {
  protected model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  async findOne(filter: FilterQuery<T>): Promise<T | null> {
    return this.model.findOne(filter);
  }

  async findById(id: string): Promise<T | null> {
    return this.model.findById(id);
  }

  async create(data: Partial<T>): Promise<T> {
    return this.model.create(data);
  }

  async update(
    filter: FilterQuery<T>,
    update: UpdateQuery<T>
  ): Promise<T | null> {
    return this.model.findOneAndUpdate(filter, update, { new: true });
  }

  async updateById(id: string, update: UpdateQuery<T>): Promise<T | null> {
    return this.model.findByIdAndUpdate(id, update, { new: true });
  }

  async updateOne(filter: FilterQuery<T>, update: UpdateQuery<T>) {
    return this.model.updateOne(filter, update);
  }

  async findAll(filter: FilterQuery<T> = {}) {
    return this.model.find(filter);
  }

  async countDocuments(filter?: FilterQuery<T> | undefined): Promise<number> {
    return this.model.countDocuments(filter)
  }
}
