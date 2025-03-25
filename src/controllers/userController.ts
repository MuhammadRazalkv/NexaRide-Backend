import { Request, Response } from "express";
import { IUserController } from "../interface/user/IUserController";
import userService from "../services/userService";
import { ExtendedRequest } from "../middlewares/userAuth";

class UserController implements IUserController {
  async emailVerification(req: Request, res: Response): Promise<void> {
    try {
      await userService.emailVerification(req.body);
      res
        .status(201)
        .json({ message: "OTP has been sent to the e-mail address" });
    } catch (error: any) {
      console.log(
        "Error in UserController -> emailVerification ",
        error.message
      );
      res.status(400).json({ message: error.message });
    }
  }

  async verifyOTP(req: Request, res: Response): Promise<void> {
    try {
      const { email, otp } = req.body;
      await userService.verifyOTP(email, otp);
      res.status(201).json({ message: "Email has been verified" });
    } catch (error: any) {
      console.log("Error in UserController -> verifyOTP ", error.message);
      res.status(400).json({ message: error.message });
    }
  }

  async addInfo(req: Request, res: Response): Promise<void> {
    try {
      const data = await userService.addInfo(req.body);

      // Securely store the refresh token in an HTTP-only cookie
      // ! NOT WORKING
      res.cookie("userRefreshToken", data.refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(201).json({
        message: "User created successfully",
        accessToken: data.accessToken,
        user: data.user,
      });
    } catch (error: any) {
      console.error("Error in UserController -> addInfo:", error);
      res.status(400).json({ message: error.message });
    }
  }

  async reSendOTP(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      await userService.reSendOTP(email);
      res.status(201).json({ message: "OTP re-sended to your e-mail address" });
    } catch (error: any) {
      console.log("Error in UserController -> reSendOTP ", error.message);
      res.status(400).json({ message: error.message });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const data = await userService.login(req.body);
      console.log(data.refreshToken);

      res.cookie("userRefreshToken", data.refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        message: "Login successful",
        accessToken: data.accessToken,
        user: data.user,
      });
    } catch (error: any) {
      console.log("Error in UserController -> login ", error.message);
      res.status(401).json({ message: error.message });
    }
  }

  async googleLogin(req: Request, res: Response): Promise<void> {
    try {
      const data = await userService.googleLogin(req.body);

      res.cookie("userRefreshToken", data.refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        message: "Login successful",
        accessToken: data.accessToken,
        user: data.user,
      });
    } catch (error: any) {
      console.log("Error in UserController -> googleLogin ", error.message);
      res.status(401).json({ message: error.message });
    }
  }

  async requestPasswordReset(req: Request, res: Response): Promise<void> {
    try {
      await userService.requestPasswordReset(req.body.email);
      res
        .status(200)
        .json({
          message: "Password reset link has been sent your email address",
        });
    } catch (error: any) {
      console.log(
        "Error in UserController -> request passwordRest ",
        error.message
      );
      res.status(401).json({ message: error.message });
    }
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { id, token, password } = req.body;
      await userService.resetPassword(id, token, password);
      res.status(200).json({ message: "Password has been reset" });
    } catch (error: any) {
      console.log("Error in UserController -> reset password ", error.message);
      res.status(401).json({ message: error.message });
    }
  }

  async getUserInfo(req: ExtendedRequest, res: Response): Promise<void> {
    try {
      const id = req.id;
      if (!id) {
        throw new Error("Id is missing ");
      }
      const user = await userService.getUserInfo(id);
      console.log("User ", user);

      res.status(200).json({ user: user });
    } catch (error: any) {
      console.log("Error in UserController -> get user info  ", error.message);
      res.status(401).json({ message: error.message });
    }
  }

  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const refreshToken = req.cookies?.userRefreshToken;
      console.log("Refresh token route");

      if (!refreshToken) {
        console.log("NO refresh token block ");

        res
          .status(401)
          .json({ message: "Unauthorized - No refresh token provided" });
        return;
      }

      const response = await userService.refreshToken(refreshToken);
      console.log("New tokens ", response);

      res.cookie("refreshToken", response.newRefreshToken, {
        httpOnly: true,
        secure: process.env.PRODUCTION === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        message: "Token refreshed successfully",
        accessToken: response.newAccessToken,
      });
    } catch (error: any) {
      console.error("Token Refresh Error:", error.message);

      if (error.message === "Invalid refresh token") {
        res.status(403).json({ message: "Invalid refresh token" });
        return;
      }

      res.status(401).json({ message: error.message || "Unauthorized" });
    }
  }

  async updateUserName(req: ExtendedRequest, res: Response): Promise<void> {
    try {
      const id = req.id;
      const name = req.body.name;
      if (!id) {
        throw new Error("Id is missing ");
      }
      const user = await userService.updateUserName(id, name);
      console.log("User ", user);

      res.status(200).json({ success: true, name: user });
    } catch (error: any) {
      console.log("Error in UserController -> update name  ", error.message);
      res.status(401).json({ message: error.message });
    }
  }

  async updateUserPhone(req: ExtendedRequest, res: Response): Promise<void> {
    try {
      const id = req.id;
      const phone = req.body.phone;
      if (!id) {
        throw new Error("Id is missing ");
      }
      const newPhone = await userService.updateUserPhone(id, phone);
      console.log("new Phone ", newPhone);

      res.status(200).json({ success: true, phone: newPhone });
    } catch (error: any) {
      console.log("Error in UserController -> update phone  ", error.message);
      res.status(401).json({ message: error.message });
    }
  }

  async updateUserPfp(req: ExtendedRequest, res: Response): Promise<void> {
    try {
      const id = req.id;
      const image = req.body.image;
      if (!id) {
        throw new Error("Id is missing ");
      }
      const newImg = await userService.updateUserPfp(id, image);
      console.log("new img ", newImg);

      res.status(200).json({ success: true, image: newImg });
    } catch (error: any) {
      console.log("Error in UserController -> update pfp  ", error.message);
      res.status(401).json({ message: error.message });
    }
  }
}

export default new UserController();
