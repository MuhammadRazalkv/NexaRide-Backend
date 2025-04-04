import RideHistory , {IRideHistory} from "../models/RideHistory"
class RideRepo {
    async createNewRide(data:Partial<IRideHistory>){
        return await RideHistory.insertOne(data)
    }

    async getUserIdByDriverId(id:string){
        return await RideHistory.findOne({driverId:id,status:'ongoing'}).select('userId')
    }
    async findOngoingRideByDriverId(id:string){
        return await RideHistory.findOne({driverId:id,status:'ongoing'})
    }
}

export default new RideRepo()