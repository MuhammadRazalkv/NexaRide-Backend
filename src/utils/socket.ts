import { Server, Socket } from "socket.io";
import redis from "../config/redis";
import driverRepo from "../repositories/driver.repo";
import driverService from "../services/driver.service";
import rideService from "../services/ride.service";
import userService from "../services/user.service";
import { extractUserIdFromToken } from "./jwt";
import crypto from "crypto";

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

export const initializeSocket = (server: any) => {
   io = new Server(server, {
    cors: { origin: "http://localhost:5173", credentials: true },
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
  io.on("connection", (socket) => {
    const { decodedId, role } = (socket as any).user;

    // Store driver socket IDs for targeted communication
    if (role === "driver") {
      redis.set(`OD:${decodedId}`, socket.id);
      console.log(`Driver ${decodedId} connected with socket ID: ${socket.id}`);
    }

    if (role === "user") {
      redis.set(`RU:${decodedId}`,socket.id)
      console.log(`User ${decodedId} connected with socket ID: ${socket.id}`);
    }

    // Send ride request to a specific driver
    socket.on("request-ride", async (data) => {
      const { driverId, pickupCoords, dropOffCoords, fare } = data;

      const driverSocketId = await redis.get(`OD:${driverId}`);
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
      const userSocketId = await redis.get(`RU:${userId}`);
      if (userSocketId) {
        io.to(userSocketId).emit("ride-rejected", decodedId);
        console.log(`Ride request rejected by driver `);
      } else {
        console.log(`User not found in reject ride `);
        socket.emit("ride-error", { message: "User not found" });
      }
    });

    socket.on("no-response", async (userId) => {
      const userSocketId = await redis.get(`RU:${userId}`);
      if (userSocketId) {
        io.to(userSocketId).emit("no-driver-response");
      } else {
        console.log(`User not found in no res  `);
        socket.emit("ride-error", { message: "User not found" });
      }
    });

    socket.on("driver-ride-accepted", async (data) => {
      const userSocketId = await redis.get(`RU:${data.userId}`);
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
      await rideService.createNewRide(details);
      await redis.set(
        `DL:${decodedId}`,
        JSON.stringify({
          lat: driver.location.coordinates[1],
          lng: driver.location.coordinates[0],
          updatedAt: new Date().toISOString(),
        })
        // "EX",
        // 60 * 5
      );

      if (userSocketId) {
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
      await redis.set(
        `DL${decodedId}`,
        JSON.stringify({
          lat: data.location[1],
          lng: data.location[0],
          updatedAt: new Date().toISOString(),
        })
      );
      const userId = await rideService.getUserIdByDriverId(decodedId);

      if (!userId) {
        console.error("User not found location update");
        socket.emit("ride-error", { message: "User not found" });
        return;
      }
      const userSocketId = await redis.get(`RU:${userId}`);
      console.log('userSocketId in locationUpdate ',userSocketId);
      
      console.log("Data ", data);

      if (userSocketId) {
        io.to(userSocketId).emit("driver-location-update", {
          type: data.type,
          location: data.location,
        });
      }
    });

    socket.on("driver-reached", async () => {
      // To get the user id from ongoing ride
      const userId = await rideService.getUserIdByDriverId(decodedId);
      if (!userId) {
        console.error("User not found");
        socket.emit("ride-error", { message: "User not found" });
        return;
      }
      const userSocketId = await redis.get(`RU:${userId}`);
      console.log("user socket id ", userSocketId);

      if (userSocketId) {
        io.to(userSocketId).emit("driver-reached");
      }
    });

    socket.on("cancel-ride", async (cancelledBy) => {
      if (cancelledBy == "user") {
        const driverId = await rideService.getDriverByUserId(decodedId);
        console.log("Driver id ", driverId);

        const driverSocketId = await redis.get(`OD:${driverId}`);
        if (!driverId) {
          console.error("Driver not found");
          socket.emit("ride-error", { message: "Driver not found" });
          return;
        }
        try {
          await driverService.goBackToOnline(driverId as string);
          await rideService.cancelRide(
            driverId as string,
            decodedId,
            cancelledBy
          );
          if (driverSocketId) {
            io.to(driverSocketId).emit("ride-cancelled");
          }
        } catch (error: any) {
          console.log(error);
          socket.emit("ride-error", { message: error.message });
        }
      } else if (cancelledBy == "driver") {
        const userId = await rideService.getUserIdByDriverId(decodedId);
        const userSocketId = await redis.get(`RU:${userId}`);
        if (!userId) {
          console.error("User not found");
          socket.emit("ride-error", { message: "User not found" });
          return;
        }
        try {    
          await driverService.goBackToOnline(decodedId);
          if (userSocketId) {
            await rideService.cancelRide(
              decodedId,
              userId as string, 
              cancelledBy
            );
            io.to(userSocketId).emit("ride-cancelled");
          }
        } catch (error: any) {
          console.log(error);
          socket.emit("ride-error", { message: error.message });
        }
      }
    });

    socket.on('dropOff-reached',async()=>{
      console.log('dropOff-reached ');
      
      const userId = await rideService.getUserIdByDriverId(decodedId);
      console.log('User id ',userId);
      
      const userSocketId = await redis.get(`RU:${userId}`)
      if (!userId) {
        console.error("User not found");
        socket.emit("ride-error", { message: "User not found" });
        return;
      }
      const {rideId,fare} = await rideService.getRideIdByUserAndDriver(decodedId,userId as string)
      console.log('rideId',rideId,'fare ',fare);
      
      try {
        if (userSocketId) {
          console.log('sending event to usersocket');
          
          io.to(userSocketId).emit('dropOff-reached',{
            rideId,fare
          })
        } else{
          console.log('userSocket id not found',userSocketId);
          
        }
        
      } catch (error:any) {
        console.log(error);
        socket.emit("ride-error", { message: error.message });
      }

    })

    socket.on("disconnect", () => {
      console.log(`${role}  disconnected`);
    });
  });
};
export const getIO = (): Server => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};