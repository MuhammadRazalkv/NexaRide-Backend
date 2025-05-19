import { IBaseRepository } from "./base.repo.interface";
import  { ISubscription } from "../../models/subscription.model";
export interface ISubscriptionRepo extends IBaseRepository<ISubscription> {
}