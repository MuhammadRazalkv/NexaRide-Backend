import { Server } from "socket.io";
import redis from "../config/redis";
import driverRepo from "../repositories/driverRepo";
import driverService from "../services/driverService";
import rideService from "../services/rideService";


export const initializeSocket = (server: any) => {
    const io = new Server(server, {
      cors: { origin: "http://localhost:5173", credentials: true },
    });
  
    io.on("connection", (socket) => {
      console.log(`Socket connected: ${socket.id}`);
        
      
      socket.on("disconnect", () => {
        console.log(`Socket disconnected: ${socket.id}`);
      });
    });
  };