import { Server, Socket } from "socket.io";
import redis from "../config/redis";
import driverRepo from "../repositories/driverRepo";
import driverService from "../services/driverService";
import rideService from "../services/rideService";
import userService from "../services/userService";
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

export const initializeSocket = (server: any) => {
  const io = new Server(server, {
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
      await redis.set(`RU:${user?.id}`, socket.id);
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
        timestamps: { startedAt: new Date() },
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
      console.log('Driver location update ',data.location);
      
      await redis.set(
        `DL${decodedId}`,
        JSON.stringify({
          lat: data.location[1],
          lng: data.location[0],
          updatedAt: new Date().toISOString(),
        })
      );
      const userId = await rideService.getUserIdByDriverId(decodedId);
      console.log('userID',userId);
      
      if (!userId) {
        console.error("User not found location update");
        socket.emit("ride-error", { message: "User not found" });
        return;
      }
      const userSocketId = await redis.get(`RU:${userId}`);
      console.log('userSocketId ',userSocketId);
      
      if (userSocketId) {
        console.log('Socket id found sending live location ',data.location);
        
        io.to(userSocketId).emit('driver-location-update',{
          location: data.location
        })
      }
    }); 

    socket.on('driver-reached',async ()=>{
      // To get the user id from ongoing ride 
      const userId = await rideService.getUserIdByDriverId(decodedId)
      if (!userId) {
        console.error("User not found");
        socket.emit("ride-error", { message: "User not found" });
        return;
      }
      const userSocketId = await redis.get(`RU:${userId}`)
      if (userSocketId) {
        io.to(userSocketId).emit('driver-reached')
      }
    })

    socket.on("disconnect", () => {
      console.log(`${role}  disconnected`);
    });
  });
};
