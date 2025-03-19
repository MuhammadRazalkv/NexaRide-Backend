import mongoose from "mongoose";
import Driver from "../models/DriverModel";
import { IDrivers } from "../models/DriverModel";

class DriverRepo {
    async findDriverById(id: mongoose.Types.ObjectId | string) {
        return await Driver.findById(id)
    }
    async findDriverByVehicleId(id: mongoose.Types.ObjectId | string) {
        return await Driver.findOne({vehicle_id:id})
    }

    async findDriverByEmail(email: string) {
        return await Driver.findOne({ email: email })
    }

    async createDriver(data: Partial<IDrivers>) {
        try {
            return await Driver.create(data)

        } catch (error: any) {
            console.error("Database error:", error);

            // Handle duplicate key errors (MongoDB error code 11000)
            if (error.code === 11000) {
                const field = Object.keys(error.keyPattern)[0];
                const info = field === "phone" ? "number" : "address";
                throw new Error(`${field.charAt(0).toUpperCase() + field.slice(1)} ${info} already exists`);
            }

            throw new Error("Database operation failed. Please try again.");
        }
    }

    async findByIdAndUpdate(id: string | mongoose.Types.ObjectId, data: Partial<IDrivers>) {

        try {
            return await Driver.findByIdAndUpdate(
                id,
                { $set: { ...data, status: "pending" } },
                { new: true }
            );

        } catch (error: any) {
            if (error instanceof mongoose.Error.CastError) {
                throw new Error("Invalid ID format");
            }
            if (error.code === 11000) {
                const field = Object.keys(error.keyPattern)[0];
                const info = field === "phone" ? "number" : "address";
                throw new Error(`${field.charAt(0).toUpperCase() + field.slice(1)} ${info} already exists`);
            }
            throw new Error("Database operation failed. Please try again.");

        }
    }

    async getAllDrivers(): Promise<IDrivers[]> {
        return await Driver.find({ status: 'approved' }).select("_id name email isBlocked").lean();
    }

    async blockUnblockDriver(id: string, status: boolean) {
        return await Driver.findByIdAndUpdate(id,
            { $set: { isBlocked: !status } },
            { new: true }
        )
    }

    async getPendingDriversWithVehicle(): Promise<Partial<IDrivers>[]> {

        return await Driver.aggregate([
            {
                $lookup: {
                    from: 'vehicles',
                    localField: 'vehicle_id',
                    foreignField: '_id',
                    as: 'vehicleDetails'
                }
            },
            {
                $unwind: '$vehicleDetails'
            },
            {
                $match: {
                    $or: [
                        { 'status': 'pending' },
                        { 'vehicleDetails.status': 'pending' }
                    ]
                }
            },
            {
                $project: {
                    "name": 1,
                    "email": 1,
                    "phone": 1,
                    "license_number": 1,
                    "street": 1,
                    "city": 1,
                    "state": 1,
                    "pin_code": 1,
                    "dob": 1,
                    "license_exp": 1,
                    "status": 1,
                    "vehicleDetails": {
                        "_id":1,
                        "nameOfOwner": 1,
                        "addressOfOwner": 1,
                        "brand": 1,
                        "vehicleModel": 1,
                        "color": 1,
                        "numberPlate": 1,
                        "regDate": 1,
                        "expDate": 1,
                        "insuranceProvider": 1,
                        "policyNumber": 1,
                        "vehicleImages": 1,
                        "status":1,
                        "category":1
                    }
                }
            }
        ])



        // return await Driver.find({ status: "pending" }).select(
        //     "name email phone license_number vehicle_id street city state pin_code dob license_exp"
        // );
    }

    async rejectDriver(id: string, reason: string) {
        return await Driver.findByIdAndUpdate(id,
            { $set: { rejectionReason: reason, status: 'rejected' } },
            { new: true }
        )
    }

    async approveDriver(id: string) {
        return await Driver.findByIdAndUpdate(id,
            { $set: { status: 'approved' } },
            { new: true }
        )
    }

    async setGoogleId(id:string,email:string){
        return await Driver.findOneAndUpdate({email},
            { $set: { googleId: id } },
            { new: true }
        )
    }

    
    async setPFP(id:string,profilePic:string){
        return await Driver.findByIdAndUpdate(id,
            { $set: { profilePic: profilePic } },
            { new: true }
        )
    }

    async changePassword(id:string,password:string){
        return await Driver.findByIdAndUpdate(id,
            { $set: { password } },
            { new: true }
        )
    }

}

export default new DriverRepo()