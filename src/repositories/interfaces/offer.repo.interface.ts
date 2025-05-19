import { IOffer } from "../../models/offer.modal";
import { IOfferUsage } from "../../models/offer.usage.modal";
import { IBaseRepository } from "./base.repo.interface";

export interface IOfferRepo extends IBaseRepository<IOffer> {
  createNewOffer(data: IOffer): Promise<IOffer>;
  getOffers(): Promise<IOffer[] | null>;
  findOfferById(offerId:string):Promise<IOffer | null>
  changeOfferStatus(offerId:string,status:boolean):Promise<IOffer | null>
  findValidOffersForRide(now:number,rideFare:number):Promise<IOffer[] | null>;
  findOfferUsage(userId:string,offerId:string):Promise<IOfferUsage | null>
  increaseOfferUsage(userId: string, offerId: string): Promise<IOfferUsage | null>
}
