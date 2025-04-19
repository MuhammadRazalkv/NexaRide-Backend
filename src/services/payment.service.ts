import { IUserRepo } from "../repositories/interfaces/user.repo.interface";
import { IDriverRepo } from "../repositories/interfaces/driver.repo.interface";
import { IWalletRepo } from "../repositories/interfaces/wallet.repo.interface";
import { IPaymentService } from "./interfaces/payment.service.interface";
import Stripe from "stripe";
import { getIO } from "../utils/socket";
import {getFromRedis,setToRedis} from "../config/redis";
import { IRideRepo } from "../repositories/interfaces/ride.repo.interface";
import { AppError } from "../utils/appError";
import { HttpStatus } from "../constants/httpStatusCodes";
import { messages } from "../constants/httpMessages";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

const YOUR_DOMAIN = process.env.FRONT_END_URL;
export class PaymentService implements IPaymentService {
  constructor(
    private driverRepo: IDriverRepo,
    private userRepo: IUserRepo,
    private walletRepo: IWalletRepo,
    private rideRepo: IRideRepo
  ) {}

  async addMoneyToWallet(id: string, amount: number) {
    if (!id || !amount) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
    }
    if (amount < 50) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        messages.WALLET_MINIMUM_AMOUNT
      );
    } else if (amount > 3000) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.WALLET_MAX_AMOUNT);
    }

    const user = await this.userRepo.findUserById(id);
    if (!user) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.USER_NOT_FOUND);
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
            unit_amount: amount * 100,
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
    const user = await this.userRepo.findUserById(id);
    if (!user) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.USER_NOT_FOUND);
    }
    const wallet = await this.walletRepo.getWalletInfo(id);
    return wallet;
  }

  // ! This is the payment related section in this there is the direct payment is not cleared
  async webHook(body: any, sig: string) {
    let event = stripe.webhooks.constructEvent(
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
        await this.walletRepo.addMoneyToUserWallet(userId, amount);
      } else if (
        session.metadata &&
        session.metadata.action == "ride_payment"
      ) {
        const rideId = session.metadata.rideId;
        const ride = await this.rideRepo.findRideById(rideId);
        if (!ride) {
          throw new AppError(HttpStatus.NOT_FOUND, messages.RIDE_NOT_FOUND);
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
        await this.walletRepo.addToCommission(applicationFeesDetails);
        await this.walletRepo.addMoneyToDriver(
          driverId as string,
          ride.id,
          driverEarnings
        );
        await this.rideRepo.markCompletedWithData(
          ride.id,
          commission,
          driverEarnings
        );
        await this.driverRepo.goBackToOnline(driverId as string);
        // const driverSocketId = await redis.get(`OD:${driverId}`);
        // const userSocketId = await redis.get(`RU:${ride.userId}`);
        
        const driverSocketId = await getFromRedis(`OD:${driverId}`);
        const userSocketId = await getFromRedis(`RU:${ride.userId}`);
        const io = getIO();
        if (driverSocketId) {
          io.to(driverSocketId).emit("payment-received");
        }
        if (userSocketId) {
          console.log("send ride payment success to user ");

          io.to(userSocketId).emit("payment-success");
        }
      }
    }
  }

  //! This is where the user pay with wallet You should update the driver payment update section
  async payUsingWallet(userId: string, rideId: string) {
    const ride = await this.rideRepo.findRideById(rideId);
    console.log("Ride ", ride);

    if (!ride)
      throw new AppError(HttpStatus.NOT_FOUND, messages.RIDE_NOT_FOUND);

    const userWallet = await this.walletRepo.getUserWalletBalanceById(userId);

    if (
      !userWallet ||
      userWallet.balance === undefined ||
      userWallet.balance == 0
    ) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.INSUFFICIENT_BALANCE);
    }

    const userWalletBalance = userWallet.balance;
    const totalFare = ride.totalFare;
    const driverId = ride.driverId;

    if (userWalletBalance < totalFare) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.INSUFFICIENT_BALANCE);
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
    await this.walletRepo.addToCommission(applicationFeesDetails);
    await this.walletRepo.deductMoneyFromUser(userId, totalFare);
    await this.walletRepo.addMoneyToDriver(
      driverId as string,
      ride.id,
      driverEarnings
    );
    await this.rideRepo.markCompletedWithData(
      ride.id,
      commission,
      driverEarnings
    );
    await this.driverRepo.goBackToOnline(driverId as string);
    // const driverSocketId = await redis.get(`OD:${driverId}`);
    // const userSocketId = await redis.get(`RU:${ride.userId}`);
    const driverSocketId = await getFromRedis(`OD:${driverId}`);
    const userSocketId = await getFromRedis(`RU:${ride.userId}`);

    const io = getIO();
    if (driverSocketId) {
      io.to(driverSocketId).emit("payment-received");
    }
    if (userSocketId) {
      io.to(userSocketId).emit("payment-success");
    }
  }

  async payUsingStripe(userId: string, rideId: string) {
    if (!userId || !rideId) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
    }
    const ride = await this.rideRepo.findRideById(rideId);
    if (!ride) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.RIDE_NOT_FOUND);
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

  async getDriverWalletInfo(driverId: string) {
    const driver = await this.driverRepo.findDriverById(driverId);
    if (!driver) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.DRIVER_NOT_FOUND);
    }
    const wallet = await this.walletRepo.getDriverWalletInfo(driverId);
    return wallet;
  }
}
