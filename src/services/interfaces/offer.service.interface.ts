import { IOffer } from "../../models/offer.modal";

export interface IOfferService {
    addOffer(data:IOffer):Promise<IOffer>
    getOffers():Promise<IOffer[]>
    changeOfferStatus(offerId:string):Promise<IOffer>
    findValidOffers(now:number,rideFare:number):Promise<IOffer[] | null>
    findOfferById(offerId:string):Promise<IOffer|null>
    findOfferUsage(userId:string,offerId:string):Promise<number>
}