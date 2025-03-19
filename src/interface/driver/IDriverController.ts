import { Request , Response } from "express";

export default interface IDriverController {
    emailVerification(req:Request,res:Response):Promise<void>
    verifyOTP(req:Request,res:Response):Promise<void>      
    addInfo(req:Request,res:Response):Promise<void>      
    addVehicle(req:Request,res:Response):Promise<void>      
}