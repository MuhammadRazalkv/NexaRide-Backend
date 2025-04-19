import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import connectDB from "./config/db";
import morgan from "morgan";
import logger from "./utils/logger";
import redis from "./config/redis";
import userRoutes from "./routes/user.routes";
import driverRoutes from "./routes/driver.routes";
import adminRoutes from "./routes/admin.route";
import http from "http";
import { initializeSocket } from "./utils/socket";

import { UserService } from "./services/user.service";
import { UserRepository } from "./repositories/user.repo";
import { DriverRepo } from "./repositories/driver.repo";
import { DriverService } from "./services/driver.service";
import paymentController from "./bindings/payment.binding";
import { RideService } from "./services/ride.service";
import { RideRepo } from "./repositories/ride.repo";
import { VehicleRepo } from "./repositories/vehicle.repo";
import errorHandler from "./middlewares/error.middleware";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(
  cors({
    origin: process.env.FRONT_END_URL,
    credentials: true,
  })
);

app.post(
  "/user/webhook",
  express.raw({ type: "application/json" }),
  paymentController.webhook
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(cookieParser());

// Morgan
const morganFormat = ":method :url :status :response-time ms";
app.use(
  morgan(morganFormat, {
    stream: {
      write: (message) => {
        const logObject = {
          method: message.split(" ")[0],
          url: message.split(" ")[1],
          status: message.split(" ")[2],
          responseTime: message.split(" ")[3],
        };
        logger.info(JSON.stringify(logObject));
      },
    },
  })
);

// Redis connection
redis.on("connect", () => console.log("Connected to Redis"));
redis.on("error", (err) => console.error("Redis Error:", err));

// Routes
app.use("/user", userRoutes);
app.use("/driver", driverRoutes);
app.use("/admin", adminRoutes); 
const userRepo = new UserRepository();
const userService = new UserService(userRepo);
const driverRepo = new DriverRepo();
const vehicleRepo = new VehicleRepo()
const driverService = new DriverService(driverRepo,vehicleRepo);
const rideRepo = new RideRepo()
const rideService = new RideService(driverRepo,rideRepo)
const server = http.createServer(app);
initializeSocket(server, userService, driverService,rideService);

app.use(errorHandler)
// Start the server
connectDB().then(() => {
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
