import { IVehicle } from "../models/VehicleModel"
import vehicleRepo from "../repositories/vehicleRepo";
import { z } from 'zod'
import cloudinary from '../utils/cloudinary'
import mongoose from "mongoose";
import driverRepo from "../repositories/driverRepo";


function validateLicensePlate(value: string): boolean {

  const licensePlateRegex = /^[A-Z]{2}[ -]?[0-9]{1,2}[ -]?[A-Z]{1,2}[ -]?[0-9]{1,4}$/;
  return licensePlateRegex.test(value);
}

const vehicleSchema = z.object({
  // driverId: z.string().refine((val) => {
  //   const hexRegex = /^[a-f\d]{24}$/i;
  //   return hexRegex.test(val);
  // }, "Invalid Driver ID"),

  nameOfOwner: z.string().min(1, "Name of owner is required").trim(),

  addressOfOwner: z.string().min(1, "Street address is required").trim(),

  brand: z.string().min(1, "Vehicle brand is required").trim(),

  vehicleModel: z.string().min(1, "Vehicle model is required").trim(),

  color: z.string().min(1, "Vehicle color is required").trim(),

  numberPlate: z.string()
    .min(1, "Number plate is required")
    .refine(validateLicensePlate, "Invalid Number Plate Format"),
  regDate: z.preprocess(
    (arg) => {
      if (typeof arg === "string") {
        // Convert string to Date
        const parsedDate = new Date(arg);
        return isNaN(parsedDate.getTime()) ? undefined : parsedDate; // Ensure valid date
      }
      return arg; // Assume it's already a Date or invalid
    },
    z.date().refine(
      (date) => date <= new Date(),
      "Registration date cannot be in the future"
    )
  ),

  expDate: z.preprocess(
    (arg) => {
      if (typeof arg === "string") {
        // Convert string to Date
        const parsedDate = new Date(arg);
        return isNaN(parsedDate.getTime()) ? undefined : parsedDate; // Ensure valid date
      }
      return arg; // Assume it's already a Date or invalid
    },
    z.date().refine(
      (date) => date >= new Date(),
      "Expiration date must not be in the past"
    )
  ),

  insuranceProvider: z.string().min(1, "Insurance provider is required").trim(),

  policyNumber: z.string()
    .regex(/^\d{10}$/, "Policy number must be exactly 10 digits"),

  vehicleImages: z.object({
    frontView: z.string(),
    rearView: z.string(),
    interiorView: z.string(),
  }),
});



class VehicleService {


  async addVehicle(data: IVehicle) {
    if (!data) {
      throw new Error("Data is missing");
    }

    // Validate driverId before using it
    if (!mongoose.Types.ObjectId.isValid(data.driverId)) {
      throw new Error("Invalid driver id");
    }

    // Validate input using Zod
    const parsedData = vehicleSchema.safeParse(data);
    if (!parsedData.success) {
      console.error("Zod validation error:", parsedData.error.format());

      const errorMessages = Object.values(parsedData.error.flatten().fieldErrors)
        .flat()
        .join(", ");

      throw new Error("Invalid input: " + errorMessages);
    }

    // Convert driverId to ObjectId
    const driverId = new mongoose.Types.ObjectId(data.driverId);

    // Check if driver exists
    const driver = await driverRepo.findDriverById(driverId);
    if (!driver) {
      throw new Error("Driver not found, please retry after signup");
    }

    // Upload vehicle images
    const vehicleImages = { ...parsedData.data.vehicleImages };
    for (const key of ["frontView", "rearView", "interiorView"] as const) {
      try {
        const img = vehicleImages[key];
        const res = await cloudinary.uploader.upload(img, {
          folder: "/DriverVehicleImages",
        });
        vehicleImages[key] = res.secure_url;
      } catch (error) {
        console.error(`Failed to upload image ${vehicleImages[key]}:`, error);
        throw new Error(error instanceof Error ? error.message : "Image upload failed");
      }
    }

    console.log("Updated vehicle details after image upload:", vehicleImages);

    // Register the vehicle with updated images
    const vehicleData = { ...parsedData.data, vehicleImages };
    const vehicle = await vehicleRepo.registerNewVehicle(vehicleData);

    driver.vehicle_id = vehicle._id as mongoose.Schema.Types.ObjectId;
    await driver.save();


    console.log("Vehicle registered successfully:", vehicle);
    return {
      driver: {
        name: driver.name,
        email: driver.email,
        status: 'Pending'
      }

    }
  }

  async reApplyVehicle(id: string, data: IVehicle) {
    if (!data) {
      throw new Error("Data is missing");
    }

    // Validate driverId before using it
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid driver id");
    }

    // Validate input using Zod
    const parsedData = vehicleSchema.safeParse(data);
    if (!parsedData.success) {
      console.error("Zod validation error:", parsedData.error.format());

      const errorMessages = Object.values(parsedData.error.flatten().fieldErrors)
        .flat()
        .join(", ");

      throw new Error("Invalid input: " + errorMessages);
    }

    // Convert driverId to ObjectId
    const driverId = new mongoose.Types.ObjectId(id);

    // Check if driver exists
    const driver = await driverRepo.findDriverById(driverId);
    if (!driver) {
      throw new Error("Driver not found, please retry after signup");
    }
    if (!driver.vehicle_id) {
      throw new Error("Vehicle not found");
    }
    const vehicleDetails = await vehicleRepo.findVehicleById(driver.vehicle_id)
    if (!vehicleDetails) {
      throw new Error("Vehicle not found");
    }
    // Upload vehicle images
    const vehicleImages = { ...parsedData.data.vehicleImages };
    for (const key of ["frontView", "rearView", "interiorView"] as const) {
      try {
        const img = vehicleImages[key];
        const res = await cloudinary.uploader.upload(img, {
          folder: "/DriverVehicleImages",
        });
        vehicleImages[key] = res.secure_url;
      } catch (error) {
        console.error(`Failed to upload image ${vehicleImages[key]}:`, error);
        throw new Error(error instanceof Error ? error.message : "Image upload failed");
      }
    }

    console.log("Updated vehicle details after image upload:", vehicleImages);

    // Register the vehicle with updated images
    const vehicleData = { ...parsedData.data, vehicleImages };
    const vehicle = await vehicleRepo.updatedVehicleData(id, vehicleData);



    console.log("Vehicle registered successfully:", vehicle);
    return {
      driver: {
        name: driver.name,
        email: driver.email,
        status: 'Pending'
      }

    }
  }

  async rejectReason(driverId: string) {
    try {
      const id = new mongoose.Types.ObjectId(driverId);
      const driver = await driverRepo.findDriverById(id);

      if (!driver) {
        throw new Error('Driver not found. Please ensure you have registered.');
      }
      if (!driver.vehicle_id) {
        throw new Error('Vehicle not found')
      }

      const vehicle = await vehicleRepo.findVehicleById(driver.vehicle_id)
      if (!vehicle) {
        throw new Error('Vehicle not found')

      }
      if (vehicle.status !== 'rejected') {
        throw new Error('There seems to be an issue with your application status. Please log in again to check your current status.');
      }

      console.log('Vehicle data ', vehicle);


      const reason = vehicle.rejectionReason;

      return {
        reason
      };

    } catch (error) {
      console.error("Error in DriverService -> rejectReason:", error);
      if (error instanceof Error) throw error;
      throw new Error('Internal server error');
    }
  }

}

export default new VehicleService()