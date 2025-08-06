import { Redis } from "ioredis";

export const createRedisClient = (REDIS_URL: string) =>
   new Redis(`${REDIS_URL}?family=6`, {
      maxRetriesPerRequest: null,
   });
