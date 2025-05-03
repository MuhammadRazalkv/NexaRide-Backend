// import jwt from "jsonwebtoken";
// import { Request, Response, NextFunction } from "express";
// import { UserRepository } from "../repositories/user.repo";
// import { extractUserIdFromToken } from "../utils/jwt";



// const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
// if (!JWT_ACCESS_SECRET) {
//   throw new Error("Missing JWT_ACCESS_SECRET in environment variables");
// }

// export const userAuthenticationMiddleware = (userRepo: UserRepository) => {
//   return async (req: ExtendedRequest, res: Response, next: NextFunction) => {
//     try {
//       const token = req.header("Authorization")?.split(" ")[1];

//       if (!token) {
//         res.status(401).json({ message: "No token, authorization denied" });
//         return;
//       }

//       const decoded = extractUserIdFromToken(token);

//       if (!decoded) {
//         res.status(401).json({ message: "Error in decoding the token " });
//         return;
//       }
//       req.id = decoded;

//       const user = await userRepo.findUserById(req.id);

//       if (!user) {
//         res.status(404).json({ message: "User not found" });
//         return;
//       }

//       if (user.isBlocked) {
//         res.status(403).json({
//           message:
//             "Your account has been blocked. Contact support for assistance.",
//         });
//         return;
//       }

//       next();
//     } catch (error) {
//       if (error instanceof jwt.TokenExpiredError) {
//         console.log("Token expired error:", error.message);
//         res.status(401).json({ message: "Token expired, please log in again" });
//         return;
//       }

//       if (error instanceof jwt.JsonWebTokenError) {
//         res.status(401).json({ message: "Invalid token" });
//         return;
//       }

//       console.log("Unexpected error:", error);
//       res.status(500).json({ message: "Internal server error" });
//     }
//   };
// };

import jwt, { JsonWebTokenError } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { HttpStatus } from "../constants/httpStatusCodes";
import { messages } from "../constants/httpMessages";
import { UserRepository } from "../repositories/user.repo";
import { DriverRepo } from "../repositories/driver.repo";

const ACCESS_SECRET = process.env.ACCESS_SECRET || "access_secret";
export interface ExtendedRequest extends Request {
  id?: string;
}
interface JwtPayload {
  id: string;
  role: string;
}

export const authenticateWithRoles = (
  role: "user" | "driver" | "admin",
  repo?: UserRepository | DriverRepo
) => {
  return async (req: ExtendedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      console.log('No token error ');
      
      res.status(HttpStatus.UNAUTHORIZED).json({ message: messages.FORBIDDEN });
      return;
    }

    try {
      const decoded = jwt.verify(token, ACCESS_SECRET) as JwtPayload;
    
      
      if (decoded.role !== role) {
        console.log('No matching role ');
        
        res.status(HttpStatus.FORBIDDEN).json({ message: messages.FORBIDDEN });
        return;
      }

      req.id = decoded.id;
      if (decoded.role !== 'admin' && repo) {
        
      const user = await repo.findById(req.id);
      if (!user) {
        res
          .status(HttpStatus.NOT_FOUND)
          .json({ message: messages.USER_NOT_FOUND });
        return;
      }

      if (user.isBlocked) {
        res.status(HttpStatus.FORBIDDEN).json({
          message: messages.ACCOUNT_BLOCKED,
        });
        return;
      }
    }

      next();
    } catch (error : any) {
      if (error.name === "TokenExpiredError") {
        console.log('TokenExpiredError ',role);
        
        res.status(HttpStatus.UNAUTHORIZED).json({ message: messages.TOKEN_EXPIRED });
        return
      }
      if (error.name === "JsonWebTokenError") {
        console.log('JsonWebTokenError ',role);

        res.status(HttpStatus.UNAUTHORIZED).json({ message: messages.INVALID_TOKEN });
        return
      }
      next(error);
    }
  };
};
