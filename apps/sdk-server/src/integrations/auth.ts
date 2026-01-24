import { wrapAuthHandler } from "@packages/arcjet/auth-wrapper";
import { createAuth } from "@packages/authentication/server";
import { env } from "@packages/environment/server";
import { db } from "./database";

const authInstance = createAuth({
   db,
   env,
});

const protectedHandler = await wrapAuthHandler(authInstance);

export const auth = {
   ...authInstance,
   handler: protectedHandler,
};
