// import { Server, Socket } from "socket.io";
// import { getFromRedis, removeFromRedis, setToRedis } from "../config/redis";

// import { DriverService } from "../services/driver.service";

// import { UserService } from "../services/user.service";
// import { extractUserIdFromToken } from "./jwt";
// import crypto, { getRandomValues } from "crypto";
// import { RideService } from "../services/ride.service";

// interface IDriver {
//   name: string;
//   location: { coordinates: [number, number] };
//   vehicleDetails: {
//     brand: string;
//     vehicleModel: string;
//     category: 1;
//   };
// }

// let io: Server;

// export const initializeSocket = (
//   server: any,
//   userService: UserService,
//   driverService: DriverService,
//   rideService: RideService
// ) => {
//   io = new Server(server, {
//     cors: { origin: process.env.FRONT_END_URIDL, credentials: true },
//   });

//   io.use((socket: Socket, next) => {
//     const token = socket.handshake.auth?.token;
//     const role = socket.handshake.auth?.role;

//     if (!token || !role) {
//       console.log("Token or role missing");
//       return next(new Error("Authentication error"));
//     }

//     try {
//       const decodedId = extractUserIdFromToken(token);
//       console.log(role, "id ", decodedId);

//       (socket as any).user = { decodedId, role };
//       next();
//     } catch (error) {
//       console.log("Invalid token");
//       next(new Error("Authentication error"));
//     }
//   });

//   // Handling connections
//   io.on("connection", async (socket) => {
//     const { decodedId, role } = (socket as any).user;

//     // Store driver socket IDs for targeted communication
//     if (role === "driver") {
//       // redis.set(`OD:${decodedId}`, socket.id);
//       await setToRedis(`OD:${decodedId}`, socket.id);
//       console.log(`Driver ${decodedId} connected with socket ID: ${socket.id}`);
//     }

//     if (role === "user") {
//       setToRedis(`RU:${decodedId}`, socket.id);
//       console.log(`User ${decodedId} connected with socket ID: ${socket.id}`);
//     }

//     // Send ride request to a specific driver
//     socket.on("request-ride", async (data) => {
//       const { driverId, pickupCoords, dropOffCoords, fare } = data;

//       const driverSocketId = await getFromRedis(`OD:${driverId}`);
//       const user = await userService.getUserInfo(decodedId);
//       if (!user) {
//         console.log("User not found ");
//         return;
//       }
//       // await redis.set(`RU:${user?.id}`, socket.id);
//       if (driverSocketId) {
//         io.to(driverSocketId).emit("new-ride-req", {
//           user: {
//             id: user.id,
//             name: user.name,
//           },
//           pickupCoords,
//           dropOffCoords,
//           fare,
//         });
//         console.log(`Ride request sent to Driver ${driverId}`);
//       } else {
//         console.log(`Driver ${driverId} is not online or available.`);
//         socket.emit("ride-error", { message: "Driver is not available." });
//       }
//     });

//     socket.on("reject-ride", async (userId) => {
//       const userSocketId = await getFromRedis(`RU:${userId}`);
//       if (userSocketId) {
//         io.to(userSocketId).emit("ride-rejected", decodedId);
//         console.log(`Ride request rejected by driver `);
//       } else {
//         console.log(`User not found in reject ride `);
//         socket.emit("ride-error", { message: "User not found" });
//       }
//     });

//     socket.on("no-response", async (userId) => {
//       const userSocketId = await getFromRedis(`RU:${userId}`);
//       if (userSocketId) {
//         io.to(userSocketId).emit("no-driver-response");
//       } else {
//         console.log(`User not found in no res  `);
//         socket.emit("ride-error", { message: "User not found" });
//       }
//     });

//     socket.on("driver-ride-accepted", async (data) => {
//       const userSocketId = await getFromRedis(`RU:${data.userId}`);
//       const [driver] = await rideService.getDriverWithVehicle(decodedId);

//       const OTP = crypto.randomInt(1000, 10000).toString();

//       if (!driver) {
//         console.error("Driver not found");
//         socket.emit("ride-error", { message: "Driver not found" });
//         return;
//       }
//       await driverService.statusOnRide(driver._id);
//       const details = {
//         userId: data.userId as string,
//         driverId: driver._id as string,
//         status: "ongoing",
//         distance: data.distance,
//         totalFare: data.fare,
//         estTime: data.time,
//         pickupLocation: data.pickupLocation as string,
//         dropOffLocation: data.dropOffLocation as string,
//         pickupCoords: data.pickupCoords,
//         dropOffCoord: data.dropOffCoord,
//         OTP,
//       };
//       await rideService.createNewRide(details);
//       await setToRedis(
//         `DL:${decodedId}`,
//         JSON.stringify({
//           lat: driver.location.coordinates[1],
//           lng: driver.location.coordinates[0],
//           updatedAt: new Date().toISOString(),
//         })
//         // "EX",
//         // 60 * 5
//       );

//       if (userSocketId) {
//         io.to(userSocketId).emit("ride-accepted", {
//           driver,
//           distance: data.distance,
//           totalFare: data.fare,
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
//     });

//     socket.on("driver-location-update", async (data) => {
//       await setToRedis(
//         `DL${decodedId}`,
//         JSON.stringify({
//           lat: data.location[1],
//           lng: data.location[0],
//           updatedAt: new Date().toISOString(),
//         })
//       );
//       const userId = await rideService.getUserIdByDriverId(decodedId);

//       if (!userId) {
//         console.error("User not found location update");
//         socket.emit("ride-error", { message: "User not found" });
//         return;
//       }
//       const userSocketId = await getFromRedis(`RU:${userId}`);
//       console.log("userSocketId in locationUpdate ", userSocketId);

//       console.log("Data ", data);

//       if (userSocketId) {
//         io.to(userSocketId).emit("driver-location-update", {
//           type: data.type,
//           location: data.location,
//         });
//       }
//     });

//     socket.on("driver-reached", async () => {
//       // To get the user id from ongoing ride
//       const userId = await rideService.getUserIdByDriverId(decodedId);
//       if (!userId) {
//         console.error("User not found");
//         socket.emit("ride-error", { message: "User not found" });
//         return;
//       }
//       const userSocketId = await getFromRedis(`RU:${userId}`);
//       console.log("user socket id ", userSocketId);

//       if (userSocketId) {
//         io.to(userSocketId).emit("driver-reached");
//       }
//     });

//     socket.on("cancel-ride", async (cancelledBy) => {
//       if (cancelledBy == "user") {
//         const driverId = await rideService.getDriverByUserId(decodedId);
//         console.log("Driver id ", driverId);

//         const driverSocketId = await getFromRedis(`OD:${driverId}`);
//         if (!driverId) {
//           console.error("Driver not found");
//           socket.emit("ride-error", { message: "Driver not found" });
//           return;
//         }
//         try {
//           await driverService.goBackToOnline(driverId as string);
//           await rideService.cancelRide(
//             driverId as string,
//             decodedId,
//             cancelledBy
//           );
//           if (driverSocketId) {
//             io.to(driverSocketId).emit("ride-cancelled");
//           }
//         } catch (error: any) {
//           console.log(error);
//           socket.emit("ride-error", { message: error.message });
//         }
//       } else if (cancelledBy == "driver") {
//         const userId = await rideService.getUserIdByDriverId(decodedId);
//         const userSocketId = await getFromRedis(`RU:${userId}`);
//         if (!userId) {
//           console.error("User not found");
//           socket.emit("ride-error", { message: "User not found" });
//           return;
//         }
//         try {
//           await driverService.goBackToOnline(decodedId);
//           if (userSocketId) {
//             await rideService.cancelRide(
//               decodedId,
//               userId as string,
//               cancelledBy
//             );
//             io.to(userSocketId).emit("ride-cancelled");
//           }
//         } catch (error: any) {
//           console.log(error);
//           socket.emit("ride-error", { message: error.message });
//         }
//       }
//     });

//     socket.on("dropOff-reached", async () => {
//       console.log("dropOff-reached ");

//       const userId = await rideService.getUserIdByDriverId(decodedId);
//       console.log("User id ", userId);

//       const userSocketId = await getFromRedis(`RU:${userId}`);
//       if (!userId) {
//         console.error("User not found");
//         socket.emit("ride-error", { message: "User not found" });
//         return;
//       }
//       const { rideId, fare } = await rideService.getRideIdByUserAndDriver(
//         decodedId,
//         userId as string
//       );
//       console.log("rideId", rideId, "fare ", fare);

//       try {
//         if (userSocketId) {
//           io.to(userSocketId).emit("dropOff-reached", {
//             rideId,
//             fare,
//           });
//         } else {
//           console.log("userSocket id not found", userSocketId);
//         }
//       } catch (error: any) {
//         console.log(error);
//         socket.emit("ride-error", { message: error.message });
//       }
//     });

//     socket.on("disconnect", () => {
//       console.log(`${role}  disconnected`);
//     });
//   });
// };
// export const getIO = (): Server => {
//   if (!io) throw new Error("Socket.io not initialized");
//   return io;
// };

import { Server, Socket } from "socket.io";
import { getFromRedis, removeFromRedis, setToRedis } from "../config/redis";

import { DriverService } from "../services/driver.service";

import { UserService } from "../services/user.service";
import { extractUserIdFromToken } from "./jwt";
import crypto, { getRandomValues } from "crypto";
import { RideService } from "../services/ride.service";

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
    cors: { origin: process.env.FRONT_END_URIDL, credentials: true },
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
      console.log(role, "id ", decodedId);

      (socket as any).user = { decodedId, role };
      next();
    } catch (error) {
      console.log("Invalid token");
      next(new Error("Authentication error"));
    }
  });

  // Handling connections
  io.on("connection", async (socket) => {
    const { decodedId, role } = (socket as any).user;

    // Store driver socket IDs for targeted communication
    if (role === "driver") {
      // redis.set(`OD:${decodedId}`, socket.id);
      await setToRedis(`OD:${decodedId}`, socket.id);
      const rideId = await getFromRedis(`DRID:${decodedId}`);
      if (rideId) socket.join(`ride:${rideId}`);
      console.log(`Driver ${decodedId} connected with socket ID: ${socket.id}`);
    }

    if (role === "user") {
      setToRedis(`RU:${decodedId}`, socket.id);
      const rideId = await getFromRedis(`URID:${decodedId}`);
      if (rideId) socket.join(`ride:${rideId}`);
      console.log(`User ${decodedId} connected with socket ID: ${socket.id}`);
    }

    // Send ride request to a specific driver
    socket.on("request-ride", async (data) => {
      const { driverId, pickupCoords, dropOffCoords, fare } = data;

      const driverSocketId = await getFromRedis(`OD:${driverId}`);
      const user = await userService.getUserInfo(decodedId);
      if (!user) {
        console.log("User not found ");
        return;
      }
      // await redis.set(`RU:${user?.id}`, socket.id);
      if (driverSocketId) {
        io.to(driverSocketId).emit("new-ride-req", {
          user: {
            id: user.id,
            name: user.name,
          },
          pickupCoords,
          dropOffCoords,
          fare,
        });
        console.log(`Ride request sent to Driver ${driverId}`);
      } else {
        console.log(`Driver ${driverId} is not online or available.`);
        socket.emit("ride-error", { message: "Driver is not available." });
      }
    });

    socket.on("reject-ride", async (userId) => {
      const userSocketId = await getFromRedis(`RU:${userId}`);
      if (userSocketId) {
        io.to(userSocketId).emit("ride-rejected", decodedId);
        console.log(`Ride request rejected by driver `);
      } else {
        console.log(`User not found in reject ride `);
        socket.emit("ride-error", { message: "User not found" });
      }
    });

    socket.on("no-response", async (userId) => {
      const userSocketId = await getFromRedis(`RU:${userId}`);
      if (userSocketId) {
        io.to(userSocketId).emit("no-driver-response");
      } else {
        console.log(`User not found in no res  `);
        socket.emit("ride-error", { message: "User not found" });
      }
    });

    socket.on("driver-ride-accepted", async (data) => {
      const userSocketId = await getFromRedis(`RU:${data.userId}`);
      const [driver] = await rideService.getDriverWithVehicle(decodedId);

      const OTP = crypto.randomInt(1000, 10000).toString();

      if (!driver) {
        console.error("Driver not found");
        socket.emit("ride-error", { message: "Driver not found" });
        return;
      }
      await driverService.statusOnRide(driver._id);
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
        dropOffCoord: data.dropOffCoord,
        OTP,
      };
      const ride = await rideService.createNewRide(details);
      await setToRedis(
        `DL:${decodedId}`,
        JSON.stringify({
          lat: driver.location.coordinates[1],
          lng: driver.location.coordinates[0],
          updatedAt: new Date().toISOString(),
        })
        // "EX",
        // 60 * 5
      );
      const rideId = ride.id;

      await setToRedis(`DRID:${decodedId}`, rideId);
      await setToRedis(`URID:${data.userId}`, rideId);
      socket.join(`ride:${rideId}`);
      if (userSocketId) {
        const userSocket = io.sockets.sockets.get(userSocketId);
        userSocket?.join(`ride:${rideId}`);
        io.to(userSocketId).emit("ride-accepted", {
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
      console.log("Driver location update ", data);

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
        console.log("user socket id ", userSocketId);

        if (userSocketId) {
          io.to(userSocketId).emit("driver-reached");
        }
      }
    });

    socket.on("cancel-ride", async (cancelledBy) => {
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
        console.log("dropOff-reached ");
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
            console.error("User not found");
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

    socket.on("disconnect", () => {
      console.log(`${role}  disconnected`);
    });
  });
};
export const getIO = (): Server => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};
