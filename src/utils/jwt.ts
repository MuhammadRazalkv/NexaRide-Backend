
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const ACCESS_SECRET = process.env.ACCESS_SECRET || "access_secret";
const REFRESH_SECRET = process.env.REFRESH_SECRET || "refresh_secret";

// Payload Interface
interface TokenPayload {
  id: string;
  role: "user" | "driver" | "admin";
}

// Generate Access Token
export const generateAccessToken = (userId: string, role: TokenPayload["role"]) => {
  return jwt.sign({ id: userId, role }, ACCESS_SECRET, { expiresIn: "20m" });
};

// Generate Refresh Token
export const generateRefreshToken = (userId: string, role: TokenPayload["role"]) => {
  return jwt.sign({ id: userId, role }, REFRESH_SECRET, { expiresIn: "7d" });
};

// Forgot Password Token 
export const forgotPasswordToken = (userId: string, email: string) => {
  return jwt.sign({ userId, email }, REFRESH_SECRET, { expiresIn: "1h" });
};

// Verify Access Token
export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, ACCESS_SECRET) as TokenPayload;
};

// Verify Refresh Token
export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, REFRESH_SECRET) as TokenPayload;
};

// Verify Forgot Password Token
export const verifyForgotPasswordToken = (token: string) => {
  try {
    return jwt.verify(token, REFRESH_SECRET);
  } catch (error) {
    console.error("Forgot Password Token Invalid:", error);
    return null;
  }
};

// Extract User ID from Access Token
export const extractUserIdFromToken = (token: string) => {
  try {
    const decoded = jwt.verify(token, ACCESS_SECRET) as TokenPayload;
    return decoded.id;
  } catch (error) {
    console.error("Error verifying token:", error);
    throw error;
  }
};

