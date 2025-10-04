import { Server, Socket } from 'socket.io';
import crypto from 'crypto';
import { getFromRedis, setToRedis, updateDriverFelids } from '../config/redis';
import { rideService } from '../bindings/ride.bindings';
import { offerService } from '../bindings/offer.bindings';
import { OfferResDTO } from '../dtos/response/offer.res.dto';
import { RideCreateDTO } from '../interface/ride.interface';
import { UserResDTO } from '../dtos/response/user.dto';

interface INearestDrivers {
  id: string;
  socketId: string;
  distance: number;
}
export async function findDriverForRide(
  drivers: INearestDrivers[],
  user: UserResDTO,
  pickupCoords: [number, number],
  dropOffCoords: [number, number],
  driverShare: number,
  finalFare: number,
  bestOffer: OfferResDTO | null,
  bestDiscount: number,
  originalFare: number,
  distance: number,
  premiumDiscount: number,
  io: Server,
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
    driverSocket.emit('new-ride-req', {
      user: {
        id: user._id,
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
      user._id,
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
      DRIVER_RESPONSE_TIMEOUT,
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
  bestOffer: OfferResDTO | null,
  bestDiscount: number,
  originalFare: number,
  distance: number,
  premiumDiscount: number,
  driverShare: number,
  io: Server,
  timeout: number,
) {
  // return new Promise(async (resolve) => {
  //   let isResolved = false;
  //   const timeoutId = setTimeout(() => {
  //     console.log('waitForDriverResponse Timeout');

  //     if (!isResolved) {
  //       isResolved = true;
  //       cleanup();
  //       resolve(false);
  //     }
  //   }, timeout);

  //   const onAccept = async (data: {
  //     userId: string;
  //     pickupLocation: string;
  //     dropOffLocation: string;
  //     //   distance: number;
  //     time: number;
  //     pickupCoords: [number, number];
  //     dropOffCoords: [number, number];
  //   }) => {
  //     if (isResolved) return;
  //     console.log('waitForDriverResponse onAccept');

  //     isResolved = true;
  //     clearTimeout(timeoutId);
  //     console.log('Inside the on Accept');

  //     try {
  //       const driverId = driverSocket.data.driverId;
  //       const userSocketId = await getFromRedis(`RU:${userId}`);

  //       // Get driver with vehicle details
  //       const driver = await rideService.getDriverWithVehicle(driverId);
  //       if (!driver) {
  //         if (userSocketId) {
  //           io.to(userSocketId).emit('ride-error', {
  //             message: 'Driver not found',
  //           });
  //         }
  //         cleanup();
  //         resolve(false);
  //         return;
  //       }

  //       // Generate OTP for ride verification
  //       const OTP = crypto.randomInt(1000, 10000).toString();
  //       console.log('Best offer ', bestOffer);

  //       // Create ride details
  //       const rideDetails: RideCreateDTO = {
  //         userId: userId,
  //         driverId,
  //         status: 'ongoing',
  //         distance: distance,
  //         totalFare: finalFare, // after offer applied which user should pay
  //         baseFare: originalFare, // the original fare before offers
  //         premiumDiscount: premiumDiscount ?? 0, // Discount for those who took a premium plan
  //         offerDiscountAmount: Math.round(bestDiscount ?? 0), // applied offer discount
  //         commission: Math.round(originalFare - driverShare),
  //         estTime: data.time,
  //         driverEarnings: Math.round(driverShare ?? 0),
  //         pickupLocation: data.pickupLocation,
  //         dropOffLocation: data.dropOffLocation,
  //         pickupCoords: data.pickupCoords,
  //         dropOffCoords: data.dropOffCoords,
  //         OTP,
  //         startedAt: Date.now(),
  //       };
  //       if (bestOffer && bestOffer._id) {
  //         console.log('passed the if statement ', bestOffer, bestOffer._id);

  //         rideDetails.appliedOffer = {
  //           offerId: bestOffer._id,
  //           discountAmount: bestDiscount ?? 0,
  //           offerType: bestOffer.type,
  //           originalCommission: originalFare * 0.2,
  //         };
  //       }

  //       // Create ride record in database
  //       const ride = await rideService.createNewRide(rideDetails);
  //       const rideId = ride.id;

  //       if (ride.appliedOffer) {
  //         console.log('inside ride applied offer ', ride.appliedOffer);

  //         await offerService.increaseOfferUsage(userId, ride?.appliedOffer.offerId);
  //       }

  //       // Update Redis and driver status
  //       await Promise.all([
  //         setToRedis(`DRID:${driverId}`, rideId),
  //         setToRedis(`URID:${userId}`, rideId),
  //         updateDriverFelids(`driver:${driverId}`, 'status', 'onRide'),
  //       ]);
  //       console.log('promise all');

  //       // Create ride room for real-time updates
  //       driverSocket.join(`ride:${rideId}`);

  //       // Notify user about accepted ride
  //       console.log('User socket id onAccept ', userSocketId);

  //       if (userSocketId) {
  //         const userSocket = io.sockets.sockets.get(userSocketId);
  //         if (userSocket) {
  //           userSocket.join(`ride:${rideId}`);
  //           io.to(userSocketId).emit('ride-accepted', {
  //             rideId,
  //             driver,
  //             distance: distance,
  //             totalFare: finalFare,
  //             estTime: data.time,
  //             pickupLocation: data.pickupLocation,
  //             dropOffLocation: data.dropOffLocation,
  //             pickupCoords: data.pickupCoords,
  //             dropOffCoords: data.dropOffCoords,
  //             startedTime: new Date().toISOString(),
  //             OTP,
  //           });
  //         }
  //       } else {
  //         console.warn(`User socket not found for user ID: ${userId}`);
  //       }

  //       cleanup();
  //       resolve(true);
  //     } catch (error) {
  //       console.error('Error processing driver acceptance:', error);
  //       cleanup();
  //       resolve(false);
  //     }
  //   };

  //   const onReject = () => {
  //     if (isResolved) return;
  //     console.log('waitForDriverResponse onReject');

  //     isResolved = true;
  //     clearTimeout(timeoutId);
  //     cleanup();
  //     resolve(false);
  //   };

  //   const cleanup = () => {
  //     driverSocket.off('driver-ride-accepted', onAccept);
  //     driverSocket.off('reject-ride', onReject);
  //   };

  //   driverSocket.once('driver-ride-accepted', onAccept);
  //   driverSocket.once('reject-ride', onReject);
  // });

  return new Promise((resolve) => {
    let isResolved = false;

    const cleanup = () => {
      driverSocket.off('driver-ride-accepted', onAccept);
      driverSocket.off('reject-ride', onReject);
      clearTimeout(timeoutId);
    };

    const timeoutId = setTimeout(() => {
      console.log('waitForDriverResponse Timeout');
      if (!isResolved) {
        isResolved = true;
        cleanup();
        resolve(false);
      }
    }, timeout);

    const onAccept = (data: {
      userId: string;
      pickupLocation: string;
      dropOffLocation: string;
      time: number;
      pickupCoords: [number, number];
      dropOffCoords: [number, number];
    }) => {
      if (isResolved) return;
      isResolved = true;
      clearTimeout(timeoutId);

      // ✅ handle async logic inside IIFE
      (async () => {
        try {
          const driverId = driverSocket.data.driverId;
          const userSocketId = await getFromRedis(`RU:${userId}`);

          const driver = await rideService.getDriverWithVehicle(driverId);
          if (!driver) {
            if (userSocketId) {
              io.to(userSocketId).emit('ride-error', { message: 'Driver not found' });
            }
            cleanup();
            resolve(false);
            return;
          }

          const OTP = crypto.randomInt(1000, 10000).toString();

          const rideDetails: RideCreateDTO = {
            userId,
            driverId,
            status: 'ongoing',
            distance,
            totalFare: finalFare,
            baseFare: originalFare,
            premiumDiscount: premiumDiscount ?? 0,
            offerDiscountAmount: Math.round(bestDiscount ?? 0),
            commission: Math.round(originalFare - driverShare),
            estTime: data.time,
            driverEarnings: Math.round(driverShare ?? 0),
            pickupLocation: data.pickupLocation,
            dropOffLocation: data.dropOffLocation,
            pickupCoords: data.pickupCoords,
            dropOffCoords: data.dropOffCoords,
            OTP,
            startedAt: Date.now(),
          };

          if (bestOffer && bestOffer._id) {
            rideDetails.appliedOffer = {
              offerId: bestOffer._id,
              discountAmount: bestDiscount ?? 0,
              offerType: bestOffer.type,
              originalCommission: originalFare * 0.2,
            };
          }

          const ride = await rideService.createNewRide(rideDetails);
          const rideId = ride.id;

          if (ride.appliedOffer) {
            await offerService.increaseOfferUsage(userId, ride.appliedOffer.offerId);
          }

          await Promise.all([
            setToRedis(`DRID:${driverId}`, rideId),
            setToRedis(`URID:${userId}`, rideId),
            updateDriverFelids(`driver:${driverId}`, 'status', 'onRide'),
          ]);

          driverSocket.join(`ride:${rideId}`);

          if (userSocketId) {
            const userSocket = io.sockets.sockets.get(userSocketId);
            if (userSocket) {
              userSocket.join(`ride:${rideId}`);
              io.to(userSocketId).emit('ride-accepted', {
                rideId,
                driver,
                distance,
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
          console.error('Error processing driver acceptance:', error);
          cleanup();
          resolve(false);
        }
      })();
    };

    const onReject = () => {
      if (isResolved) return;
      isResolved = true;
      cleanup();
      resolve(false);
    };

    driverSocket.once('driver-ride-accepted', onAccept);
    driverSocket.once('reject-ride', onReject);
  });
}
