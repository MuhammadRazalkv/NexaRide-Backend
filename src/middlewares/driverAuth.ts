import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import driverRepo from "../repositories/driverRepo";
import { extractUserIdFromToken } from "../utils/jwt";

export interface ExtendedRequest extends Request {
  id?: string;
}

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
if (!JWT_ACCESS_SECRET) {
  throw new Error("Missing JWT_ACCESS_SECRET in environment variables");
}

const authMiddleware = async (
  req: ExtendedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.header("Authorization")?.split(" ")[1];
 

    if (!token) {
      res.status(401).json({ message: "No token, authorization denied" });
      return;
    }

    const decoded = extractUserIdFromToken(token);
    

    if (!decoded) {
      res.status(401).json({ message: "Error in decoding the token " });
      return;
    }
    req.id = decoded;

    const driver = await driverRepo.findDriverById(req.id);

    if (!driver) {
      res.status(404).json({ message: "Driver not found" });
      return;
    }

    if (driver.isBlocked) {
      res
        .status(403)
        .json({
          message:
            "Your account has been blocked. Contact support for assistance.",
        });
      return;
    }
    

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ message: "Token expired, please log in again" });
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ message: "Invalid token" });
      return;
    }
    res.status(500).json({ message: "Internal server error" });
    return;
  }
};

export default authMiddleware;
