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

import { DriverService } from "../services/driver.service";

import { UserService } from "../services/user.service";
import { extractUserIdFromToken } from "./jwt";
import crypto, { getRandomValues } from "crypto";
import { RideService } from "../services/ride.service";
import { AppError } from "./appError";
import { HttpStatus } from "../constants/httpStatusCodes";
import { messages } from "../constants/httpMessages";
import { token } from "morgan";

interface IDriver {
  name: string;
  location: { coordinates: [number, number] };
  vehicleDetails: {
    brand: string;
    vehicleModel: string;
    category: 1;
  };
}

let io: Server;

export const initializeSocket = (
  server: any,
  userService: UserService,
  driverService: DriverService,
  rideService: RideService
) => {
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
      const { category, pickupCoords, dropOffCoords, fare } = data;

      const user = await userService.getUserInfo(decodedId);
      if (!user) {
        return;
      }
      const nearestDrives = await getAvailableDriversByGeo(
        `drivers:${category}`,
        pickupCoords[1],
        pickupCoords[0]
      );
      let rideAccepted = false;
      for (let i = 0; i < nearestDrives.length; i++) {
        const driverSocketId = nearestDrives[i].socketId;
        const driverSocket = io.sockets.sockets.get(driverSocketId);
        if (!driverSocket) {
          console.log("Driver socket not found");
          continue;
        }

        driverSocket.emit("new-ride-req", {
          user: {
            id: user.id,
            name: user.name,
          },
          pickupCoords,
          dropOffCoords,
          fare,
        });
        console.log(`Ride request sent to Driver ${nearestDrives[i].id}`);

        rideAccepted = await new Promise<boolean>(async (resolve) => {
          const timeOut = setTimeout(() => resolve(false), 16000);
          await listenForDriverResponse(resolve, timeOut, driverSocket);
        });
        if (rideAccepted) {
          break;
        }
      }

      async function listenForDriverResponse(
        resolve: (val: boolean) => void,
        timeout: NodeJS.Timeout,
        driverSocket: Socket
      ) {
        const onAccept = async (data: {
          token: string;
          userId: string;
          pickupLocation: string;
          dropOffLocation: string;
          distance: number;
          time: number;
          fare: number;
          pickupCoords: [number, number];
          dropOffCoords: [number, number];
        }) => {
          clearTimeout(timeout);
          try {
            const driverId = driverSocket.data.driverId;

            const userSocketId = await getFromRedis(`RU:${data.userId}`);

            const driver = await rideService.getDriverWithVehicle(
              driverId as string
            );

            const OTP = crypto.randomInt(1000, 10000).toString();

            if (!driver) {
              socket.emit("ride-error", { message: "Driver not found" });
              return;
            }
            await driverService.statusOnRide(driver._id as string);
            const details = {
              userId: data.userId as string,
              driverId: driver._id as string,
              status: "ongoing",
              distance: data.distance,
              totalFare: data.fare,
              estTime: data.time,
              pickupLocation: data.pickupLocation as string,
              dropOffLocation: data.dropOffLocation as string,
              pickupCoords: data.pickupCoords,
              dropOffCoord: data.dropOffCoords,
              OTP,
            };
            const ride = await rideService.createNewRide(details);
            const rideId = ride.id;

            await setToRedis(`DRID:${decodedId}`, rideId);
            await setToRedis(`URID:${data.userId}`, rideId);
            await updateDriverFelids(`driver:${decodedId}`, "status", "onRide");
            driverSocket.join(`ride:${rideId}`);
            if (userSocketId) {
              console.log("Sending ride accepted to user ", userSocketId);
              const userSocket = io.sockets.sockets.get(userSocketId);
              userSocket?.join(`ride:${rideId}`);
              io.to(userSocketId).emit("ride-accepted", {
                rideId,
                driver,
                distance: data.distance,
                totalFare: data.fare,
                estTime: data.time,
                pickupLocation: data.pickupLocation as string,
                dropOffLocation: data.dropOffLocation as string,
                pickupCoords: data.pickupCoords,
                dropOffCoords: data.dropOffCoords,
                startedTime: new Date().toISOString(),
                OTP,
              });
            } else {
              console.log(`User not found in no res  `);
              socket.emit("ride-error", { message: "User not found" });
            }
            resolve(true);
            cleanup();
          } catch (error) {
            console.log("in the error block", error);

            return;
          }
        };

        const onReject = () => {
          console.log("Inside on reject ");

          clearTimeout(timeout);
          cleanup();
          resolve(false);
        };

        const cleanup = () => {
          console.log("Inside clean up ");

          driverSocket.off("driver-ride-accepted", onAccept);
          driverSocket.off("reject-ride", onReject);
        };

        driverSocket.once("driver-ride-accepted", onAccept);
        driverSocket.once("reject-ride", onReject);
      }

      if (!rideAccepted) {
        const userSocketId = await getFromRedis(`RU:${decodedId}`);
        if (userSocketId) {
          io.to(userSocketId).emit("no-driver-response");
        } else {
          console.log(`User not found in no res  `);
          socket.emit("ride-error", { message: "User not found" });
        }
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

      const rideId = await getFromRedis(`DRID:${decodedId}`);

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
          const driverId = await rideService.getDriverByUserId(decodedId);
          console.log("Driver id ", driverId);

          if (!driverId) {
            console.error("Driver not found");
            socket.emit("ride-error", { message: "Driver not found" });
            return;
          }
          await driverService.goBackToOnline(driverId as string);
          await rideService.cancelRide(
            driverId as string,
            decodedId,
            cancelledBy
          );
          await updateDriverFelids(`driver:${driverId}`, "status", "online");
          if (rideId) {
            socket.to(`ride:${rideId}`).emit("ride-cancelled");
          } else {
            const driverSocketId = await getFromRedis(`OD:${driverId}`);
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
          const userId = await rideService.getUserIdByDriverId(decodedId);
          await rideService.cancelRide(
            decodedId,
            userId as string,
            cancelledBy
          );
          await driverService.goBackToOnline(decodedId);
          await updateDriverFelids(`driver:${decodedId}`, "status", "online");
          if (rideId) {
            console.log("Ride cancellation sent to user by room ");

            socket.to(`ride:${rideId}`).emit("ride-cancelled");
          } else {
            const userSocketId = await getFromRedis(`RU:${userId}`);
            if (!userId) {
              console.error("User not found");
              socket.emit("ride-error", { message: "User not found" });
              return;
            }

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
