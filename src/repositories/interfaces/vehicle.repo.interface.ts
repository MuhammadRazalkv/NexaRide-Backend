import { IVehicle } from "../../models/vehicle.model";
import { ObjectId } from "mongoose";
import { BaseRepository } from "../base.repo";

export interface IVehicleRepo extends BaseRepository<IVehicle> {
    // findVehicleById(vehicleId: string | ObjectId): Promise<IVehicle | null>
    registerNewVehicle(data: Partial<IVehicle>): Promise<IVehicle>
    // updatedVehicleData(id: string | ObjectId, data: Partial<IVehicle>):Promise<IVehicle | null>
    // getVehicleInfo(vehicleId: string): Promise<IVehicle | null>
    // approveVehicle(id: string, category: string):Promise<IVehicle | null>
    // rejectVehicle(id: string, reason: string): Promise<IVehicle | null>
}