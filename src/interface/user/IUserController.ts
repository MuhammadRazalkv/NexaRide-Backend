import { Request,Response } from "express"

export interface IUserController {
    emailVerification(req:Request,res:Response):Promise<void>
    verifyOTP(req:Request,res:Response):Promise<void>
    addInfo(req:Request,res:Response):Promise<void>
    reSendOTP(req:Request,res:Response):Promise<void>
    login(req:Request,res:Response):Promise<void>
    googleLogin(req:Request,res:Response):Promise<void>
    requestPasswordReset(req:Request,res:Response):Promise<void>
    resetPassword(req:Request,res:Response):Promise<void>
}