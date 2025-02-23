import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const ACCESS_SECRET = process.env.ACCESS_SECRET || "access_secret";
const REFRESH_SECRET = process.env.REFRESH_SECRET || "refresh_secret";

export const generateAccessToken = (userId: string) => {
    return jwt.sign({ userId }, ACCESS_SECRET, { expiresIn: "15m" });
};

export const generateRefreshToken = (userId: string) => {
    return jwt.sign({ userId }, REFRESH_SECRET, { expiresIn: "7d" });
};

export const forgotPasswordToken = async (userId: string , email:string) => {
    return jwt.sign({ userId , email }, REFRESH_SECRET , { expiresIn: "1h" });
};


export const verifyAccessToken = (token: string) => {
    return jwt.verify(token, ACCESS_SECRET);
};

export const verifyRefreshToken = (token: string) => {
    return jwt.verify(token, REFRESH_SECRET);
};

export const verifyForgotPasswordToken = (token: string) => {
    try {
      const decoded = jwt.verify(token, REFRESH_SECRET);
      return decoded; // Return the decoded payload if the token is valid
    } catch (error) {
        if (error instanceof Error) {    
            console.error('Token verification failed:', error.message);
        }
      return null;
    }
  };


