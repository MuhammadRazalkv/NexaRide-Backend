import { messages } from "../constants/httpMessages";
import { HttpStatus } from "../constants/httpStatusCodes";
import { IOffer } from "../models/offer.modal";
import { IOfferRepo } from "../repositories/interfaces/offer.repo.interface";
import { AppError } from "../utils/appError";
import validateOfferData from "../utils/validators/offerValidation";
import { IOfferService } from "./interfaces/offer.service.interface";

export class OfferService implements IOfferService {
  constructor(private offerRepo: IOfferRepo) {}
  async addOffer(data: IOffer): Promise<IOffer> {
    const error = validateOfferData(data);
    if (error) {
      throw new AppError(HttpStatus.BAD_REQUEST, error);
    }
    const offer = await this.offerRepo.createNewOffer(data);
    return offer;
  }

  async getOffers(): Promise<IOffer[]> {
    const offers = await this.offerRepo.getOffers();
    return offers?.length ? offers : [];
  }

  async changeOfferStatus(offerId: string): Promise<IOffer> {
    const offer = await this.offerRepo.findOfferById(offerId);
    if (!offer) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.NOT_FOUND);
    }
    const newStatus = !offer.isActive;
    const updatedOffer = await this.offerRepo.changeOfferStatus(
      offerId,
      newStatus
    );
    if (!updatedOffer) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.NOT_FOUND);
    }
    return updatedOffer;
  }
  async findOfferById(offerId: string): Promise<IOffer | null> {
    if (!offerId) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.ID_NOT_PROVIDED);
    }
    const offer = await this.offerRepo.findOfferById(offerId);
    return offer;
  }

  async findValidOffers(
    now: number,
    rideFare: number
  ): Promise<IOffer[] | null> {
    const validOffers = await this.offerRepo.findValidOffersForRide(
      now,
      rideFare
    );
    return validOffers;
  }
  async findOfferUsage(userId: string, offerId: string): Promise<number> {
    if (!userId || !offerId) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.ID_NOT_PROVIDED);
    }
    const offerUsage = await this.offerRepo.findOfferUsage(userId, offerId);
    return offerUsage ? offerUsage.usageCount : 0;
  }
}
