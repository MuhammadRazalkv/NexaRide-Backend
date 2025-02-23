import { Request, Response } from "express";
import { IUserController } from "../interface/user/IUserController";
import userService from "../services/userService";

class UserController implements IUserController {

    async emailVerification(req: Request, res: Response): Promise<void> {
        try {
            await userService.emailVerification(req.body)
            res.status(201).json({ message: 'OTP has been sent to the e-mail address' })
        } catch (error: any) {
            console.log('Error in UserController -> emailVerification ', error.message);
            res.status(400).json({ message: error.message });
        }
    }

    async verifyOTP(req: Request, res: Response): Promise<void> {
        try {
            const { email, otp } = req.body
            await userService.verifyOTP(email, otp)
            res.status(201).json({ message: 'Email has been verified' })
        } catch (error: any) {
            console.log('Error in UserController -> verifyOTP ', error.message);
            res.status(400).json({ message: error.message });
        }
    }

    async addInfo(req: Request, res: Response): Promise<void> {
        try {
            const data = await userService.addInfo(req.body);

            // Securely store the refresh token in an HTTP-only cookie
            res.cookie("refreshToken", data.refreshToken, {
                httpOnly: true,
                secure: true,
                sameSite: "strict",
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });

            res.status(201).json({
                message: "User created successfully",
                accessToken: data.accessToken,
                user: data.user
            });
        } catch (error: any) {
            console.error("Error in UserController -> addInfo:", error);
            res.status(400).json({ message: error.message });
        }
    }

    async reSendOTP(req: Request, res: Response): Promise<void> {
        try {
            const { email } = req.body
            await userService.reSendOTP(email)
            res.status(201).json({ message: 'OTP re-sended to your e-mail address' })
        } catch (error: any) {
            console.log('Error in UserController -> reSendOTP ', error.message);
            res.status(400).json({ message: error.message });
        }
    }

    async login(req: Request, res: Response): Promise<void> {
        try {
            const data = await userService.login(req.body)
            res.cookie("refreshToken", data.refreshToken, {
                httpOnly: true,
                secure: true,
                sameSite: "strict",
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });
            console.log('Access token ', data.accessToken);
            console.log("Refresh token", data.refreshToken);
            console.log("User ", data.user);



            res.status(200).json({
                message: 'Login successful',
                accessToken: data.accessToken,
                user: data.user
            })
        } catch (error: any) {
            console.log('Error in UserController -> login ', error.message);
            res.status(401).json({ message: error.message });
        }
    }

    async googleLogin(req: Request, res: Response): Promise<void> {
        try {
            const data = await userService.googleLogin(req.body)

            res.status(200).json({
                message: 'Login successful',
                accessToken: data.accessToken,
                user: data.user
            })
        } catch (error: any) {
            console.log('Error in UserController -> googleLogin ', error.message);
            res.status(401).json({ message: error.message });
        }
    }

    async requestPasswordReset(req: Request, res: Response): Promise<void> {
        try {
            await userService.requestPasswordReset(req.body.email)
            res.status(200).json({ message: 'Password reset link has been sent your email address' });
        } catch (error: any) {
            console.log('Error in UserController -> request passwordRest ', error.message);
            res.status(401).json({ message: error.message });
        }
    }

    async resetPassword(req: Request, res: Response): Promise<void> {
        try {

            const {id, token , password } = req.body;
            await userService.resetPassword(id,token,password)
            res.status(200).json({ message: 'Password has been reset' });

        } catch (error: any) {
            console.log('Error in UserController -> reset password ', error.message);
            res.status(401).json({ message: error.message });
        }
    }
}

export default new UserController()