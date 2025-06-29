import { env } from "@api/config/env";
import { Redis } from "ioredis";

export const redis = new Redis(`${env.REDIS_URL}?family=6`, {
   maxRetriesPerRequest: null,
});
