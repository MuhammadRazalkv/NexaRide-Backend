import { IUserRepo } from "../repositories/interfaces/user.repo.interface";
import { IDriverRepo } from "../repositories/interfaces/driver.repo.interface";
import { IWalletRepo } from "../repositories/interfaces/wallet.repo.interface";
import { IPaymentService } from "./interfaces/payment.service.interface";
import Stripe from "stripe";
import { getIO } from "../utils/socket";
import {
  getFromRedis,
  removeFromRedis,
  updateDriverFelids,
} from "../config/redis";
import { IRideRepo } from "../repositories/interfaces/ride.repo.interface";
import { AppError } from "../utils/appError";
import { HttpStatus } from "../constants/httpStatusCodes";
import { messages } from "../constants/httpMessages";
import { getPlusAmount } from "../utils/env";
import { ISubscriptionRepo } from "../repositories/interfaces/subscription.repo.interface";
import {
  getThisMonthRange,
  getThisWeekRange,
  getTodayRange,
} from "../utils/dateUtilities";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

const YOUR_DOMAIN = process.env.FRONT_END_URL;
export class PaymentService implements IPaymentService {
  constructor(
    private driverRepo: IDriverRepo,
    private userRepo: IUserRepo,
    private walletRepo: IWalletRepo,
    private rideRepo: IRideRepo,
    private subscriptionRepo: ISubscriptionRepo
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

  // ! This is the payment related section
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
        const driverEarnings = ride.driverEarnings;
        const commission = totalFare - driverEarnings;
        const applicationFeesDetails = {
          rideId: ride.id,
          driverId,
          totalFare,
          commission,
          driverEarnings,
          paymentMethod: "stripe",
        };
        await this.rideRepo.updateById(ride.id, {
          $set: { paymentMethod: "stripe" },
        });

        await this.walletRepo.addToCommission(applicationFeesDetails);
        await this.walletRepo.addMoneyToDriver(
          driverId as string,
          ride.id,
          driverEarnings
        );
        await this.rideRepo.markCompletedWithData(ride.id);
        await updateDriverFelids(`driver:${driverId}`, "status", "online");
        const driverSocketId = await getFromRedis(`OD:${driverId}`);
        const userSocketId = await getFromRedis(`RU:${ride.userId}`);

        const io = getIO();
        if (driverSocketId) {
          io.to(driverSocketId).emit("payment-received");
        }
        if (userSocketId) {
          io.to(userSocketId).emit("payment-success");
        }
        await removeFromRedis(`URID:${ride.userId}`);
        await removeFromRedis(`DRID:${driverId}`);
      } else if (
        session.metadata &&
        session.metadata.action == "upgrade_to_plus"
      ) {
        const userId = session.metadata.userId;
        const user = await this.userRepo.findUserById(userId);
        if (!user) {
          throw new AppError(HttpStatus.NOT_FOUND, messages.USER_NOT_FOUND);
        }
        const type: "yearly" | "monthly" = session.metadata.type as
          | "yearly"
          | "monthly";

        const now = new Date();
        const expiresAt =
          type === "monthly"
            ? now.setMonth(now.getMonth() + 1)
            : now.setFullYear(now.getFullYear() + 1);

        const details = {
          userId: user.id,
          type,
          amount: parseInt(session.metadata.amount),
          expiresAt,
          takenAt: Date.now(),
        };
        await this.subscriptionRepo.create(details);
        await this.userRepo.updateById(user.id, {
          $set: {
            isSubscribed: true,
            subscriptionExpire: expiresAt,
            subscriptionType: type,
          },
        });
      }
    }
  }

  //! This is where the user pay with wallet
  async payUsingWallet(userId: string, rideId: string) {
    const ride = await this.rideRepo.findRideById(rideId);

    if (!ride) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.RIDE_NOT_FOUND);
    }

    const userWallet = await this.walletRepo.getUserWalletBalanceById(userId);

    if (
      !userWallet ||
      userWallet.balance === undefined ||
      userWallet.balance == 0
    ) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.INSUFFICIENT_BALANCE);
    }

    if (userWallet.balance < ride.totalFare) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.INSUFFICIENT_BALANCE);
    }

    const applicationFeesDetails = {
      rideId: ride.id,
      driverId: ride.driverId,
      totalFare: ride.totalFare,
      commission: ride.commission,
      driverEarnings: ride.driverEarnings,
      paymentMethod: "wallet",
    };

    await this.walletRepo.addToCommission(applicationFeesDetails);
    await this.walletRepo.deductMoneyFromUser(userId, ride.totalFare);
    await this.walletRepo.addMoneyToDriver(
      ride.driverId as string,
      ride.id,
      ride.driverEarnings
    );
    // await this.rideRepo.markCompletedWithData(ride.id);
    await this.rideRepo.updateById(ride.id, {
      $set: {
        paymentMethod: "wallet",
        paymentStatus: "completed",
        status: "completed",
        endedAt: Date.now(),
      },
    });
    const driverSocketId = await getFromRedis(`OD:${ride.driverId}`);
    const userSocketId = await getFromRedis(`RU:${ride.userId}`);
    await updateDriverFelids(`driver:${ride.driverId}`, "status", "online");
    const io = getIO();
    if (driverSocketId) {
      io.to(driverSocketId).emit("payment-received");
    }
    if (userSocketId) {
      io.to(userSocketId).emit("payment-success");
    }
    await removeFromRedis(`URID:${ride.userId}`);
    await removeFromRedis(`DRID:${ride.driverId}`);
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

  async upgradeToPlus(id: string, type: string): Promise<string | null> {
    if (!id) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
    }
    if (type == "yearly" || type == "monthly") {
      const price = getPlusAmount(type);
      if (!price)
        throw new AppError(
          HttpStatus.INTERNAL_SERVER_ERROR,
          messages.MISSING_FIELDS
        );
      const amount = parseInt(price);

      const user = await this.userRepo.findUserById(id);
      if (!user) {
        throw new AppError(HttpStatus.NOT_FOUND, messages.USER_NOT_FOUND);
      }
      const existingPremium = await this.subscriptionRepo.findOne({
        userId: id,
        expiresAt: { $gt: Date.now() },
      });
      if (existingPremium) {
        throw new AppError(HttpStatus.CONFLICT, messages.PLAN_ALREADY_EXISTS);
      }
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "inr",
              product_data: {
                name: "Upgrade to plus",
              },
              unit_amount: amount * 100,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${YOUR_DOMAIN}/user/subscription`,
        cancel_url: `${YOUR_DOMAIN}/user/subscription`,
        metadata: {
          userId: id,
          action: `upgrade_to_plus`,
          type: type,
          amount,
        },
      });

      return session.url;
    }
    throw new AppError(HttpStatus.BAD_REQUEST, messages.INVALID_PARAMETERS);
  }

  async transactionSummary(
    id: string,
    requestedBy: "user" | "driver"
  ): Promise<{
    totalTransaction: number;
    usingWallet: number;
    usingStripe: number;
  }> {
    if (!id) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
    }
    const data = await this.rideRepo.paymentInfos(id, requestedBy);

    return data;
  }

  async earningsSummary(id: string): Promise<{
    totalEarnings: number;
    Today: number;
    Week: number;
    Month: number;
  }> {
    if (!id) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
    }
    const data = await this.walletRepo.getEarningsSummary(
      id,
      getTodayRange().start,
      getThisWeekRange().start,
      getThisMonthRange().start
    );
    return data;
  }
}
