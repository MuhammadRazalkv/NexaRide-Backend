import { IUser } from "../models/user.model";
import userRepo from "../repositories/user.repo";
import OTPRepo from "../repositories/otp.repo";
import crypto from "crypto";
import redis from "../config/redis";
import { html, resetLinkBtn } from "../constants/OTP";
import { hashPassword, comparePassword } from "../utils/passwordManager";
import { z } from "zod";
import {
  generateAccessToken,
  generateRefreshToken,
  forgotPasswordToken,
  verifyRefreshToken,
  verifyForgotPasswordToken,
} from "../utils/jwt";
import sendEmail from "../utils/mailSender";
import cloudinary from "../utils/cloudinary";
import Stripe from "stripe";
import walletRepo from "../repositories/wallet.repo";
import rideRepo from "../repositories/ride.repo";
import driverRepo from "../repositories/driver.repo";
import { getIO } from "../utils/socket";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

const YOUR_DOMAIN = "http://localhost:5173";

const userSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  email: z.string().email("Invalid email format"),
  phone: z.number().min(1000000000, "Phone must be a 10-digit number"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  profilePic: z.string().optional(),
  googleId: z.string().optional(),
});

const generateTokens = (userId: string) => ({
  accessToken: generateAccessToken(userId),
  refreshToken: generateRefreshToken(userId),
});

class UserService {
  async emailVerification(userData: IUser) {
    const { email } = userData;
    if (!email) throw new Error("Email not found");
    const existingUser = await userRepo.findUserByEmail(userData.email);
    if (existingUser) throw new Error("User already exists");

    const OTP = crypto.randomInt(1000, 10000).toString();
    console.log("OTP", OTP);
    OTPRepo.setOTP(email, OTP);
    OTPRepo.sendOTP(email, "Your NexaRide OTP", html(OTP)).catch(console.error);
  }

  async verifyOTP(email: string, otp: string) {
    if (!email || !otp) {
      throw new Error("Email or  OTP is missing");
    }
    const SOTP = await OTPRepo.getOTP(email);

    if (!SOTP || otp !== SOTP) {
      throw new Error("Invalid or expired OTP");
    }

    OTPRepo.markEmailVerified(email);
    OTPRepo.deleteOTP(email);
  }

  async reSendOTP(email: string) {
    if (!email) {
      throw new Error("Email is missing");
    }
    if (!email) throw new Error("Email not found");
    const existingUser = await userRepo.findUserByEmail(email);
    if (existingUser) throw new Error("User already exists");

    const OTP = crypto.randomInt(1000, 10000).toString();
    console.log("resend - OTP", OTP);
    OTPRepo.setOTP(email, OTP);
    OTPRepo.sendOTP(email, "Your new  NexaRide OTP", html(OTP)).catch(
      console.error
    );
  }

  async addInfo(userData: IUser) {
    try {
      // Validate input with Zod
      const parsedData = userSchema.safeParse(userData);
      if (!parsedData.success) {
        console.error("Zod validation error:", parsedData.error.format());
        throw new Error(
          "Invalid input: " +
            parsedData.error.errors.map((err) => err.message).join(", ")
        );
      }

      // Check if email is verified
      if (!(await OTPRepo.isEmailVerified(parsedData.data.email))) {
        throw new Error("Email is not verified");
      }

      // Ensure password exists and hash it
      if (!parsedData.data.password) throw new Error("Password is required");
      parsedData.data.password = await hashPassword(parsedData.data.password);

      // Register user
      const newUser = await userRepo.registerNewUser(parsedData.data);
      await OTPRepo.deleteVerifiedEmail(parsedData.data.email);

      // Generate tokens
      return {
        ...generateTokens(newUser._id as string),
        user: {
          _id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: "User",
          profilePic: newUser.profilePic,
        },
      };
    } catch (error: unknown) {
      console.error("Error in UserService -> addInfo:", error);
      if (error instanceof Error) throw error;
      throw new Error("Internal server error");
    }
  }

  async login(userData: IUser) {
    try {
      if (!userData.email || !userData.password) {
        throw new Error("Fields are missing");
      }
      console.log("email ", userData.email);

      // Check if user exists
      const user = await userRepo.findUserByEmail(userData.email);
      console.log("user ", user);

      if (!user) {
        throw new Error("User not found");
      }
      if (user.isBlocked) {
        throw new Error(
          "Your account access has been restricted. Please contact support for assistance"
        );
      }

      // Verify password
      if (!user.password) {
        throw new Error(
          "This account was registered using Google. Please log in with Google."
        );
      }
      const success = await comparePassword(userData.password, user.password);
      if (!success) {
        throw new Error("Invalid email or password");
      }

      // Generate tokens
      return {
        ...generateTokens(user._id as string),
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: "User",
          profilePic: user.profilePic,
        },
      };
    } catch (error: unknown) {
      console.error("Error in UserService -> login:", error);
      if (error instanceof Error) throw error;
      throw new Error("Internal server error");
    }
  }

  async googleLogin(userData: IUser) {
    try {
      if (!userData.email || !userData.googleId) {
        throw new Error("Credentials missing");
      }
      console.log("user data ", userData);

      const user = await userRepo.findUserByEmail(userData.email);

      if (user?.isBlocked) {
        throw new Error(
          "Your account access has been restricted. Please contact support for assistance"
        );
      }

      if (!user) {
        // New user registration
        const newUser = await userRepo.registerNewUser(userData);
        return {
          ...generateTokens(newUser._id as string),
          user: {
            _id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            profilePic: newUser.profilePic,
          },
        };
      }

      // If user exists, only update googleId if it's missing
      if (!user.googleId) {
        user.googleId = userData.googleId;
        await user.save();
      }

      return {
        ...generateTokens(user._id as string),
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          profilePic: user.profilePic,
        },
      };
    } catch (error: unknown) {
      if (error instanceof Error) throw error;
      throw new Error("Internal server error");
    }
  }

  async requestPasswordReset(email: string) {
    try {
      if (!email) {
        throw new Error("Email not found");
      }
      const user = await userRepo.findUserByEmail(email);
      if (!user) {
        throw new Error("User not found ");
      }

      const token = await forgotPasswordToken(user.id, user.email);
      const resetUrl = `http://localhost:5173/user/reset-password?id=${user._id}&token=${token}`;

      await sendEmail(
        user.email,
        "Password Reset Request - Action Required",
        resetLinkBtn(resetUrl)
      );
      console.log("Email has been sent ");
    } catch (error: unknown) {
      if (error instanceof Error) throw error;
      throw new Error("Internal server error");
    }
  }

  async resetPassword(id: string, token: string, password: string) {
    try {
      if (!id || !token) {
        throw new Error("Credentials missing");
      }
      if (!password) {
        throw new Error("Password is missing");
      }
      const user = await userRepo.findUserById(id);
      if (!user) {
        throw new Error("User not exists!");
      }

      const verify = verifyForgotPasswordToken(token);
      if (!verify) {
        throw new Error("Token is invalid or expired.");
      }

      const encryptedPassword = await hashPassword(password);
      await userRepo.changePassword(id, encryptedPassword);
    } catch (error) {
      if (error instanceof Error) throw error;
      throw new Error("Internal server error");
    }
  }

  async getUserInfo(id: string) {
    try {
      if (!id) {
        throw new Error("Id is missing ");
      }
      const user = await userRepo.findUserById(id);
      return user;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw new Error("Internal server error");
    }
  }

  async refreshToken(token: string) {
    if (!token) {
      throw new Error("Unauthorized - No refresh token provided");
    }

    const refresh = verifyRefreshToken(token);
    if (!refresh) {
      throw new Error("Invalid refresh token");
    }

    const newAccessToken = generateAccessToken(refresh.id);
    const newRefreshToken = generateRefreshToken(refresh.id);

    return { newAccessToken, newRefreshToken };
  }

  async updateUserName(id: string, name: string) {
    if (!id || !name) {
      throw new Error("Fields are missing");
    }

    const res = await userRepo.updateName(id, name);
    return res?.name;
  }

  async updateUserPhone(id: string, phone: number) {
    if (!id || !phone) {
      throw new Error("Fields are missing");
    }

    const res = await userRepo.updatePhone(id, phone);
    return res?.phone;
  }

  async updateUserPfp(id: string, image: string) {
    if (!id || !image) {
      throw new Error("Fields are missing");
    }

    try {
      const res = await cloudinary.uploader.upload(image, {
        folder: "/UserProfilePic",
      });
      const user = await userRepo.updatePfp(id, res.secure_url);
      return user?.profilePic;
    } catch (error) {
      console.error(`Failed to update user profile pic `, error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to update user pfp"
      );
    }
  }

  async addMoneyToWallet(id: string, amount: number) {
    if (!id || !amount) {
      throw new Error("Credentials missing");
    }
    if (amount < 50) {
      throw new Error("Minimum amount to add is ₹50.");
    } else if (amount > 3000) {
      throw new Error("Maximum allowed amount is ₹3000.");
    }

    const user = await userRepo.findUserById(id);
    if (!user) {
      throw new Error("User not found");
    }
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name: "Add to Wallet",
            },
            unit_amount: amount * 100, // Stripe expects amount in paisa
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${YOUR_DOMAIN}/user/wallet`,
      cancel_url: `${YOUR_DOMAIN}/user/wallet`,
      metadata: {
        userId: id,
        action: "wallet_topUp",
      },
    });

    return session.url;
  }

  async getWalletInfo(id: string) {
    const user = await userRepo.findUserById(id);
    if (!user) {
      throw new Error("User not found");
    }
    const wallet = await walletRepo.getWalletInfo(id);
    return wallet;
  }

  async webHook(body: any, sig: string) {
    try {
      let event;
      event = stripe.webhooks.constructEvent(
        body,
        sig,
        process.env.WEBHOOK_SECRET_KEY as string
      );

      if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.metadata && session.metadata.action === "wallet_topUp") {
          console.log("Wallet topUp");

          const userId = session.metadata.userId;
          const amount = session.amount_total! / 100;

          //  update the wallet
          await walletRepo.addMoneyToUserWallet(userId, amount);
        } else if (
          session.metadata &&
          session.metadata.action == "ride_payment"
        ) {
          const rideId = session.metadata.rideId;
          const ride = await rideRepo.findRideById(rideId);
          if (!ride) {
            throw new Error("Ride not found");
          }
          const totalFare = ride.totalFare;
          const driverId = ride.driverId;
          const commission = Math.ceil(totalFare * 0.2);
          const driverEarnings = Math.ceil(totalFare - commission);
          const applicationFeesDetails = {
            rideId: ride.id,
            driverId,
            totalFare,
            commission,
            driverEarnings,
            paymentMethod: "stripe",
          };
          await walletRepo.addToCommission(applicationFeesDetails);
          await walletRepo.addMoneyToDriver(
            driverId as string,
            ride.id,
            driverEarnings
          );
          await rideRepo.markCompletedWithData(
            ride.id,
            commission,
            driverEarnings
          );
          await driverRepo.goBackToOnline(driverId as string);
          const driverSocketId = await redis.get(`OD:${driverId}`);
          const userSocketId = await redis.get(`RU:${ride.userId}`)
          const io = getIO();
          if (driverSocketId) {
            io.to(driverSocketId).emit("payment-received");
          }
          if(userSocketId){
            console.log('send ride payment success to user ');
            
            io.to(userSocketId).emit("payment-success")
          }
        }
      }
    } catch (error) {
      console.log("Webhook construction error:", error);
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw new Error("Internal server error");
    }
  }

  async payUsingWallet(userId: string, rideId: string) {
    try {
      const ride = await rideRepo.findRideById(rideId);
      console.log("Ride ", ride);

      if (!ride) throw new Error("Ride not found");

      const userWallet = await walletRepo.getUserWalletBalanceById(userId);
      console.log("userWallet ", userWallet);

      if (
        !userWallet ||
        userWallet.balance === undefined ||
        userWallet.balance == 0
      ) {
        throw new Error("Wallet is empty");
      }

      const userWalletBalance = userWallet.balance;
      const totalFare = ride.totalFare;
      const driverId = ride.driverId;

      if (userWalletBalance < totalFare) {
        throw new Error(
          "Insufficient wallet balance. Please add funds or choose another payment method."
        );
      }

      const commission = Math.ceil(totalFare * 0.2);
      const driverEarnings = Math.ceil(totalFare - commission);
      const applicationFeesDetails = {
        rideId: ride.id,
        driverId,
        totalFare,
        commission,
        driverEarnings,
        paymentMethod: "wallet",
      };
      await walletRepo.addToCommission(applicationFeesDetails);
      await walletRepo.deductMoneyFromUser(userId, totalFare);
      await walletRepo.addMoneyToDriver(
        driverId as string,
        ride.id,
        driverEarnings
      );
      await rideRepo.markCompletedWithData(ride.id, commission, driverEarnings);
      await driverRepo.goBackToOnline(driverId as string);
      const driverSocketId = await redis.get(`OD:${driverId}`);
      const userSocketId = await redis.get(`RU:${ride.userId}`)

      const io = getIO();
      if (driverSocketId) {
        io.to(driverSocketId).emit("payment-received");
      }
      if(userSocketId){
        io.to(userSocketId).emit("payment-success")
      }
    } catch (error) {
      console.log("Pay using wallet error:", error);
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw new Error("Internal server error");
    }
  }

  async payUsingStripe(userId: string, rideId: string) {
    if (!userId || !rideId) {
      throw new Error("Credentials missing");
    }
    const ride = await rideRepo.findRideById(rideId);
    if (!ride) {
      throw new Error("Ride not found");
    }

    const totalFare = ride.totalFare;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name: "Ride payment",
            },
            unit_amount: totalFare * 100, // Stripe expects amount in paisa
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${YOUR_DOMAIN}/user/ride`,
      cancel_url: `${YOUR_DOMAIN}/user/ride`,
      metadata: {
        userId: userId,
        rideId: ride.id,
        action: "ride_payment",
      },
    });
    return session.url;
  }

  async checkPaymentStatus(rideId: string) {
    if (!rideId) {
      throw new Error("Ride id not found");
    }
    const ride = await rideRepo.findRideById(rideId);
    return ride?.paymentStatus;
  }
}

export default new UserService();
