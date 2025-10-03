import { messages } from '../constants/httpMessages';
import { HttpStatus } from '../constants/httpStatusCodes';
import { OfferSchemaDTO } from '../dtos/request/offer.req.dto';
import { OfferResDTO } from '../dtos/response/offer.res.dto';
import { OfferMapper } from '../mappers/offer.mapper';
import { IOfferRepo } from '../repositories/interfaces/offer.repo.interface';
import { AppError } from '../utils/appError';
import { IOfferService } from './interfaces/offer.service.interface';

export class OfferService implements IOfferService {
  constructor(private _offerRepo: IOfferRepo) {}

  async addOffer(data: OfferSchemaDTO): Promise<OfferResDTO> {
    const offer = await this._offerRepo.create(data);
    return OfferMapper.toOffer(offer);
  }

  async getOffers(): Promise<OfferResDTO[]> {
    const offers = await this._offerRepo.findAll();
    return OfferMapper.toOfferList(offers);
  }

  async changeOfferStatus(offerId: string): Promise<OfferResDTO> {
    const offer = await this._offerRepo.findById(offerId);
    if (!offer) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.NOT_FOUND);
    }
    const newStatus = !offer.isActive;
    const updatedOffer = await this._offerRepo.updateById(offerId, {
      $set: { isActive: newStatus },
    });
    if (!updatedOffer) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.NOT_FOUND);
    }
    return OfferMapper.toOffer(updatedOffer);
  }

  // async findOfferById(offerId: string): Promise<OfferResDTO | null> {

  //   const offer = await this._offerRepo.findById(offerId);
  //   return OfferMapper.toOffer(offer);
  // }

  async findValidOffers(now: number, rideFare: number): Promise<OfferResDTO[] | null> {
    const validOffers = await this._offerRepo.findAll({
      isActive: true,
      validFrom: { $lte: now },
      validTill: { $gte: now },
      minFare: { $lte: rideFare },
    });
    return OfferMapper.toOfferList(validOffers);
  }

  async findOfferUsage(userId: string, offerId: string): Promise<number> {
    if (!userId || !offerId) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.ID_NOT_PROVIDED);
    }
    const offerUsage = await this._offerRepo.findOfferUsage(userId, offerId);
    return offerUsage ? offerUsage.usageCount : 0;
  }

  async increaseOfferUsage(userId: string, offerId: string): Promise<void> {
    if (!userId || !offerId) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.ID_NOT_PROVIDED);
    }
    await this._offerRepo.increaseOfferUsage(userId, offerId);
  }
}
