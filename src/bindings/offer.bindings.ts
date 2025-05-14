import { OfferController } from "../controllers/offer.controller";
import { OfferService } from "../services/offer.service";
import { OfferRepo } from "../repositories/offer.repo";
import { bindMethods } from "../utils/bindController";

const offerRepo = new OfferRepo()
export const offerService = new OfferService(offerRepo)
const offerController =bindMethods( new OfferController(offerService))
export default offerController;