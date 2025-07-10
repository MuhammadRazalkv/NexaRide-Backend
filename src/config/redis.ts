type DriverCategory = "Basic" | "Premium" | "Luxury";

interface DriverStatus {
  socketId: string;
  category: DriverCategory;
  status: "online" | "onRide";
  latitude: number;
  longitude: number;
  updatedAt: number;
}

import Redis from "ioredis";

const redis = new Redis({
  host: "127.0.0.1",
  port: 6379,
});

const setToRedis = async (
  key: string,
  value: string,
  expirySeconds?: number
) => {
  if (expirySeconds) {
    await redis.set(key, value, "EX", expirySeconds);
  } else {
    await redis.set(key, value);
  }
};

const getFromRedis = async (key: string): Promise<string | null> => {
  return await redis.get(key);
};

const removeFromRedis = async (key: string): Promise<void> => {
  await redis.del(key);
};

const saveDriverStatusToRedis = async (key: string, data: DriverStatus) => {
  await redis.hset(key, data);
};

const updateDriverFelids = async (
  key: string,
  filed: string,
  value: string
) => {
  await redis.hset(key, filed, value);
};
const addDriverToGeoIndex = async (
  key: string,
  longitude: number,
  latitude: number,
  member: string
) => {
  await redis.geoadd(key, longitude, latitude, member);
};

const getByGeoIndexRedis = async (
  key: string,
  longitude: number,
  latitude: number
) => {
  return await redis.georadius(
    key,
    longitude,
    latitude,
    5,
    "km",
    "WITHDIST",
    "ASC"
  );
};
const getAvailableDriversByGeo = async (
  key: string,
  longitude: number,
  latitude: number,
  radius = 5
): Promise<{ id: string; socketId: string; distance: number }[]> => {
  const rawResults = (await redis.georadius(
    key,
    longitude,
    latitude,
    radius,
    "km",
    "WITHDIST",
    "ASC"
  )) as [string, string][];

  console.log('Raw result of driver finding ',key ,rawResults);
  

  const availableDrivers: { id: string; socketId: string; distance: number }[] =
    [];

  for (const [driverId, distanceStr] of rawResults) {
    const driverData = await redis.hgetall(`driver:${driverId}`);
    console.log('Driver data on driver finding ',driverData);
    
    if (driverData.status === "online") {
      availableDrivers.push({
        id: driverId,
        socketId: driverData.socketId,
        distance: parseFloat(distanceStr),
      });
    }
  }

  return availableDrivers;
};

const getDriverInfoRedis = async (key: string) => {
  return await redis.hgetall(key);
};

export const removeDriverFromGeoIndex = async (key: string, driverId: string) => {
  try {
    await redis.zrem(key, driverId);
    console.log(`Removed driver ${driverId} from geo index ${key}`);
  } catch (error) {
    console.error(`Failed to remove driver ${driverId} from ${key}:`, error);
  }
};

export default redis;
export {
  setToRedis,
  getFromRedis,
  removeFromRedis,
  saveDriverStatusToRedis,
  addDriverToGeoIndex,
  getByGeoIndexRedis,
  getAvailableDriversByGeo,
  updateDriverFelids,
  getDriverInfoRedis,
};
