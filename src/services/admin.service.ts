import userRepo from "../repositories/user.repo";
import driverRepo from "../repositories/driver.repo";
import vehicleRepo from "../repositories/vehicle.repo";
import adminRepo from "../repositories/admin.repo";
import {
  generateAdminAccessToken,
  generateAdminRefreshToken,
  generateRefreshToken,
} from "../utils/jwt";
import sendEmail from "../utils/mailSender";
import {
  driverApprovalEmail,
  vehicleApprovalEmail,
  rejectionEmail,
} from "../constants/OTP";
const generateTokens = (role: string) => ({
  accessToken: generateAdminAccessToken(role),
  refreshToken: generateRefreshToken(role),
});

interface IFare {
  basic: number;
  premium: number;
  luxury: number;
}
interface IUpdateFare {
  vehicleClass: "Basic" | "Premium" | "Luxury";
  farePerKm: number;
}

class AdminService {
  async login(email: string, password: string) {
    try {
      if (!email || !password) {
        throw new Error("Fields are missing");
      }
      if (
        email !== process.env.ADMIN_EMAIL ||
        password !== process.env.ADMIN_PASSWORD
      ) {
        throw new Error("Invalid email or password");
      }

      // Generate tokens
      return {
        ...generateTokens("admin"),
      };
    } catch (error: unknown) {
      if (error instanceof Error) throw error;
      throw new Error("Internal server error");
    }
  }

  async getUsers() {
    try {
      const users = await userRepo.getAllUsers();
      return {
        users,
      };
    } catch (error: unknown) {
      if (error instanceof Error) throw error;
      throw new Error("Internal server error");
    }
  }

  async changeUserStatus(id: string) {
    try {
      const user = await userRepo.findUserById(id);
      if (!user) {
        throw new Error("User not found");
      }

      const updatedUser = await userRepo.blockUnblockUser(id, user.isBlocked);

      if (updatedUser) {
        return {
          message: updatedUser.isBlocked
            ? "User blocked successfully"
            : "User unblocked successfully",
          user: updatedUser,
        };
      }
      throw new Error("Failed to toggle user status");
    } catch (error: unknown) {
      console.error("Error in admin -> change user status:", error);
      if (error instanceof Error) throw error;
      throw new Error("Internal server error");
    }
  }

  async getDrivers() {
    try {
      const drivers = await driverRepo.getAllDrivers();
      return {
        drivers,
      };
    } catch (error: unknown) {
      if (error instanceof Error) throw error;
      throw new Error("Internal server error");
    }
  }

  async toggleBlockUnblockDriver(id: string) {
    try {
      const driver = await driverRepo.findDriverById(id);
      if (!driver) {
        throw new Error("Driver not found");
      }

      const updatedDriver = await driverRepo.blockUnblockDriver(
        id,
        driver.isBlocked
      );

      if (updatedDriver) {
        return {
          message: updatedDriver.isBlocked
            ? "Driver blocked successfully"
            : "Driver unblocked successfully",
          driver: updatedDriver,
        };
      }
      throw new Error("Failed to toggle driver status");
    } catch (error: unknown) {
      console.error("Error in admin -> change driver status:", error);
      if (error instanceof Error) throw error;
      throw new Error("Internal server error");
    }
  }

  async getPendingDriversWithVehicle() {
    try {
      const drivers = await driverRepo.getPendingDriversWithVehicle();
      return {
        drivers,
      };
    } catch (error: unknown) {
      if (error instanceof Error) throw error;
      throw new Error("Internal server error");
    }
  }

  async rejectDriver(id: string, reason: string) {
    try {
      if (!id || !reason) {
        throw new Error("Fields are missing");
      }
      const driver = await driverRepo.findDriverById(id);
      if (!driver) {
        throw new Error("Driver not found");
      }

      const updatedDriver = await driverRepo.rejectDriver(id, reason);

      if (updatedDriver) {
        await sendEmail(
          updatedDriver.email,
          "Driver rejection",
          rejectionEmail(
            updatedDriver.name,
            updatedDriver?.rejectionReason || "Due to incorrect info",
            "Driver"
          )
        );
        return {
          message: "Driver rejected successfully",
          driver: updatedDriver,
        };
      }
      throw new Error("Failed to toggle driver status");
    } catch (error: unknown) {
      console.error("Error in admin -> change driver status:", error);
      if (error instanceof Error) throw error;
      throw new Error("Internal server error");
    }
  }

  async approveDriver(id: string) {
    try {
      if (!id) {
        throw new Error("id is  missing");
      }
      const driver = await driverRepo.findDriverById(id);
      if (!driver) {
        throw new Error("Driver not found");
      }

      const updatedDriver = await driverRepo.approveDriver(id);

      if (updatedDriver) {
        await sendEmail(
          driver.email,
          "Driver approval ",
          driverApprovalEmail(driver.name)
        );
        return {
          message: "Driver approved successfully",
          driver: updatedDriver,
        };
      }
      throw new Error("Failed to toggle driver status");
    } catch (error: unknown) {
      console.error("Error in admin -> change driver status:", error);
      if (error instanceof Error) throw error;
      throw new Error("Internal server error");
    }
  }

  async getVehicleInfo(id: string) {
    try {
      if (!id) {
        throw new Error("Id is missing");
      }
      const vehicle = await vehicleRepo.getVehicleInfo(id);
      if (!vehicle) {
        throw new Error("Vehicle not found");
      }
      console.log("Vehicle from getVehicleInfo", vehicle);

      return vehicle;
    } catch (error: unknown) {
      if (error instanceof Error) throw error;
      throw new Error("Internal server error");
    }
  }

  async approveVehicle(id: string, category: string) {
    try {
      if (!id) {
        throw new Error("Vehicle ID is missing");
      }
      const vehicle = await vehicleRepo.findVehicleById(id);
      if (!vehicle) {
        throw new Error("Vehicle not found");
      }
      const driver = await driverRepo.findDriverByVehicleId(vehicle.id);
      if (!driver) {
        throw new Error("Driver not found");
      }

      const updatedVehicle = await vehicleRepo.approveVehicle(id, category);
      if (updatedVehicle) {
        await sendEmail(
          driver?.email,
          "Vehicle approval",
          vehicleApprovalEmail(driver.name)
        );
        return {
          message: "Vehicle approved successfully",
          vehicle: updatedVehicle,
        };
      }
      throw new Error("Failed to approve vehicle");
    } catch (error: unknown) {
      console.error("Error in admin -> approve vehicle:", error);
      if (error instanceof Error) throw error;
      throw new Error("Internal server error");
    }
  }

  async rejectVehicle(id: string, reason: string) {
    try {
      if (!id || !reason) {
        throw new Error("Fields are missing");
      }
      const vehicle = await vehicleRepo.findVehicleById(id);
      if (!vehicle) {
        throw new Error("Vehicle not found");
      }
      const driver = await driverRepo.findDriverByVehicleId(vehicle.id);
      if (!driver) {
        throw new Error("Driver not found");
      }
      const updatedVehicle = await vehicleRepo.rejectVehicle(id, reason);

      if (updatedVehicle) {
        await sendEmail(
          driver.email,
          "Vehicle rejection",
          rejectionEmail(
            driver.name,
            updatedVehicle.rejectionReason || "Due to incorrect info",
            "Vehicle"
          )
        );
        return {
          message: "Vehicle rejected successfully",
          vehicle: updatedVehicle,
        };
      }
      throw new Error("Failed to reject vehicle");
    } catch (error: unknown) {
      console.error("Error in admin -> reject vehicle:", error);
      if (error instanceof Error) throw error;
      throw new Error("Internal server error");
    }
  }

  async updateFare(fare: IFare) {
    try {
      if (!fare) {
        throw new Error("Fare data is missing");
      }
      const updates: IUpdateFare[] = [
        { vehicleClass: "Basic", farePerKm: fare.basic },
        { vehicleClass: "Premium", farePerKm: fare.premium },
        { vehicleClass: "Luxury", farePerKm: fare.luxury },
      ];

      const fares = await adminRepo.updateFare(updates);
      const res: IFare = fares.reduce((acc, fare) => {
        const key = fare.vehicleClass.toLowerCase() as keyof IFare;
        acc[key] = fare.farePerKm;
        return acc;
      }, {} as IFare);
      return res;
    } catch (error: unknown) {
      console.error("Error in admin update Fare :", error);
      if (error instanceof Error) throw error;
      throw new Error("Internal server error");
    }
  }

  async getFares() {
    try {
      const fares = await adminRepo.getFares();
      const res: IFare = fares.reduce((acc, fare) => {
        const key = fare.vehicleClass.toLowerCase() as keyof IFare;
        acc[key] = fare.farePerKm;
        return acc;
      }, {} as IFare);

      return res;
    } catch (error: unknown) {
      console.error("Error in admin get Fare :", error);
      if (error instanceof Error) throw error;
      throw new Error("Internal server error");
    }
  }
}

export default new AdminService();
