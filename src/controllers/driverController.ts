import { Request, Response } from "express";
import IDriverController from "../interface/driver/IDriverController";
import driverService from "../services/driverService";
import { ExtendedRequest } from "../middlewares/driverAuth";
import cloudinary from "../utils/cloudinary";
import vehicleService from "../services/vehicleService";

class DriverController implements IDriverController {
  async emailVerification(req: Request, res: Response): Promise<void> {
    try {
      const email = req.body.email;
      await driverService.emailVerification(email);
      res
        .status(201)
        .json({ message: "OTP has been sent to the e-mail address" });
    } catch (error: any) {
      console.log("Error in driver -> emailVerification ", error.message);
      res.status(400).json({ message: error.message });
    }
  }

  async verifyOTP(req: Request, res: Response): Promise<void> {
    try {
      const { email, otp } = req.body;
      await driverService.verifyOTP(email, otp);
      res.status(201).json({ message: "Email has been verified" });
    } catch (error: any) {
      console.log("Error in driver -> verifyOTP ", error.message);
      res.status(400).json({ message: error.message });
    }
  }

  async reSendOTP(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      await driverService.reSendOTP(email);
      res.status(201).json({ message: "OTP re-sended to your e-mail address" });
    } catch (error: any) {
      console.log("Error in driverC -> reSendOTP ", error.message);
      res.status(400).json({ message: error.message });
    }
  }

  async addInfo(req: Request, res: Response): Promise<void> {
    try {
      console.log("addInfo reached", req.body.data);

      const response = await driverService.addInfo(req.body.data);
      console.log("response ", response);

      res.status(201).json({
        message: "Driver information has been successfully added",
        driverId: response.driverId,
      });
    } catch (error: any) {
      console.log("Error in driverC -> addInfo ", error.message);
      res.status(400).json({ message: error.message });
    }
  }

  async addVehicle(req: Request, res: Response): Promise<void> {
    try {
      console.log("addVehicle reached", req.body.data);

      const response = await vehicleService.addVehicle(req.body.data);
      console.log("response ", response);

      res.status(201).json({
        message: "Vehicle information has been successfully added",
        driver: response.driver,
      });
    } catch (error: any) {
      console.log("Error in driverC -> addVehicle ", error);
      res.status(400).json({ message: error.message });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const data = await driverService.login(req.body);
      res.cookie("driverRefreshToken", data.refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      // res.cookie('justTry','this is for just testing ')
      // res.cookie('driverRefreshToken',data.refreshToken,{sameSite:'none',secure:false, maxAge:7*60*60*10000000})
      console.log("Access token ", data.accessToken);
      console.log("Refresh token", data.refreshToken);
      console.log("Driver ", data.driver);

      res.status(200).json({
        message: "Login successful",
        accessToken: data.accessToken,
        driver: data.driver,
      });
    } catch (error: any) {
      console.log("Error in UserController -> login ", error.message);
      res.status(401).json({ message: error.message });
    }
  }

  async checkGoogleAuth(req: Request, res: Response): Promise<void> {
    const { id, email } = req.body;

    try {
      const response = await driverService.checkGoogleAuth(id, email);
      if (response) {
        res.status(200).json({
          message: response,
          success: true,
        });
        return;
      } else {
        res.status(200).json({ success: false });
      }
    } catch (error) {
      res.status(500).json({ message: "Something went wrong.", error });
    }
  }

  async getStatus(req: ExtendedRequest, res: Response): Promise<void> {
    try {
      if (!req.id) {
        throw new Error("Id not found");
      }
      const response = await driverService.getStatus(req.id);

      res.status(201).json({
        driverStatus: response.driverStatus,
        vehicleStatus: response.vehicleStatus,
        available: response.isAvailable,
      });
    } catch (error: any) {
      console.log("Error in driverC -> getStatus ", error.message);
      res.status(400).json({ message: error.message });
    }
  }

  async rejectReason(req: ExtendedRequest, res: Response): Promise<void> {
    try {
      if (!req.id) {
        throw new Error("Id not found");
      }
      const response = await driverService.rejectReason(req.id);

      res.status(201).json({
        reason: response.reason,
      });
    } catch (error: any) {
      console.log("Error in driverC -> getStatus ", error.message);
      res.status(400).json({ message: error.message });
    }
  }

  async reApplyDriver(req: ExtendedRequest, res: Response): Promise<void> {
    try {
      console.log("addInfo reached", req.body);
      if (!req.id) {
        throw new Error("Id not found");
      }
      const response = await driverService.reApplyDriver(req.id, req.body);
      console.log("response ", response);

      res.status(201).json({
        message:
          "Driver information has been successfully submitted for reverification",
        driver: response.updatedData,
      });
    } catch (error: any) {
      console.log("Error in driverC -> reApplyDriver ", error.message);
      res.status(400).json({ message: error.message });
    }
  }

  async vehicleRejectReason(
    req: ExtendedRequest,
    res: Response
  ): Promise<void> {
    try {
      if (!req.id) {
        throw new Error("Id not found");
      }
      const response = await vehicleService.rejectReason(req.id);
      console.log("Response of the vehicle rejection", response);

      res.status(201).json({
        reason: response.reason,
      });
    } catch (error: any) {
      console.log("Error in driverC -> getStatus ", error.message);
      res.status(400).json({ message: error.message });
    }
  }

  async reApplyVehicle(req: ExtendedRequest, res: Response): Promise<void> {
    try {
      console.log("reApplyVehicle reached", req.body.data);
      if (!req.id) {
        throw new Error("Id not found");
      }
      const response = await vehicleService.reApplyVehicle(
        req.id,
        req.body.data
      );
      console.log("response ", response);

      res.status(201).json({
        message: "Vehicle information has been successfully added",
        driver: response.driver,
      });
    } catch (error: any) {
      console.log("Error in driverC -> reApply vehicle ", error);
      res.status(400).json({ message: error.message });
    }
  }

  //!Not need
  async upload(req: Request, res: Response): Promise<void> {
    try {
      const img = req.body.imgUrl;
      const res = await cloudinary.uploader.upload(img, {
        folder: "/demo",
      });
      console.log(res);
    } catch (error) {
      console.log(error);
    }
  }

  async googleLogin(req: Request, res: Response): Promise<void> {
    try {
      const { email, googleId, profilePic } = req.body;

      const data = await driverService.googleLogin(googleId, email, profilePic);

      res.cookie("driverRefreshToken", data.refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      res.status(200).json({
        message: "Login successful",
        accessToken: data.accessToken,
        driver: data.driver,
      });
    } catch (error: any) {
      console.log("Error in UserController -> googleLogin ", error.message);
      res.status(401).json({ message: error.message });
    }
  }

  async requestPasswordReset(req: Request, res: Response): Promise<void> {
    try {
      await driverService.requestPasswordReset(req.body.email);
      res.status(200).json({
        message: "Password reset link has been sent your email address",
      });
    } catch (error: any) {
      console.log(
        "Error in UserController -> request passwordRest ",
        error.message
      );
      res.status(401).json({ message: error.message });
    }
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { id, token, password } = req.body;
      await driverService.resetPassword(id, token, password);
      res.status(200).json({ message: "Password has been reset" });
    } catch (error: any) {
      console.log("Error in UserController -> reset password ", error.message);
      res.status(401).json({ message: error.message });
    }
  }

  async getDriverInfo(req: ExtendedRequest, res: Response): Promise<void> {
    try {
      if (!req.id) {
        throw new Error("Id not found");
      }
      const response = await driverService.getDriverInfo(req.id);

      console.log("Get Driver ", response);

      res.status(201).json({ driver: response });
    } catch (error: any) {
      console.log("Error in driverC -> getStatus ", error.message);
      res.status(400).json({ message: error.message });
    }
  }

  async updateDriverInfo(req: ExtendedRequest, res: Response): Promise<void> {
    try {
      if (!req.id) {
        throw new Error("Id not found");
      }
      console.log("body ", req.body);
      const { field, value } = req.body;

      const response = await driverService.updateDriverInfo(
        req.id,
        field,
        value
      );

      // console.log('Get Driver ', response);

      res.status(200).json({ success: true, updatedFiled: response });
    } catch (error: any) {
      console.log("Error in driverC -> getStatus ", error.message);
      res.status(400).json({ message: error.message });
    }
  }

  async updateAvailability(req: ExtendedRequest, res: Response): Promise<void> {
    try {
      if (!req.id) {
        throw new Error("Id not found");
      }

      const response = await driverService.toggleAvailability(req.id);

      res.status(200).json({ success: true, availability: response });
    } catch (error: any) {
      console.log("Error in driverC -> getStatus ", error.message);
      res.status(400).json({ message: error.message });
    }
  }

  async getCurrentLocation(req: ExtendedRequest, res: Response): Promise<void> {
    try {
      const driverId = req.id;
      if (!driverId) {
        throw new Error("Driver id not found ");
      }

      const location = await driverService.getCurrentLocation(driverId);
      res.status(200).json({ success: true, location });
    } catch (error: any) {
      console.log(error);

      res.status(400).json({ message: error.message });
    }
  }
}

export default new DriverController();
