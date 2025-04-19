import { Request,Response,NextFunction } from "express";
import { AppError } from "../utils/appError";
import { messages } from "../constants/httpMessages";
import { HttpStatus } from "../constants/httpStatusCodes";

 const errorHandler = async (err:AppError|Error,req:Request,res:Response,next:NextFunction)=>{
    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR
    let msg = messages.SERVER_ERROR

    if (err instanceof AppError) {
        statusCode = err.statusCode
        msg = err.message
    }else{
        console.error("Unhandled Error:", err);
        msg = err.message || messages.SERVER_ERROR;
    }
    res.status(statusCode).json({message:msg})
}
export default errorHandler