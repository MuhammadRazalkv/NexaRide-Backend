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
import { IRideHistory } from "../models/ride.history.model";
import { ICommissionRepo } from "../repositories/interfaces/commission.repo.interface";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

const YOUR_DOMAIN = process.env.FRONT_END_URL;
export class PaymentService implements IPaymentService {
  constructor(
    private driverRepo: IDriverRepo,
    private userRepo: IUserRepo,
    private walletRepo: IWalletRepo,
    private rideRepo: IRideRepo,
    private subscriptionRepo: ISubscriptionRepo,
    private commissionRepo: ICommissionRepo
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

    const user = await this.userRepo.findById(id);
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
  async getWalletInfo(id: string, page: number) {
    const limit = 8;
    const skip = (page - 1) * limit;

    const user = await this.userRepo.findById(id);
    if (!user) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.USER_NOT_FOUND);
    }

    const wallet = await this.walletRepo.findOne({ userId: id });
    if (!wallet) {
      throw new AppError(HttpStatus.NOT_FOUND, "Wallet not found");
    }

    const allTransactions = wallet.transactions ?? [];
    const total = allTransactions.length;

    const paginatedTransactions = [...allTransactions]
      .reverse()
      .slice(skip, skip + limit)
      .reverse();

    const updatedWallet = {
      ...(wallet.toObject?.() ?? wallet),
      transactions: paginatedTransactions,
    };

    return { wallet: updatedWallet, total };
  }

  // ! This is the payment related section
  async webHook(body: any, sig: string) {
    console.log("webhook service layer ");
    console.log("Secret key ", process.env.WEBHOOK_SECRET_KEY);
    console.log("typeof body:", typeof body); // must be 'object' (Buffer)
    console.log("Is buffer:", Buffer.isBuffer(body)); // must be true

    // let event = stripe.webhooks.constructEvent(
    //   body,
    //   sig,
    //   process.env.WEBHOOK_SECRET_KEY as string
    // );
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        sig,
        process.env.WEBHOOK_SECRET_KEY as string
      );
    } catch (err: any) {
      console.error("Stripe signature verification failed:", err.message);
    }

    console.log("event type ", event?.type);

    if (event && event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log("checkout.session.completed test passed ");

      if (session.metadata && session.metadata.action === "wallet_topUp") {
        console.log("Wallet topUp");

        const userId = session.metadata.userId;
        const amount = session.amount_total! / 100;

        //  update the wallet
        await this.walletRepo.updateOne(
          { userId },
          {
            $inc: { balance: amount },
            $push: {
              transactions: {
                type: "credit",
                date: Date.now(),
                amount: amount,
              },
            },
          },
          { new: true, upsert: true }
        );
      } else if (
        session.metadata &&
        session.metadata.action == "ride_payment"
      ) {
        console.log("ride payment ");

        const rideId = session.metadata.rideId;
        const ride = await this.rideRepo.findById(rideId);
        if (!ride) {
          throw new AppError(HttpStatus.NOT_FOUND, messages.RIDE_NOT_FOUND);
        }
        await this._handlePostPayment(ride, "stripe");
      } else if (
        session.metadata &&
        session.metadata.action == "upgrade_to_plus"
      ) {
        console.log("Upgrade to plus");

        const userId = session.metadata.userId;
        const user = await this.userRepo.findById(userId);
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
    const ride = await this.rideRepo.findById(rideId);

    if (!ride) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.RIDE_NOT_FOUND);
    }

    const userWallet = await this.walletRepo.findOne({ userId });

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

    await this.walletRepo.updateOne(
      { userId },
      {
        $inc: { balance: -ride.totalFare },
        $push: {
          transactions: {
            type: "debit",
            date: Date.now(),
            amount: ride.totalFare,
          },
        },
      }
    );
    console.log('Calling post payment from wallet payment');
    
    await this._handlePostPayment(ride, "wallet");
  }

  async payUsingStripe(userId: string, rideId: string) {
    if (!userId || !rideId) {
      throw new AppError(HttpStatus.BAD_REQUEST, messages.MISSING_FIELDS);
    }
    const ride = await this.rideRepo.findById(rideId);
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

  async getDriverWalletInfo(driverId: string, page: number) {
    const limit = 8;
    const skip = (page - 1) * limit;

    const driver = await this.driverRepo.findById(driverId);
    if (!driver) {
      throw new AppError(HttpStatus.NOT_FOUND, messages.DRIVER_NOT_FOUND);
    }

    const wallet = await this.walletRepo.getDriverWalletInfo(driverId);
    if (!wallet) {
      throw new AppError(HttpStatus.NOT_FOUND, "Wallet not found");
    }

    const allTransactions = wallet.transactions ?? [];
    const total = allTransactions.length;

    const paginatedTransactions = [...allTransactions]
      .reverse()
      .slice(skip, skip + limit)
      .reverse();

    const updatedWallet = {
      ...(wallet.toObject?.() ?? wallet),
      transactions: paginatedTransactions,
    };

    return { wallet: updatedWallet, total };
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

      const user = await this.userRepo.findById(id);
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

  private async _handlePostPayment(
    ride: IRideHistory,
    paymentMethod: "wallet" | "stripe"
  ): Promise<void> {
    console.log('Inside post payment section ');
    
    const applicationFeesDetails = {
      rideId: ride.id,
      driverId: ride.driverId,
      originalFare: ride.baseFare,
      totalFare: ride.totalFare,
      offerDiscount: ride.offerDiscountAmount,
      premiumDiscount: ride.premiumDiscount,
      originalCommission: ride.commission,
      commission: Math.round(
        ride.commission - (ride.offerDiscountAmount + ride.premiumDiscount)
      ),
      driverEarnings: ride.driverEarnings,
      paymentMethod,
    };
    await this.commissionRepo.create(applicationFeesDetails);
    console.log('Created commission repo ',applicationFeesDetails);
    
    await this.walletRepo.addMoneyToDriver(
      ride.driverId as string,
      ride.id,
      ride.driverEarnings
    );
    await this.rideRepo.updateById(ride.id, {
      $set: {
        paymentMethod,
        paymentStatus: "completed",
        status: "completed",
        endedAt: Date.now(),
      },
    });
    console.log('Wallet and ride info updated in post payment ');
    
    const driverSocketId = await getFromRedis(`OD:${ride.driverId}`);
    console.log('Driver socket id ',driverSocketId)
    const userSocketId = await getFromRedis(`RU:${ride.userId}`);
    console.log('User socket id ',userSocketId);
    
    await updateDriverFelids(`driver:${ride.driverId}`, "status", "online");
    console.log('Driver filed updated to status online ');
    
    const user = await this.userRepo.findById(ride.userId as string);
    const driver = await this.driverRepo.findById(ride.driverId as string);
    const io = getIO();
    if (driverSocketId) {
      console.log('Driver socket id found sending to the recieved event ');
      
      io.to(driverSocketId).emit("payment-received");
      if (driver?.softBlock) {
        await this.driverRepo.updateById(ride.driverId as string, {
          $set: { isBlocked: true, softBlock: false },
        });
      }
    }
    if (userSocketId) {
      console.log('User payment success')
      io.to(userSocketId).emit("payment-success");
      if (user?.softBlock) {
        await this.userRepo.updateById(ride.userId as string, {
          $set: { isBlocked: true, softBlock: false },
        });
      }
    }
    await removeFromRedis(`URID:${ride.userId}`);
    await removeFromRedis(`DRID:${ride.driverId}`);
    console.log('Finished post payment');
    
  }
}
