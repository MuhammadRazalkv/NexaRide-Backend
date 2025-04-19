// src/config/redisClient.ts

import Redis from "ioredis";

const redis = new Redis({
  host: "127.0.0.1",
  port: 6379,
});

redis.on("connect", () => {
  console.log("Connected to Redis");
});

redis.on("error", (err) => {
  console.error("Redis Error:", err);
});


const setToRedis  = async (key: string, value: string, expirySeconds?: number) => {
  if (expirySeconds) {
    await redis.set(key, value, "EX", expirySeconds);
  } else {
    await redis.set(key, value);
  }
};

const getFromRedis  = async (key: string): Promise<string | null> => {
  return await redis.get(key);
};

const removeFromRedis  = async (key: string): Promise<void> => {
  await redis.del(key);
};

export default redis
export {
       
  setToRedis ,
  getFromRedis ,
  removeFromRedis ,
};
