import { createAuth } from "@packages/authentication/server";
import { env } from "../config/env";
import { db } from "./database";
import { getPaymentClient } from "@packages/payment/client";
const polarClient = getPaymentClient(env.POLAR_ACCESS_TOKEN);

export const auth = createAuth({
   db,
   env,
   polarClient,
});
