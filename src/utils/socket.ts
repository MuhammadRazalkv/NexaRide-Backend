import { Server, Socket } from "socket.io";
import {
  getFromRedis,
  removeFromRedis,
  saveDriverStatusToRedis,
  addDriverToGeoIndex,
  setToRedis,
  getAvailableDriversByGeo,
  updateDriverFelids,
} from "../config/redis";
import { extractUserIdFromToken } from "./jwt";
import crypto from "crypto";
import { AppError } from "./appError";
import { HttpStatus } from "../constants/httpStatusCodes";
import { messages } from "../constants/httpMessages";
import { userService } from "../bindings/user.bindings";
import { rideService } from "../bindings/ride.bindings";
import { offerService } from "../bindings/offer.bindings";
import { IOffer } from "../models/offer.modal";
import { validateRideRequest } from "./validators/rideRequestValidators";
import { getRouteDetails } from "./geoApi";
import { calculateFareWithDiscount } from "./offerCalculation";
import { findDriverForRide } from "./rideBooking";
import { driverService } from "../bindings/driver.bindings";
let io: Server;

export const initializeSocket = (server: any) => {
  io = new Server(server, {
    cors: { origin: process.env.FRONT_END_URL, credentials: true },
  });

  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token;
    const role = socket.handshake.auth?.role;

    if (!token || !role) {
      console.log("Token or role missing");
      return next(new Error("Authentication error"));
    }

    try {
      const decodedId = extractUserIdFromToken(token);
      // console.log(role, "id ", decodedId);

      (socket as any).user = { decodedId, role };
      next();
    } catch (error) {
      // console.log("Invalid token");
      next(new AppError(HttpStatus.UNAUTHORIZED, messages.INVALID_ID));
    }
  });

  // Handling connections
  io.on("connection", async (socket) => {
    const { decodedId, role } = (socket as any).user;
    if (role === "driver") {
      socket.data.driverId = decodedId;
      await setToRedis(`OD:${decodedId}`, socket.id);
      const rideId = await getFromRedis(`DRID:${decodedId}`);
      if (rideId) {
        socket.join(`ride:${rideId}`);
      } else {
        const driver = await rideService.getDriverWithVehicle(decodedId);
        if (driver) {
          await saveDriverStatusToRedis(`driver:${decodedId}`, {
            socketId: socket.id,
            category: driver.vehicleDetails.category,
            status: "online",
            latitude: driver.location?.coordinates[1] || 0,
            longitude: driver.location?.coordinates[0] || 0,
            updatedAt: Date.now(),
          });

          await addDriverToGeoIndex(
            `drivers:${driver.vehicleDetails.category}`,
            driver.location?.coordinates[0] || 0,
            driver.location?.coordinates[1] || 0,
            decodedId
          );
        }
      }
    }

    if (role === "user") {
      setToRedis(`RU:${decodedId}`, socket.id);
      const rideId = await getFromRedis(`URID:${decodedId}`);
      if (rideId) socket.join(`ride:${rideId}`);
      // console.log(`User ${decodedId} connected with socket ID: ${socket.id}`);
    }

    // Send ride request to a specific group
    socket.on("request-ride", async (data) => {
      let { category, pickupCoords, dropOffCoords } = data;
      if (!validateRideRequest(data, decodedId)) {
        socket.emit("ride-error", { message: "Invalid ride request data" });
        return;
      }

      try {
        const routeInfo = await getRouteDetails(pickupCoords, dropOffCoords);
        const pricePerKm = await driverService.getPriceByCategory(
          (category as string).trim()
        );
        if (routeInfo && pricePerKm) {
          const km = routeInfo.distance / 1000;
          let requestedFare = Math.round(km * pricePerKm);

          const user = await userService.getUserInfo(decodedId);

          if (!user) {
            socket.emit("ride-error", { message: "User not found" });
            return;
          }
          const nearestDrivers = await getAvailableDriversByGeo(
            `drivers:${category}`,
            pickupCoords[1],
            pickupCoords[0]
          );

          if (!nearestDrivers || nearestDrivers.length === 0) {
            socket.emit("ride-error", {
              message: "No drivers available in your area",
            });
            return;
          }

          const {
            finalFare,
            bestDiscount,
            bestOffer,
            driverShare,
            originalFare,
            isPremiumUser,
            premiumDiscount
          } = await calculateFareWithDiscount(requestedFare, decodedId);

          const rideResult = await findDriverForRide(
            nearestDrivers,
            user,
            pickupCoords,
            dropOffCoords,
            driverShare,
            finalFare,
            bestOffer,
            bestDiscount,
            originalFare,
            routeInfo.distance, //! this is in meter need to change to km
            isPremiumUser,
            premiumDiscount,
            io
          );
          // let rideAccepted = false;
          // for (let i = 0; i < nearestDrivers.length; i++) {
          //   const driverSocketId = nearestDrivers[i].socketId;
          //   const driverSocket = io.sockets.sockets.get(driverSocketId);
          //   if (!driverSocket) {
          //     continue;
          //   }

          //   driverSocket.emit("new-ride-req", {
          //     user: {
          //       id: user.id,
          //       name: user.name,
          //     },
          //     pickupCoords,
          //     dropOffCoords,
          //     fare: driverShare,
          //   });
          //   console.log(`Ride request sent to Driver ${nearestDrivers[i].id}`);

          //   rideAccepted = await new Promise<boolean>(async (resolve) => {
          //     const timeOut = setTimeout(() => resolve(false), 16000);
          //     await listenForDriverResponse(resolve, timeOut, driverSocket);
          //   });
          //   if (rideAccepted) {
          //     break;
          //   }
          // }

          // async function listenForDriverResponse(
          //   resolve: (val: boolean) => void,
          //   timeout: NodeJS.Timeout,
          //   driverSocket: Socket
          // ) {
          //   const onAccept = async (data: {
          //     token: string;
          //     userId: string;
          //     pickupLocation: string;
          //     dropOffLocation: string;
          //     distance: number;
          //     time: number;
          //     // fare: number;
          //     pickupCoords: [number, number];
          //     dropOffCoords: [number, number];
          //   }) => {
          //     clearTimeout(timeout);
          //     try {
          //       const driverId = driverSocket.data.driverId;
          //       const userSocketId = await getFromRedis(`RU:${data.userId}`);

          //       const driver = await rideService.getDriverWithVehicle(
          //         driverId as string
          //       );

          //       if (!driver) {
          //         socket.emit("ride-error", { message: "Driver not found" });
          //         return;
          //       }
          //       const OTP = crypto.randomInt(1000, 10000).toString();
          //       const details = {
          //         userId: data.userId as string,
          //         driverId: driver._id as string,
          //         status: "ongoing",
          //         distance: data.distance,
          //         totalFare: finalFare,
          //         baseFare: fare,
          //         discountAmount: bestDiscount || 0,
          //         estTime: data.time,
          //         pickupLocation: data.pickupLocation as string,
          //         dropOffLocation: data.dropOffLocation as string,
          //         pickupCoords: data.pickupCoords,
          //         dropOffCoord: data.dropOffCoords,
          //         OTP,
          //         ...(bestOffer && {
          //           appliedOffer: {
          //             offerId: bestOffer.id,
          //             discountAmount: bestDiscount,
          //             offerType: bestOffer.type,
          //             originalCommission: appCommission,
          //           },
          //         }),
          //       };
          //       const ride = await rideService.createNewRide(details);
          //       const rideId = ride.id;
          //       // Setting ride for both driver and user
          //       await setToRedis(`DRID:${driverId}`, rideId);

          //       await setToRedis(`URID:${data.userId}`, rideId);

          //       await updateDriverFelids(`driver:${driverId}`, "status", "onRide");
          //       driverSocket?.join(`ride:${rideId}`);
          //       if (userSocketId) {
          //         console.log("Sending ride accepted to user ", userSocketId);
          //         const userSocket = io.sockets.sockets.get(userSocketId);
          //         userSocket?.join(`ride:${rideId}`);
          //         io.to(userSocketId).emit("ride-accepted", {
          //           rideId,
          //           driver,
          //           distance: data.distance,
          //           totalFare: finalFare,
          //           estTime: data.time,
          //           pickupLocation: data.pickupLocation as string,
          //           dropOffLocation: data.dropOffLocation as string,
          //           pickupCoords: data.pickupCoords,
          //           dropOffCoords: data.dropOffCoords,
          //           startedTime: new Date().toISOString(),
          //           OTP,
          //         });
          //       } else {
          //         console.log(`User not found in no res  `);
          //         socket.emit("ride-error", { message: "User not found" });
          //       }
          //       resolve(true);
          //       cleanup();
          //     } catch (error) {
          //       console.log("in the error block", error);

          //       return;
          //     }
          //   };

          //   const onReject = () => {
          //     console.log("Inside on reject ");

          //     clearTimeout(timeout);
          //     cleanup();
          //     resolve(false);
          //   };

          //   const cleanup = () => {
          //     console.log("Inside clean up ");

          //     driverSocket.off("driver-ride-accepted", onAccept);
          //     driverSocket.off("reject-ride", onReject);
          //   };

          //   driverSocket.once("driver-ride-accepted", onAccept);
          //   driverSocket.once("reject-ride", onReject);
          // }

          // if (!rideAccepted) {
          //   const userSocketId = await getFromRedis(`RU:${decodedId}`);
          //   if (userSocketId) {
          //     io.to(userSocketId).emit("no-driver-response");
          //   } else {
          //     console.log(`User not found in no res  `);
          //     socket.emit("ride-error", { message: "User not found" });
          //   }
          // }
          if (!rideResult.accepted) {
            const userSocketId = await getFromRedis(`RU:${decodedId}`);
            if (userSocketId) {
              io.to(userSocketId).emit("no-driver-response");
            } else {
              socket.emit("ride-error", { message: "User not found" });
            }
          }
        }
      } catch (error) {
        if (error instanceof Error)
          socket.emit("ride-error", {
            message: error.message,
          });
        console.log(error);
        return;
      }
    });

    socket.on("driver-location-update", async (data) => {
      await setToRedis(
        `DL:${decodedId}`,
        JSON.stringify({
          lat: data.location[1],
          lng: data.location[0],
          updatedAt: new Date().toISOString(),
        })
      );
      // console.log("Driver location update ", data);

      console.log("Checking Redis for key: DRID:" + decodedId);
      const rideId = await getFromRedis(`DRID:${decodedId}`);
      console.log("Retrieved rideId:", rideId);

      if (rideId) {
        console.log("Sending location update through room ");

        socket.to(`ride:${rideId}`).emit("driver-location-update", {
          type: data.type,
          location: data.location,
        });
      } else {
        console.log("sending location update via socket id ");

        const userId = await rideService.getUserIdByDriverId(decodedId);

        if (!userId) {
          console.error("User not found location update");
          socket.emit("ride-error", { message: "User not found" });
          return;
        }
        const userSocketId = await getFromRedis(`RU:${userId}`);
        console.log("userSocketId in locationUpdate ", userSocketId);

        console.log("Data ", data);

        if (userSocketId) {
          io.to(userSocketId).emit("driver-location-update", {
            type: data.type,
            location: data.location,
          });
        }
      }
    });

    socket.on("driver-reached", async () => {
      const rideId = await getFromRedis(`DRID:${decodedId}`);
      if (rideId) {
        socket.to(`ride:${rideId}`).emit("driver-reached");
      } else {
        // To get the user id from ongoing ride
        const userId = await rideService.getUserIdByDriverId(decodedId);
        if (!userId) {
          console.error("User not found");
          socket.emit("ride-error", { message: "User not found" });
          return;
        }
        const userSocketId = await getFromRedis(`RU:${userId}`);
        if (userSocketId) {
          io.to(userSocketId).emit("driver-reached");
        }
      }
    });

    socket.on("cancel-ride", async (cancelledBy) => {
      console.log("Inside cancel ride by ", cancelledBy);

      if (cancelledBy == "user") {
        try {
          const rideId = await getFromRedis(`URID:${decodedId}`);
          // const driverId = await rideService.getDriverByUserId(decodedId);
          if (!rideId) {
            return;
          }
          const ride = await rideService.findRideById(rideId);
          // console.log("Driver id ", driverId);

          if (!ride?.driverId) {
            console.error("Driver not found");
            socket.emit("ride-error", { message: "Driver not found" });
            return;
          }
          // await driverService.goBackToOnline(driverId as string);
          await rideService.cancelRide(
            ride.driverId as string,
            decodedId,
            cancelledBy
          );
          await updateDriverFelids(
            `driver:${ride?.driverId as string}`,
            "status",
            "online"
          );
          if (rideId) {
            socket.to(`ride:${rideId}`).emit("ride-cancelled");
          } else {
            const driverSocketId = await getFromRedis(
              `OD:${ride.driverId as string}`
            );
            if (driverSocketId) {
              io.to(driverSocketId).emit("ride-cancelled");
            }
          }
        } catch (error: any) {
          console.log(error);
          socket.emit("ride-error", { message: error.message });
        }
      } else if (cancelledBy == "driver") {
        try {
          console.log("Ride cancel by driver ");

          const rideId = await getFromRedis(`DRID:${decodedId}`);
          if (!rideId) {
            return;
          }
          // const userId = await rideService.getUserIdByDriverId(decodedId);
          const ride = await rideService.findRideById(rideId);
          if (!ride?.userId) {
            console.error("User not found");
            socket.emit("ride-error", { message: "User not found" });
            return;
          }
          await rideService.cancelRide(
            decodedId,
            ride.userId as string,
            cancelledBy
          );
          // await driverService.goBackToOnline(decodedId);
          await updateDriverFelids(`driver:${decodedId}`, "status", "online");
          if (rideId) {
            console.log("Ride cancellation sent to user by room ");

            socket.to(`ride:${rideId}`).emit("ride-cancelled");
          } else {
            const userSocketId = await getFromRedis(`RU:${ride.userId}`);
            if (userSocketId) {
              console.log("Ride cancellation sent to user by socketId ");
              io.to(userSocketId).emit("ride-cancelled");
            }
          }
        } catch (error: any) {
          console.log(error);
          socket.emit("ride-error", { message: error.message });
        }
      }
    });

    socket.on("dropOff-reached", async () => {
      try {
        const rideId = await getFromRedis(`DRID:${decodedId}`);

        if (rideId) {
          const ride = await rideService.findRideById(rideId);
          if (ride) {
            socket.to(`ride:${rideId}`).emit("dropOff-reached", {
              rideId,
              fare: ride.totalFare,
            });
          }
        } else {
          const userId = await rideService.getUserIdByDriverId(decodedId);

          if (!userId) {
            socket.emit("ride-error", { message: "User not found" });
            return;
          }

          const userSocketId = await getFromRedis(`RU:${userId}`);
          const { rideId, fare } = await rideService.getRideIdByUserAndDriver(
            decodedId,
            userId as string
          );
          if (userSocketId) {
            io.to(userSocketId).emit("dropOff-reached", {
              rideId,
              fare,
            });
          } else {
            console.warn("User socket not found in dropOff-reached");
          }
        }
      } catch (error: any) {
        console.error("Error in dropOff-reached:", error.message);
        socket.emit("ride-error", { message: error.message });
      }
    });

    socket.on("chat-msg", async (data) => {
      let rideId;
      if (data.sendBy == "user") {
        rideId = await getFromRedis(`URID:${decodedId}`);
      } else {
        rideId = await getFromRedis(`DRID:${decodedId}`);
      }
      if (rideId) {
        socket.to(`ride:${rideId}`).emit("chat-msg", {
          id: Date.now().toString(),
          text: data.text,
          senderId: decodedId,
        });
      }
    });

    socket.on("disconnect", async () => {
      console.log(`${role}  disconnected`);
      if (role == "driver") {
        const driver = await rideService.getDriverWithVehicle(decodedId);

        console.log("Removing driver from socket", driver.name);
        await removeFromRedis(`OD:${decodedId}`);
        await removeFromRedis(`driver:${decodedId}`);
        await removeFromRedis(`drivers:${driver.vehicleDetails.category}`);
      }
    });
  });
};
export const getIO = (): Server => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};
