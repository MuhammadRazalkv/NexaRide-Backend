import {
  generateRefreshToken,
  generateAccessToken,
  verifyRefreshToken,
} from "../utils/jwt";
import sendEmail from "../utils/mailSender";
import {
  driverApprovalEmail,
  vehicleApprovalEmail,
  rejectionEmail,
} from "../constants/OTP";
import { AppError } from "../utils/appError";
import { HttpStatus } from "../constants/httpStatusCodes";
import { messages } from "../constants/httpMessages";
import { IAdminService } from "./interfaces/admin.service.interface";
import { IUserRepo } from "../repositories/interfaces/user.repo.interface";
import { IDriverRepo } from "../repositories/interfaces/driver.repo.interface";
import { IVehicleRepo } from "../repositories/interfaces/vehicle.repo.interface";
import { IAdminRepo } from "../repositories/interfaces/admin.repo";
const generateTokens = () => ({
  accessToken: generateAccessToken(process.env.ADMIN_EMAIL as string, "admin"),
  refreshToken: generateRefreshToken(
    process.env.ADMIN_EMAIL as string,
    "admin"
  ),
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

export class AdminService implements IAdminService {
  constructor(
    private userRepo: IUserRepo,
    private driverRepo: IDriverRepo,
    private vehicleRepo: IVehicleRepo,
    private adminRepo: IAdminRepo
  ) {}
  async login(email: string, password: string) {
    if (!email || !password) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
    }
    if (
      email !== process.env.ADMIN_EMAIL ||
      password !== process.env.ADMIN_PASSWORD
    ) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.INVALID_CREDENTIALS);
    }

    // Generate tokens
    return {
      ...generateTokens(),
    };
  }

  async getUsers(page:number,search:string,sort:string) {
    const limit = 5 
    const skip = (page - 1 ) * 5 
    
    const users = await this.userRepo.getAllUsers(skip,limit,search,sort);
    const total = await this.userRepo.getAllUserCount(search);
    return {
      users,
      total
    }; 
  }
 

  async changeUserStatus(id: string) {
    const user = await this.userRepo.findUserById(id);
    if (!user) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.USER_NOT_FOUND);
    }

    const updatedUser = await this.userRepo.blockUnblockUser(
      id,
      user.isBlocked
    );

    if (updatedUser) {
      return {
        message: updatedUser.isBlocked
          ? "User blocked successfully"
          : "User unblocked successfully",
        user: updatedUser,
      };
    }
    throw new AppError(HttpStatus.BAD_REQUEST, messages.SERVER_ERROR);
  }

  async getDrivers(page:number,search:string,sort:string) {
    const limit = 5
    const skip = (page - 1 ) * 5 
    const drivers = await this.driverRepo.getAllDrivers(skip,limit,search,sort);
    const total = await this.driverRepo.getApprovedDriversCount(search)
    return {
      drivers,
      total
    };
  }

  async getPendingDriverCount() {
    const count = await this.driverRepo.getPendingDriverCount();
    return {
      count,
    };
  }
  async toggleBlockUnblockDriver(id: string) {
    const driver = await this.driverRepo.findDriverById(id);
    if (!driver) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.DRIVER_NOT_FOUND);
    }

    const updatedDriver = await this.driverRepo.blockUnblockDriver(
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
    throw new AppError(HttpStatus.INTERNAL_SERVER_ERROR, messages.SERVER_ERROR);
  }

  async getPendingDriversWithVehicle() {
    const drivers = await this.driverRepo.getPendingDriversWithVehicle();
    return {
      drivers,
    };
  }

  async rejectDriver(id: string, reason: string) {
    if (!id || !reason) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
    }
    const driver = await this.driverRepo.findDriverById(id);
    if (!driver) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.DRIVER_NOT_FOUND);
    }

    const updatedDriver = await this.driverRepo.rejectDriver(id, reason);

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
    throw new AppError(HttpStatus.INTERNAL_SERVER_ERROR, messages.SERVER_ERROR);
  }

  async approveDriver(id: string) {
    if (!id) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
    }
    const driver = await this.driverRepo.findDriverById(id);
    if (!driver) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.DRIVER_NOT_FOUND);
    }

    const updatedDriver = await this.driverRepo.approveDriver(id);

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
    throw new AppError(HttpStatus.INTERNAL_SERVER_ERROR, messages.SERVER_ERROR);
  }

  async getVehicleInfo(id: string) {
    if (!id) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
    }
    const vehicle = await this.vehicleRepo.getVehicleInfo(id);
    if (!vehicle) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.VEHICLE_NOT_FOUND);
    }

    return vehicle;
  }

  async approveVehicle(id: string, category: string) {
    if (!id) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
    }
    const vehicle = await this.vehicleRepo.findVehicleById(id);
    if (!vehicle) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.VEHICLE_NOT_FOUND);
    }
    const driver = await this.driverRepo.findDriverByVehicleId(vehicle.id);
    if (!driver) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.DRIVER_NOT_FOUND);
    }

    const updatedVehicle = await this.vehicleRepo.approveVehicle(id, category);
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
    throw new AppError(HttpStatus.INTERNAL_SERVER_ERROR, messages.SERVER_ERROR);
  }

  async rejectVehicle(id: string, reason: string) {
    if (!id || !reason) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
    }
    const vehicle = await this.vehicleRepo.findVehicleById(id);
    if (!vehicle) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.VEHICLE_NOT_FOUND);
    }
    const driver = await this.driverRepo.findDriverByVehicleId(vehicle.id);
    if (!driver) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.DRIVER_NOT_FOUND);
    }
    const updatedVehicle = await this.vehicleRepo.rejectVehicle(id, reason);

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
    throw new AppError(HttpStatus.INTERNAL_SERVER_ERROR, messages.SERVER_ERROR);
  }

  async updateFare(fare: IFare) {
    if (!fare) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
    }
    const updates: IUpdateFare[] = [
      { vehicleClass: "Basic", farePerKm: fare.basic },
      { vehicleClass: "Premium", farePerKm: fare.premium },
      { vehicleClass: "Luxury", farePerKm: fare.luxury },
    ];

    const fares = await this.adminRepo.updateFare(updates);
    const res: IFare = fares.reduce((acc, fare) => {
      const key = fare.vehicleClass.toLowerCase() as keyof IFare;
      acc[key] = fare.farePerKm;
      return acc;
    }, {} as IFare);
    return res;
  }

  async getFares() {
    const fares = await this.adminRepo.getFares();
    const res: IFare = fares.reduce((acc, fare) => {
      const key = fare.vehicleClass.toLowerCase() as keyof IFare;
      acc[key] = fare.farePerKm;
      return acc;
    }, {} as IFare);

    return res;
  }
  async refreshToken(token: string) {
    if (!token) {
      throw new AppError(HttpStatus.UNAUTHORIZED, messages.TOKEN_NOT_PROVIDED);
    }

    const refresh = verifyRefreshToken(token);
    console.log('admin refresh verified ',refresh);
    
    if (!refresh) {
      console.log('Token verification failed ');
      
      throw new AppError(HttpStatus.BAD_REQUEST, messages.TOKEN_INVALID);
    }

    const {accessToken,refreshToken} = generateTokens()

    return { newAccessToken:accessToken, newRefreshToken:refreshToken };
  }
}
