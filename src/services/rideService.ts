import { CheckCabs } from "../interface/Iride";
import Pricing from "../models/PricingModel";
import driverRepo from "../repositories/driverRepo"
import userRepo from "../repositories/userRepo"

class RideService {
    async checkCabs(id:string,data:CheckCabs){
        const pickupCoords:[number,number] = [data.pickUpPoint.lat,data.pickUpPoint.lng]
        console.log('Pickup coords ',pickupCoords);
        
        const drivers = await driverRepo.getAvailableDriversNearby(pickupCoords)
        const fares = await driverRepo.findPrices()
  

        const updatedDrivers = drivers.map(driver => {
            const matchingFare = fares.find(fare => 
                fare.vehicleClass.toLowerCase() === driver.vehicleDetails.category.toLowerCase()
            );
            const km = data.distance / 1000
            return {
                ...driver,
                totalFare: matchingFare ? Math.round(matchingFare.farePerKm * km ): 0  
            };
        });
        
        console.log(updatedDrivers);
        

       
        return updatedDrivers
    }

    async assignRandomLocation(id:string){ 
        const randomLocations = [
            [77.5946, 12.9716], // MG Road (Central Hub)
            [77.6074, 12.9746], // Brigade Road (Shopping & Dining)
            [77.5670, 12.9776], // Cubbon Park (Nature & Leisure)
            [77.5806, 12.9351], // Koramangala (IT & Dining Hub)
            [77.6484, 12.9784], // Indiranagar (Nightlife & Cafes)
            [77.7025, 12.9608], // Whitefield (Tech Park Area)
            [77.6143, 12.9260], // HSR Layout (Residential & Startups)
            [77.5671, 12.9985], // Malleshwaram (Traditional Market)
            [77.5625, 12.9242], // Jayanagar (Residential & Shopping)
            [77.7135, 12.8951], // Electronic City (Tech Hub)
        ];
        
        
        const randomCoordinate = randomLocations[Math.floor(Math.random() * randomLocations.length)];
        await driverRepo.assignRandomLocation(id,randomCoordinate)
        return randomCoordinate
    }
}

export default new RideService()