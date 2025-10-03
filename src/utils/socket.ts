import { Server, Socket } from 'socket.io';
import {
  getFromRedis,
  removeFromRedis,
  saveDriverStatusToRedis,
  addDriverToGeoIndex,
  setToRedis,
  getAvailableDriversByGeo,
  updateDriverFelids,
  removeDriverFromGeoIndex,
  changeExpInRedis,
  DriverCategory,
} from '../config/redis';
import { extractUserIdFromToken } from './jwt';
import { AppError } from './appError';
import { HttpStatus } from '../constants/httpStatusCodes';
import { messages } from '../constants/httpMessages';
import { userService } from '../bindings/user.bindings';
import { rideService } from '../bindings/ride.bindings';
import { validateRideRequest } from './validators/rideRequestValidators';
import { getRouteDetails } from './geoApi';
import { calculateFareWithDiscount } from './offerCalculation';
import { findDriverForRide } from './rideBooking';
import { driverService } from '../bindings/driver.bindings';
let io: Server;

export const initializeSocket = (server: any) => {
  io = new Server(server, {
    cors: { origin: process.env.FRONT_END_URL, credentials: true },
  });

  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token;
    const role = socket.handshake.auth?.role;

    if (!token || !role) {
      return next(new Error('Authentication error'));
    }

    try {
      const decodedId = extractUserIdFromToken(token);
      console.log(role, 'id ', decodedId);

      (socket as any).user = { decodedId, role };
      next();
    } catch (error) {
      // console.log("Invalid token");
      next(new AppError(HttpStatus.UNAUTHORIZED, messages.INVALID_ID));
    }
  });

  // Handling connections
  io.on('connection', async (socket) => {
    const { decodedId, role } = (socket as any).user;
    if (role === 'driver') {
      socket.data.driverId = decodedId;
      console.log('Driver connected ');

      // await setToRedis(`OD:${decodedId}`, socket.id, 120);
      //! add time to use the keep-alive
      await setToRedis(`OD:${decodedId}`, socket.id);
      const rideId = await getFromRedis(`DRID:${decodedId}`);
      if (rideId) {
        socket.join(`ride:${rideId}`);
      } else {
        const driver = await rideService.getDriverWithVehicle(decodedId);
        if (driver) {
          await saveDriverStatusToRedis(`driver:${decodedId}`, {
            socketId: socket.id,
            category: driver.vehicleDetails.category as DriverCategory,
            status: 'online',
            latitude: driver.location?.coordinates[1] || 0,
            longitude: driver.location?.coordinates[0] || 0,
            updatedAt: Date.now(),
          });

          await addDriverToGeoIndex(
            `drivers:${driver.vehicleDetails.category}`,
            driver.location?.coordinates[0] || 0,
            driver.location?.coordinates[1] || 0,
            decodedId,
          );
        }
      }
    }

    if (role === 'user') {
      // await setToRedis(`RU:${decodedId}`, socket.id, 90);
      //! add time to use the keep-alive

      await setToRedis(`RU:${decodedId}`, socket.id);
      console.log('connect user socket id ', socket.id);

      const rideId = await getFromRedis(`URID:${decodedId}`);
      if (rideId) socket.join(`ride:${rideId}`);
      // console.log(`User ${decodedId} connected with socket ID: ${socket.id}`);
    }

    //! This is the event keep-alive which is used to do the 1 system lock

    // socket.on("keep-alive", async () => {
    //   try {
    //     console.log("Keep alive event ", role);

    //     const key = role === "driver" ? `OD:${decodedId}` : `RU:${decodedId}`;
    //     await changeExpInRedis(key, 120);
    //     console.log("Keep alive event succcess ");
    //   } catch (err) {
    //     console.error("Failed to refresh Redis TTL:", err);
    //     socket.emit("ride-error", { message: "Failed to refresh " });
    //     return;
    //   }
    // });

    // Send ride request to a specific group

    socket.on('request-ride', async (data) => {
      let { category, pickupCoords, dropOffCoords } = data;
      if (!validateRideRequest(data, decodedId)) {
        socket.emit('ride-error', { message: 'Invalid ride request data' });
        return;
      }

      try {
        const routeInfo = await getRouteDetails(pickupCoords, dropOffCoords);
        const pricePerKm = await driverService.getPriceByCategory((category as string).trim());
        if (!routeInfo || !pricePerKm) {
          socket.emit('ride-error', {
            message: 'Fare calculation failed',
          });
          return;
        }

        const km = routeInfo.distance / 1000;
        let requestedFare = Math.round(km * pricePerKm);

        const user = await userService.getUserInfo(decodedId);

        if (!user) {
          socket.emit('ride-error', { message: 'User not found' });
          return;
        }
        const nearestDrivers = await getAvailableDriversByGeo(
          `drivers:${category}`,
          pickupCoords[1],
          pickupCoords[0],
        );

        if (!nearestDrivers || nearestDrivers.length === 0) {
          socket.emit('ride-error', {
            message: 'No drivers available in your area',
          });
          return;
        }

        const fareData = await calculateFareWithDiscount(requestedFare, decodedId);
        if (!fareData) {
          socket.emit('ride-error', {
            message: 'Fare calculation failed',
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
          premiumDiscount,
        } = fareData;

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
          io,
        );
        if (!rideResult.accepted) {
          const userSocketId = await getFromRedis(`RU:${decodedId}`);
          if (userSocketId) {
            io.to(userSocketId).emit('no-driver-response');
          } else {
            console.log('ride not accepted and userSocketId not found');

            socket.emit('ride-error', { message: 'User not found' });
          }
        }
      } catch (error) {
        if (error instanceof Error)
          socket.emit('ride-error', {
            message: error.message,
          });
        console.log(error);
        return;
      }
    });

    socket.on('driver-location-update', async (data) => {
      const rideId = await getFromRedis(`DRID:${decodedId}`);
      console.log('Retrieved rideId:', rideId);

      if (rideId) {
        console.log('Sending location update through room ');

        socket.to(`ride:${rideId}`).emit('driver-location-update', {
          type: data.type,
          location: data.location,
        });
      } else {
        console.log('sending location update via socket id ');

        const userId = await rideService.getUserIdByDriverId(decodedId);

        if (!userId) {
          console.error('User not found location update');
          socket.emit('ride-error', { message: 'User not found' });
          return;
        }
        const userSocketId = await getFromRedis(`RU:${userId}`);
        console.log('userSocketId in locationUpdate ', userSocketId);

        console.log('Data ', data);

        if (userSocketId) {
          io.to(userSocketId).emit('driver-location-update', {
            type: data.type,
            location: data.location,
          });
        }
      }
    });

    socket.on('driver-reached', async () => {
      const rideId = await getFromRedis(`DRID:${decodedId}`);
      if (rideId) {
        socket.to(`ride:${rideId}`).emit('driver-reached');
      } else {
        // To get the user id from ongoing ride
        const userId = await rideService.getUserIdByDriverId(decodedId);
        if (!userId) {
          console.error('User not found');
          socket.emit('ride-error', { message: 'User not found' });
          return;
        }
        const userSocketId = await getFromRedis(`RU:${userId}`);
        if (userSocketId) {
          io.to(userSocketId).emit('driver-reached');
        }
      }
    });

    socket.on('cancel-ride', async (cancelledBy) => {
      console.log('Inside cancel ride by', cancelledBy);

      const isUser = cancelledBy === 'user';
      const rideKey = isUser ? `URID:${decodedId}` : `DRID:${decodedId}`;
      const rideId = await getFromRedis(rideKey);

      if (!rideId) return;

      try {
        const ride = await rideService.findRideById(rideId);
        if (!ride) {
          socket.emit('ride-error', { message: 'Ride not found' });
          return;
        }

        const driverId = ride.driverId;
        const userId = ride.userId;

        if (isUser && !driverId) {
          console.error('Driver not found');
          socket.emit('ride-error', { message: 'Driver not found' });
          return;
        }

        if (!isUser && !userId) {
          console.error('User not found');
          socket.emit('ride-error', { message: 'User not found' });
          return;
        }

        // Cancel the ride and update driver status
        await rideService.cancelRide(
          isUser ? (driverId as string) : decodedId,
          isUser ? decodedId : (userId as string),
          cancelledBy,
        );

        await updateDriverFelids(`driver:${isUser ? driverId : decodedId}`, 'status', 'online');

        // Notify the other party
        const room = `ride:${rideId}`;
        socket.to(room).emit('ride-cancelled');
        socket.leave(room);

        const otherSocketId = isUser
          ? await getFromRedis(`OD:${driverId}`)
          : await getFromRedis(`RU:${userId}`);

        if (otherSocketId) {
          io.to(otherSocketId).emit('ride-cancelled');
        }
        if (isUser) {
          await removeFromRedis(rideKey);
          await removeFromRedis(`DRID:${driverId}`);
        } else {
          await removeFromRedis(rideKey);
          await removeFromRedis(`URID:${userId}`);
        }
      } catch (error: any) {
        console.error('Ride cancellation error:', error);
        socket.emit('ride-error', { message: error.message });
      }
    });

    socket.on('dropOff-reached', async () => {
      try {
        const rideId = await getFromRedis(`DRID:${decodedId}`);

        if (rideId) {
          const ride = await rideService.findRideById(rideId);
          if (ride) {
            socket.to(`ride:${rideId}`).emit('dropOff-reached', {
              rideId,
              fare: ride.totalFare,
            });
          }
        } else {
          const userId = await rideService.getUserIdByDriverId(decodedId);

          if (!userId) {
            socket.emit('ride-error', { message: 'User not found' });
            return;
          }

          const userSocketId = await getFromRedis(`RU:${userId}`);
          const { rideId, fare } = await rideService.getRideIdByUserAndDriver(
            decodedId,
            userId as string,
          );
          if (userSocketId) {
            io.to(userSocketId).emit('dropOff-reached', {
              rideId,
              fare,
            });
          } else {
            console.warn('User socket not found in dropOff-reached');
          }
        }
      } catch (error: any) {
        console.error('Error in dropOff-reached:', error.message);
        socket.emit('ride-error', { message: error.message });
      }
    });

    socket.on('chat-msg', async (data) => {
      let rideId;
      if (data.sendBy == 'user') {
        rideId = await getFromRedis(`URID:${decodedId}`);
      } else {
        rideId = await getFromRedis(`DRID:${decodedId}`);
      }
      if (rideId) {
        socket.to(`ride:${rideId}`).emit('chat-msg', {
          id: Date.now().toString(),
          text: data.text,
          senderId: decodedId,
        });
      }
    });

    socket.on('disconnect', async () => {
      try {
        if (role == 'driver') {
          const driver = await rideService.getDriverWithVehicle(decodedId);
          if (driver) {
            await removeFromRedis(`OD:${decodedId}`);
            await removeFromRedis(`driver:${decodedId}`);
            await removeDriverFromGeoIndex(`drivers:${driver.vehicleDetails.category}`, decodedId);
            console.log('Removed driver', driver.name);
          }
        } else if (role == 'user') {
          await removeFromRedis(`RU:${decodedId}`);
        }
      } catch (err) {
        console.error('Error during socket disconnect cleanup:', err);
      }
    });
  });
};
export const getIO = (): Server => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};
