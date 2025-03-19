import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { verifyAdminAccessToken } from '../utils/jwt';

export const adminAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies?.adminAccessToken;

    if (!token) {
        res.status(401).json({ message: 'Access denied: No token provided' });
        return 
    }

    try {
        const decoded = verifyAdminAccessToken(token)
        console.log('Decoded ',decoded);
        
        // const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string) as { role: string };

        if (decoded.role !== 'admin') {
            res.status(403).json({ message: 'Admin access only' });
            return 
        }

        next();
    } catch (error) {
        console.log(error);
        
        res.status(403).json({ message: 'Invalid or expired access token' });
        return 
    }
};
