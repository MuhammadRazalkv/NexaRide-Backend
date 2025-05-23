import { Server, Socket } from "socket.io";
import { IUser } from "../models/user.model";
import { IOffer } from "../models/offer.modal";
import crypto from "crypto";
import { getFromRedis, setToRedis, updateDriverFelids } from "../config/redis";
import { rideService } from "../bindings/ride.bindings";
import { offerService } from "../bindings/offer.bindings";

interface INearestDrivers {
  id: string;
  socketId: string;
  distance: number;
}
export async function findDriverForRide(
  drivers: INearestDrivers[],
  user: IUser,
  pickupCoords: [number, number],
  dropOffCoords: [number, number],
  driverShare: number,
  finalFare: number,
  bestOffer: IOffer | null,
  bestDiscount: number,
  originalFare: number,
  distance: number,
  premiumUser: boolean,
  premiumDiscount: number,
  io: Server
) {
  console.log('findDriverForRide ');
  
  const DRIVER_RESPONSE_TIMEOUT = 16000; // 16 sec

  for (const driver of drivers) {
    const driverSocketId = driver.socketId;
    const driverSocket = io.sockets.sockets.get(driverSocketId);

    if (!driverSocket) {
      console.warn(`Driver socket not found for ID: ${driver.id}`);
      continue;
    }

    // Send ride request to driver
    driverSocket.emit("new-ride-req", {
      user: {
        id: user.id,
        name: user.name,
      },
      pickupCoords,
      dropOffCoords,
      fare: driverShare,
    });

    console.info(`Ride request sent to Driver ${driver.id}`);

    // Wait for driver response
    const rideAccepted = await waitForDriverResponse(
      driverSocket,
      user.id,
      pickupCoords,
      dropOffCoords,
      finalFare,
      bestOffer,
      bestDiscount,
      originalFare,
      distance,
      premiumDiscount,
      driverShare,
      io,
      DRIVER_RESPONSE_TIMEOUT
    );

    if (rideAccepted) {
      return { accepted: true, driverId: driver.id };
    }
  }

  return { accepted: false };
}

function waitForDriverResponse(
  driverSocket: Socket,
  userId: string,
  pickupCoords: [number, number],
  dropOffCoords: [number, number],
  finalFare: number,
  bestOffer: IOffer | null,
  bestDiscount: number,
  originalFare: number,
  distance: number,
  premiumDiscount: number,
  driverShare: number,
  io: Server,
  timeout: number
) {
  return new Promise(async (resolve) => {
    let isResolved = false;
    const timeoutId = setTimeout(() => {
      console.log('waitForDriverResponse Timeout');
      
      if (!isResolved) {
        isResolved = true;
        cleanup();
        resolve(false);
      }
    }, timeout);

    const onAccept = async (data: {
      userId: string;
      pickupLocation: string;
      dropOffLocation: string;
      //   distance: number;
      time: number;
      pickupCoords: [number, number];
      dropOffCoords: [number, number];
    }) => {
      if (isResolved) return;
      console.log('waitForDriverResponse onAccept');
      
      isResolved = true;
      clearTimeout(timeoutId);
      console.log("Inside the on Accept");

      try {
        const driverId = driverSocket.data.driverId;
        const userSocketId = await getFromRedis(`RU:${userId}`);

        // Get driver with vehicle details
        const driver = await rideService.getDriverWithVehicle(driverId);
        if (!driver) {
          if (userSocketId) {
            io.to(userSocketId).emit("ride-error", {
              message: "Driver not found",
            });
          }
          cleanup();
          resolve(false);
          return;
        }

        // Generate OTP for ride verification
        const OTP = crypto.randomInt(1000, 10000).toString();

        // Create ride details
        const rideDetails = {
          userId: userId,
          driverId,
          status: "ongoing",
          distance: distance,
          totalFare: finalFare, // after offer applied which user should pay
          baseFare: originalFare, // the original fare before offers
          premiumDiscount, // Discount for those who took a premium plan
          offerDiscountAmount: Math.round(bestDiscount) || 0, // applied offer discount
          commission: finalFare - bestDiscount,
          estTime: data.time,
          driverEarnings: driverShare,
          pickupLocation: data.pickupLocation,
          dropOffLocation: data.dropOffLocation,
          pickupCoords: data.pickupCoords,
          dropOffCoord: data.dropOffCoords,
          OTP,
          ...(bestOffer && {
            appliedOffer: {
              offerId: bestOffer.id,
              discountAmount: bestDiscount,
              offerType: bestOffer.type,
              originalCommission: originalFare * 0.2,
            },
          }),
        };

        // Create ride record in database
        const ride = await rideService.createNewRide(rideDetails);
        const rideId = ride.id;

        if (ride.appliedOffer) {
          await offerService.increaseOfferUsage(
            userId,
            ride?.appliedOffer.offerId
          );
        }

        // Update Redis and driver status
        await Promise.all([
          setToRedis(`DRID:${driverId}`, rideId),
          setToRedis(`URID:${userId}`, rideId),
          updateDriverFelids(`driver:${driverId}`, "status", "onRide"),
        ]);

        // Create ride room for real-time updates
        driverSocket.join(`ride:${rideId}`);

        // Notify user about accepted ride
        if (userSocketId) {
          const userSocket = io.sockets.sockets.get(userSocketId);
          if (userSocket) {
            userSocket.join(`ride:${rideId}`);
            io.to(userSocketId).emit("ride-accepted", {
              rideId,
              driver,
              distance: distance,
              totalFare: finalFare,
              estTime: data.time,
              pickupLocation: data.pickupLocation,
              dropOffLocation: data.dropOffLocation,
              pickupCoords: data.pickupCoords,
              dropOffCoords: data.dropOffCoords,
              startedTime: new Date().toISOString(),
              OTP,
            });
          }
        } else {
          console.warn(`User socket not found for user ID: ${userId}`);
        }

        cleanup();
        resolve(true);
      } catch (error) {
        console.error("Error processing driver acceptance:", error);
        cleanup();
        resolve(false);
      }
    };

    const onReject = () => {
      if (isResolved) return;
      console.log('waitForDriverResponse onReject');
      
      isResolved = true;
      clearTimeout(timeoutId);
      cleanup();
      resolve(false);
    };

    const cleanup = () => {
      driverSocket.off("driver-ride-accepted", onAccept);
      driverSocket.off("reject-ride", onReject);
    };

    driverSocket.once("driver-ride-accepted", onAccept);
    driverSocket.once("reject-ride", onReject);
  });
}
