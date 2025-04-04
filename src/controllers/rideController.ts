import rideService from "../services/rideService";
import { ExtendedRequest } from "../middlewares/userAuth";
import { Response } from "express";

class RideController {
  async checkCabs(req: ExtendedRequest, res: Response): Promise<void> {
    try {
      const userId = req.id;
      if (!userId) {
        throw new Error("User id not found ");
      }
      const data = req.body.data;

      const response = await rideService.checkCabs(userId, data);
      res.status(200).json({ success: true, drivers: response });
    } catch (error: any) {
      console.log(error);

      res.status(400).json({ message: error.message });
    }
  }
  
  async assignRandomLocation(
    req: ExtendedRequest,
    res: Response
  ): Promise<void> {
    try {
      if (!req.id) {
        throw new Error("Driver id not found ");
      }
      const response = await rideService.assignRandomLocation(req.id);
      res.status(200).json({ success: true, coordinates: response });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
  
  async verifyRideOTP(req: ExtendedRequest, res: Response): Promise<void> {
    try {
      const driverId = req.id;
      if (!driverId) {
        throw new Error("Driver id not found ");
      }
      const OTP = req.body.otp;

      const response = await rideService.verifyRideOTP(driverId, OTP);
      res.status(200).json({ success: true});
    } catch (error: any) {
      console.log(error);

      res.status(400).json({ message: error.message });
    }
  }
 
}

export default new RideController();
