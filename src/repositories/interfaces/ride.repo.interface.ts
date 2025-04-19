import { IRideHistory } from "../../models/ride.history.model";
import { UpdateResult } from 'mongodb';
import { IRideWithDriver } from "../../services/interfaces/ride.service.interface";

export interface IRideRepo {
    createNewRide(data: Partial<IRideHistory>):Promise<IRideHistory>
    getUserIdByDriverId(id: string): Promise<IRideHistory | null>
    getDriverByUserId(id: string):  Promise<IRideHistory | null>
    findOngoingRideByDriverId(id: string):  Promise<IRideHistory | null>
    cancelRide(driverId: string, userId: string, cancelledBy: string): Promise<UpdateResult>
    updateRideStartedAt(rideId: string):Promise<IRideHistory | null>
    getRideIdByUserAndDriver(driverId: string, userId: string):Promise<IRideHistory | null>
    findRideById(id: string):Promise<IRideHistory | null>
    markCompletedWithData(id: string, commission: number, driverEarnings: number):Promise<IRideHistory | null>
    findRideByUserId(userId: string,skip:number,limit:number):Promise<IRideHistory[] | null>
    findRideByDriver(driverId: string,skip:number,limit:number):Promise<IRideHistory[] | null>
    getUserRideCount(userId:string):Promise<number>
    getDriverRideCount(driverId:string):Promise<number>
    getRideInfoWithDriver(rideId:string):Promise<IRideWithDriver | null >
}