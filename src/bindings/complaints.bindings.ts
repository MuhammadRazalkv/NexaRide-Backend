import { ComplaintsController } from '../controllers/complaints.controller';
import { ComplaintsRepo } from '../repositories/complaints.repo';
import { RideRepo } from '../repositories/ride.repo';
import { ComplaintsService } from '../services/complaints.service';
import { bindMethods } from '../utils/bindController';

const complaintsRepo = new ComplaintsRepo();
const rideRepo = new RideRepo();
const complaintsService = new ComplaintsService(complaintsRepo, rideRepo);

export const complaintsController = bindMethods(new ComplaintsController(complaintsService));
