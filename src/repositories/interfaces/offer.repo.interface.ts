import { IOffer } from "../../models/offer.modal";
import { IOfferUsage } from "../../models/offer.usage.modal";

export interface IOfferRepo {
  createNewOffer(data: IOffer): Promise<IOffer>;
  getOffers(): Promise<IOffer[] | null>;
  findOfferById(offerId:string):Promise<IOffer | null>
  changeOfferStatus(offerId:string,status:boolean):Promise<IOffer | null>
  findValidOffersForRide(now:number,rideFare:number):Promise<IOffer[] | null>;
  findOfferUsage(userId:string,offerId:string):Promise<IOfferUsage | null>
}
