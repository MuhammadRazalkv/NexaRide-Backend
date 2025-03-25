import { Request, Response } from "express";
import adminService from "../services/adminService";

class AdminController {
  async login(req: Request, res: Response): Promise<void> {
    try {
      const data = await adminService.login(req.body.email, req.body.password);
      res.cookie("adminRefreshToken", data.refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: "/",
      });

      res.cookie("adminAccessToken", data.accessToken, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: "/",
      });

      res.status(200).json({
        message: "Login successful",
      });
    } catch (error: any) {
      console.log("Error in admin -> login ", error.message);
      res.status(401).json({ message: error.message });
    }
  }

  async getUsers(req: Request, res: Response): Promise<void> {
    try {
      const data = await adminService.getUsers();
      console.log(data.users);

      res.status(200).json({
        message: "Data fetched successfully",
        users: data.users,
      });
    } catch (error: any) {
      console.log("Error in Admin -> get users ", error.message);
      res.status(401).json({ message: error.message });
    }
  }

  async changeUserStatus(req: Request, res: Response): Promise<void> {
    try {
      const result = await adminService.changeUserStatus(req.body.id);

      res.status(200).json({
        success: true,
        message: result.message,
        user: result.user,
      });
    } catch (error: any) {
      console.log("Error in Admin -> change user status ", error.message);
      res.status(401).json({ success: false, message: error.message });
    }
  }

  async getDrivers(req: Request, res: Response): Promise<void> {
    try {
      const data = await adminService.getDrivers();
      console.log(data.drivers);

      res.status(200).json({
        message: "Data fetch successful",
        drivers: data.drivers,
      });
    } catch (error: any) {
      console.log("Error in Admin -> get users ", error.message);
      res.status(401).json({ message: error.message });
    }
  }

  async toggleBlockUnblockDriver(req: Request, res: Response): Promise<void> {
    try {
      const result = await adminService.toggleBlockUnblockDriver(req.body.id);

      res.status(200).json({
        success: true,
        message: result.message,
        driver: result.driver,
      });
    } catch (error: any) {
      console.log("Error in Admin -> change user status ", error.message);
      res.status(401).json({ success: false, message: error.message });
    }
  }

  async getPendingDriversWithVehicle(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const data = await adminService.getPendingDriversWithVehicle();
      console.log(data.drivers);

      res.status(200).json({
        success: true,
        message: "Data fetch successful",
        drivers: data.drivers,
      });
    } catch (error: any) {
      console.log("Error in Admin -> get users ", error.message);
      res.status(401).json({ message: error.message });
    }
  }

  async rejectDriver(req: Request, res: Response): Promise<void> {
    try {
      const result = await adminService.rejectDriver(
        req.body.driverId,
        req.body.reason
      );

      res.status(200).json({
        success: true,
        message: result.message,
        driver: result.driver,
      });
    } catch (error: any) {
      console.log("Error in Admin -> change user status ", error.message);
      res.status(401).json({ success: false, message: error.message });
    }
  }

  async approveDriver(req: Request, res: Response): Promise<void> {
    try {
      const result = await adminService.approveDriver(req.body.driverId);

      res.status(200).json({
        success: true,
        message: result.message,
        driver: result.driver,
      });
    } catch (error: any) {
      console.log("Error in Admin -> change user status ", error.message);
      res.status(401).json({ success: false, message: error.message });
    }
  }

  async getVehicleInfo(req: Request, res: Response): Promise<void> {
    try {
      console.log("Req reached getVehicle");

      const vehicle = await adminService.getVehicleInfo(req.params.id);

      res.status(200).json({
        success: true,
        message: "Data fetch successful",
        vehicle,
      });
    } catch (error: any) {
      console.log("Error in Admin -> get users ", error.message);
      res.status(401).json({ message: error.message });
    }
  }

  async approveVehicle(req: Request, res: Response): Promise<void> {
    try {
      const { vehicleId, category } = req.body;
      const result = await adminService.approveVehicle(vehicleId, category);

      res.status(200).json({
        success: true,
        message: result.message,
        vehicle: result.vehicle,
      });
    } catch (error: any) {
      console.log("Error in Admin -> approve vehicle:", error.message);
      res.status(401).json({ success: false, message: error.message });
    }
  }

  async rejectVehicle(req: Request, res: Response): Promise<void> {
    try {
      const result = await adminService.rejectVehicle(
        req.body.vehicleId,
        req.body.reason
      );

      res.status(200).json({
        success: true,
        message: result.message,
        vehicle: result.vehicle,
      });
    } catch (error: any) {
      console.log("Error in Admin -> reject vehicle:", error.message);
      res.status(401).json({ success: false, message: error.message });
    }
  }

  async updateFare(req: Request, res: Response): Promise<void> {
    try {
      const result = await adminService.updateFare(req.body.fare);

      res.status(200).json({
        success: true,
        fares: result,
        message: "Fare updated successfully ",
      });
    } catch (error: any) {
      console.log("Error in Admin -> update Fare:", error.message);
      res.status(401).json({ success: false, message: error.message });
    }
  }

  async getFares(req: Request, res: Response): Promise<void> {
    try {
      const result = await adminService.getFares();

      res.status(200).json({
        fares: result,
        success: true,
      });
    } catch (error: any) {
      console.log("Error in Admin -> get Fare:", error.message);
      res.status(401).json({ success: false, message: error.message });
    }
  }
}

export default new AdminController();
