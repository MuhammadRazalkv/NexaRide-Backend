import Pricing from "../models/PricingModel";
interface IUpdateFare {
    vehicleClass: "Basic" | "Premium" | "Luxury";
    farePerKm: number;
}


class AdminRepo {

    async updateFare(updates: IUpdateFare[]) {
        for (const update of updates) {
            await Pricing.findOneAndUpdate(
                { vehicleClass: update.vehicleClass },
                { $set: { farePerKm: update.farePerKm } }, 
                { upsert: true, new: true } 
            );
        }
        return await Pricing.find().select('vehicleClass farePerKm')
    }

    async getFares(){
        return await Pricing.find().select('vehicleClass farePerKm')
    }
}

export default new AdminRepo()