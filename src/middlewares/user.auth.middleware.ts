import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import userRepo from "../repositories/user.repo";
import { extractUserIdFromToken } from "../utils/jwt";

export interface ExtendedRequest extends Request {
  id?: string;
}

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
if (!JWT_ACCESS_SECRET) {
  throw new Error("Missing JWT_ACCESS_SECRET in environment variables");
}

const userAuthMiddleware = async (
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

    const user = await userRepo.findUserById(req.id);

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    if (user.isBlocked) {
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
      console.log("Token expired error:", error.message);
      res.status(401).json({ message: "Token expired, please log in again" });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ message: "Invalid token" });
      return;
    }

    console.log("Unexpected error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export default userAuthMiddleware;
